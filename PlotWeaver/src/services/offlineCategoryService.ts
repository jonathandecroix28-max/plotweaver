import { categoryService } from '../modules/categories/services/categoryService';
import type { CategoryResponse, CategoryUpsertRequest } from '../types/category';
import {
  getDb,
  rwTx,
  isTempId,
  newTempId,
  httpStatus,
  sortNewestFirst,
  queueOp,
  getOps,
  clearOp,
  clearOpsFor,
  mergeServerSnapshot,
  remapCategoryId,
} from '../db/plotweaverDb';

let categorySyncPromise: Promise<void> | null = null;

async function replaceCategory(tempId: number, serverCategory: CategoryResponse) {
  const tx = await rwTx();
  await tx.objectStore('categories').delete(tempId);
  await tx.objectStore('categories').put(serverCategory);
  await remapCategoryId(tx, tempId, serverCategory.id);
  await tx.done;
}

export const offlineCategoryService = {
  async getLocalCategories(): Promise<CategoryResponse[]> {
    const db = await getDb();
    return sortNewestFirst(await db.getAll('categories'));
  },

  async getAll(): Promise<CategoryResponse[]> {
    try {
      await this.syncToServer();
      const serverCategories = await categoryService.getAll();
      if (Array.isArray(serverCategories)) {
        return await mergeServerSnapshot('category', serverCategories);
      }
    } catch (error) {
      console.warn('Mode hors-ligne actif : utilisation du stockage local pour les catégories.');
    }

    return this.getLocalCategories();
  },

  async getById(id: number): Promise<CategoryResponse> {
    const db = await getDb();
    const category = await db.get('categories', id);
    if (!category) throw new Error('Catégorie introuvable.');
    return category;
  },

  async create(data: CategoryUpsertRequest): Promise<CategoryResponse[]> {
    const db = await getDb();

    const tempCategory: CategoryResponse = {
      id: newTempId(),
      name: data.name,
      color: data.color || '#b45309',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.put('categories', tempCategory);

    try {
      const createdServerCategory = await categoryService.create(data);
      await replaceCategory(tempCategory.id, createdServerCategory);
    } catch (err) {
      console.log('Catégorie enregistrée localement en attente de synchronisation.');
    }

    return this.getLocalCategories();
  },

  async remove(id: number): Promise<CategoryResponse[]> {
    const db = await getDb();
    const existing = await db.get('categories', id);

    const tx = await rwTx();
    await tx.objectStore('categories').delete(id);
    await queueOp(tx, 'category', 'delete', id);
    await tx.done;

    if (!isTempId(id)) {
      try {
        await categoryService.delete(id);
        await clearOpsFor('category', 'delete', id);
      } catch (err) {
        const status = httpStatus(err);
        if (status === 409) {
          await clearOpsFor('category', 'delete', id);
          if (existing) await db.put('categories', existing);
          throw new Error('Cette catégorie contient encore des idées et ne peut pas être supprimée.');
        }
        if (status === 404) {
          await clearOpsFor('category', 'delete', id);
        }
      }
    }

    return this.getLocalCategories();
  },

  async update(id: number, data: CategoryUpsertRequest): Promise<CategoryResponse[]> {
    const db = await getDb();
    const current = await db.get('categories', id);
    if (!current) throw new Error('Catégorie introuvable.');

    const updatedCategory: CategoryResponse = {
      ...current,
      name: data.name,
      color: data.color || '#b45309',
      updatedAt: new Date().toISOString(),
    };

    const tx = await rwTx();
    await tx.objectStore('categories').put(updatedCategory);
    await queueOp(tx, 'category', 'update', id);
    await tx.done;

    if (!isTempId(id)) {
      try {
        const serverUpdated = await categoryService.update(id, data);
        await db.put('categories', serverUpdated);
        await clearOpsFor('category', 'update', id);
      } catch (err) {
      }
    }

    return this.getLocalCategories();
  },

  async syncToServer(): Promise<void> {
    if (categorySyncPromise) return categorySyncPromise;

    categorySyncPromise = this._doSync().finally(() => {
      categorySyncPromise = null;
    });
    return categorySyncPromise;
  },

  async _doSync(): Promise<void> {
    const db = await getDb();

    for (const op of await getOps('category', 'delete')) {
      try {
        await categoryService.delete(op.entityId);
        await clearOp(op.key!);
      } catch (err) {
        const status = httpStatus(err);
        if (status === 404) {
          console.log(`La catégorie ${op.entityId} n'existe plus sur le serveur.`);
          await clearOp(op.key!);
        } else if (status === 409) {
          console.warn(`La catégorie ${op.entityId} contient encore des idées, suppression annulée.`);
          await clearOp(op.key!);
        }
      }
    }

    for (const op of await getOps('category', 'update')) {
      const local = await db.get('categories', op.entityId);
      if (!local) {
        await clearOp(op.key!);
        continue;
      }
      try {
        const serverUpdated = await categoryService.update(local.id, {
          name: local.name,
          color: local.color,
        });
        await db.put('categories', serverUpdated);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    const pending = (await db.getAll('categories')).filter((c) => isTempId(c.id));
    if (pending.length === 0) return;

    let serverCategories: CategoryResponse[];
    try {
      const res = await categoryService.getAll();
      if (!Array.isArray(res)) return;
      serverCategories = res;
    } catch (err) {
      return;
    }

    for (const cat of pending) {
      const existingOnServer = serverCategories.find(
        (s) => s.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
      );

      if (existingOnServer) {
        await replaceCategory(cat.id, existingOnServer);
        continue;
      }

      try {
        const created = await categoryService.create({ name: cat.name, color: cat.color });
        serverCategories.push(created);
        await replaceCategory(cat.id, created);
      } catch (err) {
        console.warn(`Impossible de synchroniser la catégorie : ${cat.name}`);
      }
    }
  },
};