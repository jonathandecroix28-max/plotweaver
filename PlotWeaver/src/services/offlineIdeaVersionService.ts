import { ideaVersionService } from '../modules/ideas/services/IdeaVersionService';
import type { IdeaVersionResponse, IdeaVersionUpsertRequest } from '../types/ideaVersion';
import { offlineIdeaService } from './offlineIdeaService';
import {
  getDb,
  rwTx,
  isTempId,
  newTempId,
  httpStatus,
  normalizeIdeaVersion,
  queueOp,
  getOps,
  clearOp,
  clearOpsFor,
  mergeServerSnapshot,
} from '../db/plotweaverDb';

let ideaVersionSyncPromise: Promise<void> | null = null;

const byVersionNumber = (a: IdeaVersionResponse, b: IdeaVersionResponse) =>
  Number(a.versionNumber) - Number(b.versionNumber);

function deduplicateVersions(versions: IdeaVersionResponse[]): IdeaVersionResponse[] {
  const unique: IdeaVersionResponse[] = [];

  for (const version of versions) {
    const key = `${version.ideaId}-${version.versionNumber}`;
    const existingIndex = unique.findIndex((item) => `${item.ideaId}-${item.versionNumber}` === key);

    if (existingIndex !== -1) {
      const existing = unique[existingIndex];
      if (existing.id > 1_000_000_000 && version.id <= 1_000_000_000) {
        unique[existingIndex] = version;
      }
      continue;
    }

    unique.push(version);
  }

  return unique.sort(byVersionNumber);
}

function dependsOnPendingIdea(version: IdeaVersionResponse): boolean {
  return isTempId(version.ideaId);
}

async function replaceVersion(tempId: number, serverVersion: IdeaVersionResponse) {
  const tx = await rwTx();
  await tx.objectStore('ideaVersions').delete(tempId);
  await tx.objectStore('ideaVersions').put(normalizeIdeaVersion(serverVersion));
  await tx.done;
}

function toPayload(version: IdeaVersionResponse): IdeaVersionUpsertRequest {
  return {
    ideaId: Number(version.ideaId),
    versionNumber: Number(version.versionNumber),
    name: version.name,
    description: version.description,
  };
}

export const offlineIdeaVersionService = {
  async getLocalVersions(): Promise<IdeaVersionResponse[]> {
    const db = await getDb();
    return deduplicateVersions(await db.getAll('ideaVersions'));
  },

  async getAll(): Promise<IdeaVersionResponse[]> {
    try {
      await this.syncToServer();
      const serverVersions = await ideaVersionService.getAll();
      if (Array.isArray(serverVersions)) {
        return await mergeServerSnapshot('ideaVersion', serverVersions, {
          normalize: normalizeIdeaVersion,
          pendingPosition: 'end',
          finalize: deduplicateVersions,
        });
      }
    } catch (error) {
      console.warn('Mode hors-ligne actif : utilisation du stockage local pour les versions d’idée.');
    }

    return this.getLocalVersions();
  },

  async getByIdeaId(ideaId: number): Promise<IdeaVersionResponse[]> {
    await this.getAll();
    const db = await getDb();
    const versions = await db.getAllFromIndex('ideaVersions', 'by_idea', Number(ideaId));
    return deduplicateVersions(versions);
  },

  async getById(id: number): Promise<IdeaVersionResponse> {
    const db = await getDb();
    const version = await db.get('ideaVersions', id);
    if (!version) throw new Error('Version d’idée introuvable.');
    return version;
  },

  async getByIdeaIdAndNumber(ideaId: number, versionNumber: number): Promise<IdeaVersionResponse> {
    const versions = await this.getByIdeaId(ideaId);
    const version = versions.find((item) => Number(item.versionNumber) === Number(versionNumber));
    if (!version) throw new Error('Version d’idée introuvable.');
    return version;
  },

  async create(data: IdeaVersionUpsertRequest): Promise<IdeaVersionResponse[]> {
    const db = await getDb();

    const tempVersion: IdeaVersionResponse = {
      id: newTempId(),
      ideaId: data.ideaId,
      versionNumber: data.versionNumber,
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put('ideaVersions', tempVersion);

    if (!dependsOnPendingIdea(tempVersion)) {
      try {
        const createdServerVersion = await ideaVersionService.create(data);
        await replaceVersion(tempVersion.id, createdServerVersion);
      } catch (err) {
        console.log('Version d’idée enregistrée localement en attente de synchronisation.');
      }
    }

    return this.getByIdeaId(data.ideaId);
  },

  async update(id: number, data: IdeaVersionUpsertRequest): Promise<IdeaVersionResponse[]> {
    const db = await getDb();
    const current = await db.get('ideaVersions', id);
    if (!current) throw new Error('Version d’idée introuvable.');

    const updatedVersion: IdeaVersionResponse = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const tx = await rwTx();
    await tx.objectStore('ideaVersions').put(updatedVersion);
    await queueOp(tx, 'ideaVersion', 'update', id);
    await tx.done;

    if (!isTempId(id) && !dependsOnPendingIdea(updatedVersion)) {
      try {
        const serverUpdated = normalizeIdeaVersion(await ideaVersionService.update(id, toPayload(updatedVersion)));
        await db.put('ideaVersions', serverUpdated);
        await clearOpsFor('ideaVersion', 'update', id);
      } catch (err) {
        console.log('Mise à jour de version d’idée enregistrée en local.');
      }
    }

    return this.getByIdeaId(updatedVersion.ideaId);
  },

  async remove(id: number): Promise<boolean> {
    const tx = await rwTx();
    await tx.objectStore('ideaVersions').delete(id);
    await queueOp(tx, 'ideaVersion', 'delete', id);
    await tx.done;

    if (isTempId(id)) return true;

    try {
      await ideaVersionService.delete(id);
      await clearOpsFor('ideaVersion', 'delete', id);
      return true;
    } catch (err) {
      if (httpStatus(err) === 404) {
        await clearOpsFor('ideaVersion', 'delete', id);
        return true;
      }
      console.log('Suppression de version d’idée enregistrée en local (serveur injoignable).');
      return false;
    }
  },

  async syncToServer(): Promise<void> {
    if (ideaVersionSyncPromise) return ideaVersionSyncPromise;

    ideaVersionSyncPromise = this._doSync().finally(() => {
      ideaVersionSyncPromise = null;
    });
    return ideaVersionSyncPromise;
  },

  async _doSync(): Promise<void> {
    try {
      await offlineIdeaService.syncToServer();
    } catch (e) {
      console.warn('Synchro des idées ignorée temporairement.');
    }

    const db = await getDb();

    for (const op of await getOps('ideaVersion', 'delete')) {
      try {
        await ideaVersionService.delete(op.entityId);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    for (const op of await getOps('ideaVersion', 'update')) {
      const local = await db.get('ideaVersions', op.entityId);
      if (!local) {
        await clearOp(op.key!);
        continue;
      }
      if (dependsOnPendingIdea(local)) continue;
      try {
        const serverUpdated = normalizeIdeaVersion(await ideaVersionService.update(local.id, toPayload(local)));
        await db.put('ideaVersions', serverUpdated);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    const pendingIds = (await db.getAll('ideaVersions')).filter((item) => isTempId(item.id)).map((item) => item.id);

    for (const tempId of pendingIds) {
      const version = await db.get('ideaVersions', tempId);
      if (!version) continue;

      if (dependsOnPendingIdea(version)) {
        console.log(`Version d’idée "${version.name}" en attente de la synchro de l’idée parente.`);
        continue;
      }

      try {
        const created = await ideaVersionService.create(toPayload(version));
        await replaceVersion(version.id, created);
      } catch (err) {
        console.warn(`Échec synchro version idée ${version.name}`);
      }
    }
  },
};