import { chapterVersionService } from '../modules/chapters/services/chapterVersionService';
import type { ChapterVersionResponse, ChapterVersionUpsertRequest } from '../types/chapterVersion';
import { offlineChapterService } from './offlineChapterService';
import {
  getDb,
  rwTx,
  isTempId,
  newTempId,
  httpStatus,
  normalizeChapterVersion,
  queueOp,
  getOps,
  clearOp,
  clearOpsFor,
  mergeServerSnapshot,
} from '../db/plotweaverDb';

let chapterVersionSyncPromise: Promise<void> | null = null;

const byVersionNumber = (a: ChapterVersionResponse, b: ChapterVersionResponse) =>
  Number(a.versionNumber) - Number(b.versionNumber);

function deduplicateVersions(versions: ChapterVersionResponse[]): ChapterVersionResponse[] {
  const seenKeys = new Set<string>();
  const unique: ChapterVersionResponse[] = [];

  for (const version of versions) {
    const key = `${version.chapterId}-${version.versionNumber}`;
    const existingIndex = unique.findIndex(
      (item) => `${item.chapterId}-${item.versionNumber}` === key
    );

    if (existingIndex !== -1) {
      const existing = unique[existingIndex];
      if (existing.id > 1_000_000_000 && version.id <= 1_000_000_000) {
        unique[existingIndex] = version;
      }
      continue;
    }

    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    unique.push(version);
  }

  return unique.sort(byVersionNumber);
}

function dependsOnPendingChapter(version: ChapterVersionResponse): boolean {
  return isTempId(version.chapterId);
}

async function replaceVersion(tempId: number, serverVersion: ChapterVersionResponse) {
  const tx = await rwTx();
  await tx.objectStore('chapterVersions').delete(tempId);
  await tx.objectStore('chapterVersions').put(normalizeChapterVersion(serverVersion));
  await tx.done;
}

function toPayload(version: ChapterVersionResponse): ChapterVersionUpsertRequest {
  return {
    chapterId: Number(version.chapterId),
    versionNumber: Number(version.versionNumber),
    name: version.name,
    content: version.content,
  };
}

export const offlineChapterVersionService = {
  async getLocalVersions(): Promise<ChapterVersionResponse[]> {
    const db = await getDb();
    return deduplicateVersions(await db.getAll('chapterVersions'));
  },

  async getAll(): Promise<ChapterVersionResponse[]> {
    try {
      await this.syncToServer();
      const serverVersions = await chapterVersionService.getAll();
      if (Array.isArray(serverVersions)) {
        return await mergeServerSnapshot('chapterVersion', serverVersions, {
          normalize: normalizeChapterVersion,
          pendingPosition: 'end',
          finalize: deduplicateVersions,
        });
      }
    } catch (error) {
      console.warn('Mode hors-ligne actif : utilisation du stockage local pour les versions de chapitre.');
    }

    return this.getLocalVersions();
  },

  async getByChapterId(chapterId: number): Promise<ChapterVersionResponse[]> {
    await this.getAll();
    const db = await getDb();
    const versions = await db.getAllFromIndex('chapterVersions', 'by_chapter', Number(chapterId));
    return deduplicateVersions(versions);
  },

  async getById(id: number): Promise<ChapterVersionResponse> {
    const db = await getDb();
    const version = await db.get('chapterVersions', id);
    if (!version) throw new Error('Version de chapitre introuvable.');
    return version;
  },

  async getByChapterIdAndNumber(chapterId: number, versionNumber: number): Promise<ChapterVersionResponse> {
    const versions = await this.getByChapterId(chapterId);
    const version = versions.find((item) => Number(item.versionNumber) === Number(versionNumber));
    if (!version) throw new Error('Version de chapitre introuvable.');
    return version;
  },

  async create(data: ChapterVersionUpsertRequest): Promise<ChapterVersionResponse[]> {
    const db = await getDb();

    const tempVersion: ChapterVersionResponse = {
      id: newTempId(),
      chapterId: data.chapterId,
      versionNumber: data.versionNumber,
      name: data.name,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put('chapterVersions', tempVersion);

    if (!dependsOnPendingChapter(tempVersion)) {
      try {
        const createdServerVersion = await chapterVersionService.create(data);
        await replaceVersion(tempVersion.id, createdServerVersion);
      } catch (err) {
        console.log('Version de chapitre enregistrée localement en attente de synchronisation.');
      }
    }

    return this.getByChapterId(data.chapterId);
  },

  async update(id: number, data: ChapterVersionUpsertRequest): Promise<ChapterVersionResponse[]> {
    const db = await getDb();
    const current = await db.get('chapterVersions', id);
    if (!current) throw new Error('Version de chapitre introuvable.');

    const updatedVersion: ChapterVersionResponse = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const tx = await rwTx();
    await tx.objectStore('chapterVersions').put(updatedVersion);
    await queueOp(tx, 'chapterVersion', 'update', id);
    await tx.done;

    if (!isTempId(id) && !dependsOnPendingChapter(updatedVersion)) {
      try {
        const serverUpdated = normalizeChapterVersion(await chapterVersionService.update(id, toPayload(updatedVersion)));
        await db.put('chapterVersions', serverUpdated);
        await clearOpsFor('chapterVersion', 'update', id);
      } catch (err) {
        console.log('Mise à jour de version enregistrée en local.');
      }
    }

    return this.getByChapterId(updatedVersion.chapterId);
  },

  async remove(id: number): Promise<boolean> {
    const tx = await rwTx();
    await tx.objectStore('chapterVersions').delete(id);
    await queueOp(tx, 'chapterVersion', 'delete', id);
    await tx.done;

    if (isTempId(id)) return true;

    try {
      await chapterVersionService.delete(id);
      await clearOpsFor('chapterVersion', 'delete', id);
      return true;
    } catch (err) {
      if (httpStatus(err) === 404) {
        await clearOpsFor('chapterVersion', 'delete', id);
        return true;
      }
      console.log('Suppression de version enregistrée en local (serveur injoignable).');
      return false;
    }
  },

  async syncToServer(): Promise<void> {
    if (chapterVersionSyncPromise) return chapterVersionSyncPromise;

    chapterVersionSyncPromise = this._doSync().finally(() => {
      chapterVersionSyncPromise = null;
    });
    return chapterVersionSyncPromise;
  },

  async _doSync(): Promise<void> {
    try {
      await offlineChapterService.syncToServer();
    } catch (e) {
      console.warn('Synchro des chapitres ignorée temporairement.');
    }

    const db = await getDb();

    for (const op of await getOps('chapterVersion', 'delete')) {
      try {
        await chapterVersionService.delete(op.entityId);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    for (const op of await getOps('chapterVersion', 'update')) {
      const local = await db.get('chapterVersions', op.entityId);
      if (!local) {
        await clearOp(op.key!);
        continue;
      }
      if (dependsOnPendingChapter(local)) continue;
      try {
        const serverUpdated = normalizeChapterVersion(await chapterVersionService.update(local.id, toPayload(local)));
        await db.put('chapterVersions', serverUpdated);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    const pendingIds = (await db.getAll('chapterVersions')).filter((item) => isTempId(item.id)).map((item) => item.id);

    for (const tempId of pendingIds) {
      const version = await db.get('chapterVersions', tempId);
      if (!version) continue;

      if (dependsOnPendingChapter(version)) {
        console.log(`Version de chapitre "${version.name}" en attente de la synchro du chapitre parent.`);
        continue;
      }

      try {
        const created = await chapterVersionService.create(toPayload(version));
        await replaceVersion(version.id, created);
      } catch (err) {
        console.warn(`Échec synchro version chapitre ${version.name}`);
      }
    }
  },
};