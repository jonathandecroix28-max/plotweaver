import { ideaService } from '../modules/ideas/services/IdeaService';
import { offlineCategoryService } from './offlineCategoryService';
import { offlineBookService } from './offlineBookService';
import type { IdeaResponse, IdeaUpsertRequest } from '../types/idea';
import {
  getDb,
  rwTx,
  isTempId,
  newTempId,
  httpStatus,
  normalizeIdea,
  sortNewestFirst,
  queueOp,
  getOps,
  clearOp,
  clearOpsFor,
  mergeServerSnapshot,
  remapIdeaId,
} from '../db/plotweaverDb';

let ideaSyncPromise: Promise<void> | null = null;

const toPayload = (i: {
  name: string;
  description?: string;
  status?: string;
  bookId?: number | null;
  categoryId: number;
}) =>
  ({
    name: i.name,
    description: i.description,
    bookId: i.bookId ?? null,
    categoryId: i.categoryId,
    status: i.status || 'draft',
  }) as IdeaUpsertRequest;

const dependsOnPendingItem = (i: IdeaResponse) => isTempId(i.categoryId) || isTempId(i.bookId);

async function replaceIdea(tempId: number, serverIdea: IdeaResponse) {
  const tx = await rwTx();
  await tx.objectStore('ideas').delete(tempId);
  await tx.objectStore('ideas').put(normalizeIdea(serverIdea));
  await remapIdeaId(tx, tempId, serverIdea.id);
  await tx.done;
}

export const offlineIdeaService = {
  async getLocalIdeas(): Promise<IdeaResponse[]> {
    const db = await getDb();
    return sortNewestFirst(await db.getAll('ideas'));
  },

  async getAll(): Promise<IdeaResponse[]> {
    try {
      await this.syncToServer();
      const serverIdeas = await ideaService.getAll();
      if (Array.isArray(serverIdeas)) {
        return await mergeServerSnapshot('idea', serverIdeas, { normalize: normalizeIdea });
      }
    } catch (error) {
      console.warn('Mode hors-ligne actif : utilisation du stockage local pour les idées.');
    }

    return this.getLocalIdeas();
  },

  async getById(id: number): Promise<IdeaResponse> {
    const db = await getDb();
    const idea = await db.get('ideas', id);
    if (!idea) throw new Error('Idée introuvable.');
    return idea;
  },

  async getByBookId(bookId: number): Promise<IdeaResponse[]> {
    await this.getAll(); 
    const db = await getDb();
    return sortNewestFirst(await db.getAllFromIndex('ideas', 'by_book', Number(bookId)));
  },

  async create(data: IdeaUpsertRequest): Promise<IdeaResponse[]> {
    const db = await getDb();

    const tempIdea: IdeaResponse = {
      id: newTempId(),
      name: data.name,
      description: data.description,
      status: data.status || 'draft',
      bookId: data.bookId ?? null,
      categoryId: data.categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.put('ideas', tempIdea);

    if (!dependsOnPendingItem(tempIdea)) {
      try {
        const createdServerIdea = await ideaService.create(toPayload(tempIdea));
        await replaceIdea(tempIdea.id, createdServerIdea);
      } catch (err) {
        console.log('Idée enregistrée localement en attente de synchronisation.');
      }
    }

    return this.getLocalIdeas();
  },

  async remove(id: number): Promise<IdeaResponse[]> {
    const tx = await rwTx();
    await tx.objectStore('ideas').delete(id);
    await queueOp(tx, 'idea', 'delete', id); 
    await tx.done;

    if (!isTempId(id)) {
      try {
        await ideaService.delete(id);
        await clearOpsFor('idea', 'delete', id);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOpsFor('idea', 'delete', id);
      }
    }

    return this.getLocalIdeas();
  },

  async update(id: number, data: IdeaUpsertRequest): Promise<IdeaResponse[]> {
    const db = await getDb();
    const current = await db.get('ideas', id);
    if (!current) throw new Error('Idée introuvable.');

    const updatedIdea: IdeaResponse = {
      ...current,
      ...data,
      status: data.status ?? current.status,
      bookId: data.bookId ?? null,
      updatedAt: new Date().toISOString(),
    };

    const tx = await rwTx();
    await tx.objectStore('ideas').put(updatedIdea);
    await queueOp(tx, 'idea', 'update', id);
    await tx.done;

    if (!isTempId(id) && !dependsOnPendingItem(updatedIdea)) {
      try {
        const serverUpdated = await ideaService.update(id, toPayload(updatedIdea));
        await db.put('ideas', normalizeIdea(serverUpdated));
        await clearOpsFor('idea', 'update', id);
      } catch (err) {
        console.log('Mise à jour enregistrée en local.');
      }
    }

    return this.getLocalIdeas();
  },

  async syncToServer(): Promise<void> {
    if (ideaSyncPromise) return ideaSyncPromise;

    ideaSyncPromise = this._doSync().finally(() => {
      ideaSyncPromise = null;
    });
    return ideaSyncPromise;
  },

  async _doSync(): Promise<void> {
    try {
      await offlineCategoryService.syncToServer();
    } catch (e) {
      console.warn('Synchro des catégories ignorée temporairement.');
    }
    try {
      await offlineBookService.syncToServer();
    } catch (e) {
      console.warn('Synchro des livres ignorée temporairement.');
    }

    const db = await getDb();

    for (const op of await getOps('idea', 'delete')) {
      try {
        await ideaService.delete(op.entityId);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    for (const op of await getOps('idea', 'update')) {
      const local = await db.get('ideas', op.entityId);
      if (!local) {
        await clearOp(op.key!);
        continue;
      }
      if (dependsOnPendingItem(local)) continue;
      try {
        const serverUpdated = await ideaService.update(local.id, toPayload(local));
        await db.put('ideas', normalizeIdea(serverUpdated));
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    const pendingIds = (await db.getAll('ideas')).filter((i) => isTempId(i.id)).map((i) => i.id);

    for (const tempId of pendingIds) {
      const idea = await db.get('ideas', tempId); 
      if (!idea) continue;

      if (dependsOnPendingItem(idea)) {
        console.log(`Idée "${idea.name}" en attente de la synchro de sa catégorie / son livre.`);
        continue;
      }

      try {
        const created = await ideaService.create(toPayload(idea));
        await replaceIdea(idea.id, created);
      } catch (err) {
        console.warn(`Échec synchro idée ${idea.name}`);
      }
    }
  },
};