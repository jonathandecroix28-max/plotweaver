import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
} from 'idb';
import type { BookResponse } from '../types/book';
import type { ChapterResponse } from '../types/chapter';
import type { IdeaResponse } from '../types/idea';
import type { CategoryResponse } from '../types/category';
import type { ChapterVersionResponse } from '../types/chapterVersion';
import type { IdeaVersionResponse } from '../types/ideaVersion';

/* -------------------------------------------------------------------------- */
/*  IDs temporaires                                                            */
/* -------------------------------------------------------------------------- */

export const TEMP_ID_THRESHOLD = 1_000_000_000;

/** Un id temporaire = créé hors-ligne, pas encore connu du serveur. */
export const isTempId = (id: number | null | undefined): boolean =>
  typeof id === 'number' && id > TEMP_ID_THRESHOLD;

let lastTempId = 0;
/** Date.now() avec garantie d'unicité (deux créations dans la même ms). */
export function newTempId(): number {
  const now = Date.now();
  lastTempId = now > lastTempId ? now : lastTempId + 1;
  return lastTempId;
}

/* -------------------------------------------------------------------------- */
/*  Schéma                                                                     */
/* -------------------------------------------------------------------------- */

export type Entity = 'book' | 'chapter' | 'idea' | 'category' | 'chapterVersion' | 'ideaVersion';

export interface OutboxOp {
  key?: number; // autoIncrement
  entity: Entity;
  type: 'update' | 'delete';
  entityId: number; // id serveur (les créations sont repérées par leur id temporaire)
  createdAt: number;
}

interface PlotweaverDB extends DBSchema {
  books: { key: number; value: BookResponse };
  chapters: { key: number; value: ChapterResponse; indexes: { by_book: number } };
  chapterVersions: {
    key: number;
    value: ChapterVersionResponse;
    indexes: { by_chapter: number };
  };
  ideas: {
    key: number;
    value: IdeaResponse;
    indexes: { by_book: number; by_category: number };
  };
  ideaVersions: {
    key: number;
    value: IdeaVersionResponse;
    indexes: { by_idea: number };
  };
  categories: { key: number; value: CategoryResponse };
  outbox: { key: number; value: OutboxOp; indexes: { by_entity: Entity } };
}

const ALL_STORES = ['books', 'chapters', 'chapterVersions', 'ideas', 'ideaVersions', 'categories', 'outbox'] as const;
export type RwTx = IDBPTransaction<PlotweaverDB, typeof ALL_STORES, 'readwrite'>;

let dbPromise: Promise<IDBPDatabase<PlotweaverDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<PlotweaverDB>> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDB<PlotweaverDB>('plotweaver', 2, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('books')) {
            db.createObjectStore('books', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('chapters')) {
            const chapters = db.createObjectStore('chapters', { keyPath: 'id' });
            chapters.createIndex('by_book', 'book_id');
          }

          if (!db.objectStoreNames.contains('chapterVersions')) {
            const chapterVersions = db.createObjectStore('chapterVersions', { keyPath: 'id' });
            chapterVersions.createIndex('by_chapter', 'chapterId');
          }

          if (!db.objectStoreNames.contains('ideas')) {
            const ideas = db.createObjectStore('ideas', { keyPath: 'id' });
            ideas.createIndex('by_book', 'bookId');
            ideas.createIndex('by_category', 'categoryId');
          }

          if (!db.objectStoreNames.contains('ideaVersions')) {
            const ideaVersions = db.createObjectStore('ideaVersions', { keyPath: 'id' });
            ideaVersions.createIndex('by_idea', 'ideaId');
          }

          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('outbox')) {
            const outbox = db.createObjectStore('outbox', {
              keyPath: 'key',
              autoIncrement: true,
            });
            outbox.createIndex('by_entity', 'entity');
          }
        },
      });

      try {
        await migrateFromLocalStorage(db);
      } catch (e) {
        // La migration est atomique : en cas d'échec rien n'est écrit, elle sera retentée.
        console.error('Migration localStorage → IndexedDB échouée (retentée au prochain lancement) :', e);
      }
      return db;
    })();
  }
  return dbPromise;
}

/** Ouvre une transaction en écriture sur tous les stores (écriture locale + outbox atomiques). */
export async function rwTx(): Promise<RwTx> {
  const db = await getDb();
  return db.transaction(ALL_STORES, 'readwrite');
}

/* -------------------------------------------------------------------------- */
/*  Utilitaires                                                                */
/* -------------------------------------------------------------------------- */

export const httpStatus = (err: unknown): number | undefined =>
  (err as any)?.response?.status;

export const sortNewestFirst = <T extends { createdAt?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

/** Les données historiques mélangent bookId / book_id et nombres / chaînes. */
export const normalizeIdea = (i: IdeaResponse): IdeaResponse => {
  const raw = i as any;
  const { book_id: _ignored, ...rest } = raw;
  const b = raw.bookId ?? raw.book_id;
  return { ...rest, bookId: b == null ? null : Number(b) } as IdeaResponse;
};

export const normalizeChapter = (c: ChapterResponse): ChapterResponse => {
  const raw = c as any;
  const { bookId: _ignored, ...rest } = raw;
  return {
    ...rest,
    book_id: Number(raw.book_id ?? raw.bookId),
    chapter_number: Number(raw.chapter_number),
  } as ChapterResponse;
};

export const normalizeChapterVersion = (version: ChapterVersionResponse): ChapterVersionResponse => {
  const raw = version as any;
  return {
    ...raw,
    chapterId: Number(raw.chapterId),
    versionNumber: Number(raw.versionNumber),
    id: Number(raw.id),
  } as ChapterVersionResponse;
};

export const normalizeIdeaVersion = (version: IdeaVersionResponse): IdeaVersionResponse => {
  const raw = version as any;
  return {
    ...raw,
    ideaId: Number(raw.ideaId),
    versionNumber: Number(raw.versionNumber),
    id: Number(raw.id),
  } as IdeaVersionResponse;
};

/* -------------------------------------------------------------------------- */
/*  Outbox (remplace les clés *_deleted / *_pending_updates)                   */
/* -------------------------------------------------------------------------- */

/** À appeler dans la même transaction que l'écriture locale. Ignore les ids temporaires. */
export async function queueOp(
  tx: RwTx,
  entity: Entity,
  type: OutboxOp['type'],
  entityId: number
): Promise<void> {
  if (isTempId(entityId)) return;

  const outbox = tx.objectStore('outbox');
  const mine = (await outbox.index('by_entity').getAll(entity)).filter(
    (o) => o.entityId === entityId
  );

  if (type === 'delete') {
    // une suppression rend les mises à jour en attente inutiles
    for (const o of mine) if (o.type === 'update') await outbox.delete(o.key!);
    if (!mine.some((o) => o.type === 'delete')) {
      await outbox.add({ entity, type, entityId, createdAt: Date.now() });
    }
  } else {
    if (mine.some((o) => o.type === 'delete')) return;
    if (!mine.some((o) => o.type === 'update')) {
      await outbox.add({ entity, type, entityId, createdAt: Date.now() });
    }
  }
}

export async function getOps(entity: Entity, type?: OutboxOp['type']): Promise<OutboxOp[]> {
  const db = await getDb();
  const ops = await db.getAllFromIndex('outbox', 'by_entity', entity);
  return type ? ops.filter((o) => o.type === type) : ops;
}

export async function clearOp(key: number): Promise<void> {
  const db = await getDb();
  await db.delete('outbox', key);
}

export async function clearOpsFor(
  entity: Entity,
  type: OutboxOp['type'],
  entityId: number
): Promise<void> {
  const ops = await getOps(entity, type);
  for (const o of ops) if (o.entityId === entityId) await clearOp(o.key!);
}

/* -------------------------------------------------------------------------- */
/*  Remap d'ids temporaires → ids serveur (dans une transaction existante)     */
/* -------------------------------------------------------------------------- */

export async function remapBookId(tx: RwTx, from: number, to: number): Promise<void> {
  const chapters = tx.objectStore('chapters');
  for (const c of await chapters.index('by_book').getAll(from)) {
    await chapters.put({ ...c, book_id: to });
  }
  const ideas = tx.objectStore('ideas');
  for (const i of await ideas.index('by_book').getAll(from)) {
    await ideas.put({ ...i, bookId: to });
  }
}

export async function remapChapterId(tx: RwTx, from: number, to: number): Promise<void> {
  const versions = tx.objectStore('chapterVersions');
  for (const version of await versions.index('by_chapter').getAll(from)) {
    await versions.put({ ...version, chapterId: to });
  }
}

export async function remapIdeaId(tx: RwTx, from: number, to: number): Promise<void> {
  const versions = tx.objectStore('ideaVersions');
  for (const version of await versions.index('by_idea').getAll(from)) {
    await versions.put({ ...version, ideaId: to });
  }
}

export async function remapCategoryId(tx: RwTx, from: number, to: number): Promise<void> {
  const ideas = tx.objectStore('ideas');
  for (const i of await ideas.index('by_category').getAll(from)) {
    await ideas.put({ ...i, categoryId: to });
  }
}

/* -------------------------------------------------------------------------- */
/*  Fusion "snapshot serveur" ⇄ données locales                                */
/* -------------------------------------------------------------------------- */

const ENTITY_STORE = {
  book: 'books',
  chapter: 'chapters',
  chapterVersion: 'chapterVersions',
  idea: 'ideas',
  ideaVersion: 'ideaVersions',
  category: 'categories',
} as const;

interface AnyStore<T> {
  getAll(): Promise<T[]>;
  clear(): Promise<void>;
  put(value: T): Promise<unknown>;
}

/**
 * Remplace le contenu local par la liste serveur, MAIS :
 *  - retire les éléments dont la suppression est en attente,
 *  - garde la version locale des éléments dont la mise à jour est en attente,
 *  - conserve les éléments créés hors-ligne (id temporaire) pas encore synchronisés.
 * Le tout dans une seule transaction.
 */
export async function mergeServerSnapshot<T extends { id: number }>(
  entity: Entity,
  serverItems: T[],
  opts: {
    normalize?: (item: T) => T;
    pendingPosition?: 'start' | 'end';
    finalize?: (items: T[]) => T[];
  } = {}
): Promise<T[]> {
  const { normalize = (x: T) => x, pendingPosition = 'start', finalize } = opts;

  const tx = await rwTx();
  const store = tx.objectStore(ENTITY_STORE[entity]) as unknown as AnyStore<T>;

  const ops = await tx.objectStore('outbox').index('by_entity').getAll(entity);
  const deleted = new Set(ops.filter((o) => o.type === 'delete').map((o) => o.entityId));
  const updated = new Set(ops.filter((o) => o.type === 'update').map((o) => o.entityId));

  const local = await store.getAll();
  const localById = new Map(local.map((i) => [i.id, i] as const));

  const pending = local.filter((i) => isTempId(i.id)).sort((a, b) => b.id - a.id);
  const fromServer = serverItems
    .filter((i) => !deleted.has(i.id))
    .map((i) => normalize(updated.has(i.id) && localById.has(i.id) ? localById.get(i.id)! : i));

  let merged = pendingPosition === 'start' ? [...pending, ...fromServer] : [...fromServer, ...pending];
  if (finalize) merged = finalize(merged);

  await store.clear();
  for (const item of merged) await store.put(item);
  await tx.done;
  return merged;
}

/* -------------------------------------------------------------------------- */
/*  Migration localStorage → IndexedDB (automatique, une seule fois)           */
/* -------------------------------------------------------------------------- */

const MIGRATED_FLAG = 'plotweaver_idb_migrated_v1';

const LEGACY = {
  books: 'plotweaver_offline_books',
  chapters: 'plotweaver_offline_chapters',
  ideas: 'plotweaver_offline_ideas',
  categories: 'plotweaver_offline_categories',
  deletedBooks: 'plotweaver_deleted_books',
  updatedBooks: 'plotweaver_pending_updates',
  deletedChapters: 'plotweaver_deleted_chapters',
  deletedIdeas: 'plotweaver_deleted_ideas',
  deletedCategories: 'plotweaver_deleted_categories',
  updatedCategories: 'plotweaver_pending_category_updates',
} as const;

function readLegacy<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const withId = <T extends { id?: unknown }>(items: T[]): T[] =>
  items.filter((i) => typeof i?.id === 'number');

async function migrateFromLocalStorage(db: IDBPDatabase<PlotweaverDB>): Promise<void> {
  if (localStorage.getItem(MIGRATED_FLAG)) return;

  const tx = db.transaction(ALL_STORES, 'readwrite');
  const jobs: Promise<unknown>[] = [];

  for (const b of withId(readLegacy<BookResponse>(LEGACY.books))) {
    jobs.push(tx.objectStore('books').put(b));
  }
  for (const c of withId(readLegacy<ChapterResponse>(LEGACY.chapters))) {
    jobs.push(tx.objectStore('chapters').put(normalizeChapter(c)));
  }
  for (const i of withId(readLegacy<IdeaResponse>(LEGACY.ideas))) {
    jobs.push(tx.objectStore('ideas').put(normalizeIdea(i)));
  }
  for (const c of withId(readLegacy<CategoryResponse>(LEGACY.categories))) {
    jobs.push(tx.objectStore('categories').put(c));
  }

  const now = Date.now();
  const enqueue = (entity: Entity, type: OutboxOp['type'], ids: number[]) => {
    for (const entityId of new Set(ids)) {
      if (typeof entityId !== 'number' || isTempId(entityId)) continue;
      jobs.push(tx.objectStore('outbox').add({ entity, type, entityId, createdAt: now }));
    }
  };

  enqueue('book', 'delete', readLegacy<number>(LEGACY.deletedBooks));
  enqueue('book', 'update', readLegacy<number>(LEGACY.updatedBooks));
  enqueue('chapter', 'delete', readLegacy<number>(LEGACY.deletedChapters));
  enqueue('idea', 'delete', readLegacy<number>(LEGACY.deletedIdeas));
  enqueue('category', 'delete', readLegacy<number>(LEGACY.deletedCategories));
  enqueue('category', 'update', readLegacy<number>(LEGACY.updatedCategories));

  jobs.push(tx.done);
  await Promise.all(jobs);

  localStorage.setItem(MIGRATED_FLAG, '1');
}

export function clearLegacyLocalStorage(): void {
  Object.values(LEGACY).forEach((k) => localStorage.removeItem(k));
}