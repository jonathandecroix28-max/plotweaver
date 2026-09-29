import { chapterService } from '../modules/chapters/services/chapterService';
import type { ChapterResponse } from '../types/chapter';
import { offlineBookService } from './offlineBookService';
import {
  getDb,
  rwTx,
  isTempId,
  newTempId,
  httpStatus,
  normalizeChapter,
  queueOp,
  getOps,
  clearOp,
  clearOpsFor,
  mergeServerSnapshot,
  remapChapterId,
  type RwTx,
} from '../db/plotweaverDb';

let chapterSyncPromise: Promise<void> | null = null;

function deduplicateChapters(chapters: ChapterResponse[]): ChapterResponse[] {
  const seenIds = new Set<number>();
  const seenBookAndChapterNumber = new Set<string>();
  const unique: ChapterResponse[] = [];

  for (const c of chapters) {
    const bId = Number(c.book_id);
    const cNum = Number(c.chapter_number);
    const bookChapterKey = `${bId}-${cNum}`;

    if (seenIds.has(c.id)) continue;

    if (seenBookAndChapterNumber.has(bookChapterKey)) {
      const existingIndex = unique.findIndex(
        (item) => Number(item.book_id) === bId && Number(item.chapter_number) === cNum
      );
      if (existingIndex !== -1) {
        const existing = unique[existingIndex];
        if (existing.id > 1000000000 && c.id <= 1000000000) {
          seenIds.delete(existing.id);
          seenIds.add(c.id);
          unique[existingIndex] = c;
        }
      }
      continue;
    }

    seenIds.add(c.id);
    seenBookAndChapterNumber.add(bookChapterKey);
    unique.push(c);
  }
  return unique;
}

const byChapterNumber = (a: ChapterResponse, b: ChapterResponse) =>
  Number(a.chapter_number) - Number(b.chapter_number);

async function replaceChapter(tempId: number, serverChapter: ChapterResponse) {
  const server = normalizeChapter(serverChapter);
  const tx: RwTx = await rwTx();
  const store = tx.objectStore('chapters');

  await store.delete(tempId);
  const sameSlot = (await store.index('by_book').getAll(server.book_id)).filter(
    (c) =>
      c.id !== server.id &&
      isTempId(c.id) &&
      Number(c.chapter_number) === Number(server.chapter_number)
  );
  for (const c of sameSlot) await store.delete(c.id);
  await store.put(server);
  await remapChapterId(tx, tempId, server.id);
  await tx.done;
}

export const offlineChapterService = {
  async getLocalChapters(): Promise<ChapterResponse[]> {
    const db = await getDb();
    return deduplicateChapters(await db.getAll('chapters'));
  },

  async getAll(): Promise<ChapterResponse[]> {
    try {
      await this.syncToServer();
      const serverChapters = await chapterService.getAll();

      if (Array.isArray(serverChapters)) {
        return await mergeServerSnapshot('chapter', serverChapters, {
          normalize: normalizeChapter,
          pendingPosition: 'end',
          finalize: deduplicateChapters,
        });
      }
    } catch (error) {
      console.warn('Mode hors-ligne actif : utilisation du stockage local.');
    }

    return this.getLocalChapters();
  },

  async getByBookId(bookId: number): Promise<ChapterResponse[]> {
    try {
      await this.getAll();
    } catch (e) {
    }

    const db = await getDb();
    const chapters = await db.getAllFromIndex('chapters', 'by_book', Number(bookId));
    return deduplicateChapters(chapters).sort(byChapterNumber);
  },

  async getById(id: number): Promise<ChapterResponse> {
    const db = await getDb();
    const chapter = await db.get('chapters', id);
    if (!chapter) throw new Error('Chapitre introuvable.');
    return chapter;
  },

  async create(
    bookId: number,
    title: string,
    chapterNumber: number,
    content: string = ''
  ): Promise<ChapterResponse[]> {
    const db = await getDb();

    const tempChapter: ChapterResponse = {
      id: newTempId(),
      book_id: bookId,
      title,
      content,
      chapter_number: chapterNumber,
      book_title: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existing = await db.getAllFromIndex('chapters', 'by_book', Number(bookId));
    const slotTaken = existing.some((c) => Number(c.chapter_number) === Number(chapterNumber));
    if (!slotTaken) await db.put('chapters', tempChapter);

    if (!isTempId(bookId)) {
      try {
        const createdServerChapter = await chapterService.create({
          book_id: bookId,
          title,
          content,
          chapter_number: chapterNumber,
        });
        await replaceChapter(tempChapter.id, createdServerChapter);
      } catch (err) {
        console.log('Chapitre enregistré localement en attente de synchronisation.');
      }
    }

    const chapters = await db.getAllFromIndex('chapters', 'by_book', Number(bookId));
    return deduplicateChapters(chapters).sort(byChapterNumber);
  },

  async update(id: number, title: string, content: string): Promise<ChapterResponse> {
    const db = await getDb();
    const current = await db.get('chapters', id);
    if (!current) throw new Error('Chapitre introuvable.');

    const updatedChapter: ChapterResponse = {
      ...current,
      title,
      content,
      updated_at: new Date().toISOString(),
    };

    const tx = await rwTx();
    await tx.objectStore('chapters').put(updatedChapter);
    await queueOp(tx, 'chapter', 'update', id);
    await tx.done;

    if (!isTempId(id) && !isTempId(current.book_id)) {
      try {
        const serverUpdated = normalizeChapter(
          await chapterService.update(id, {
            book_id: Number(current.book_id),
            chapter_number: Number(current.chapter_number),
            title,
            content,
          })
        );
        await db.put('chapters', serverUpdated);
        await clearOpsFor('chapter', 'update', id);
        return serverUpdated;
      } catch (err: any) {
        console.error('🚨 ERREUR SERVEUR LORS DU PUT :', err.response?.data || err.message);
      }
    }

    return updatedChapter;
  },

  async remove(id: number): Promise<boolean> {
    const tx = await rwTx();
    await tx.objectStore('chapters').delete(id);
    await queueOp(tx, 'chapter', 'delete', id);
    await tx.done;

    if (isTempId(id)) return true;

    try {
      await chapterService.delete(id);
      await clearOpsFor('chapter', 'delete', id);
      return true;
    } catch (err) {
      if (httpStatus(err) === 404) {
        await clearOpsFor('chapter', 'delete', id);
        return true;
      }
      console.log('Suppression enregistrée en local (serveur injoignable).');
      return false;
    }
  },

  async syncToServer(): Promise<void> {
    if (chapterSyncPromise) return chapterSyncPromise;

    chapterSyncPromise = this._doSync().finally(() => {
      chapterSyncPromise = null;
    });
    return chapterSyncPromise;
  },

  async _doSync(): Promise<void> {
    try {
      await offlineBookService.syncToServer();
    } catch (e) {
      console.warn('Synchro des livres ignorée temporairement.');
    }

    const db = await getDb();

    for (const op of await getOps('chapter', 'delete')) {
      try {
        await chapterService.delete(op.entityId);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    for (const op of await getOps('chapter', 'update')) {
      const local = await db.get('chapters', op.entityId);
      if (!local) {
        await clearOp(op.key!);
        continue;
      }
      if (isTempId(local.book_id)) continue;
      try {
        const serverUpdated = normalizeChapter(
          await chapterService.update(local.id, {
            book_id: Number(local.book_id),
            chapter_number: Number(local.chapter_number),
            title: local.title,
            content: local.content ?? '',
          })
        );
        await db.put('chapters', serverUpdated);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    const pending = (await db.getAll('chapters')).filter((c) => isTempId(c.id));
    if (pending.length === 0) return;

    let serverChapters: ChapterResponse[];
    try {
      const res = await chapterService.getAll();
      if (!Array.isArray(res)) return;
      serverChapters = res;
    } catch (e) {
      return;
    }

    for (const chapter of pending) {
      if (isTempId(chapter.book_id)) {
        console.log(`Chapitre "${chapter.title}" en attente de la synchro de son livre.`);
        continue;
      }

      const existingOnServer = serverChapters.find(
        (s) =>
          Number(s.book_id) === Number(chapter.book_id) &&
          Number(s.chapter_number) === Number(chapter.chapter_number)
      );

      if (existingOnServer) {
        await replaceChapter(chapter.id, existingOnServer);
        continue;
      }

      try {
        const created = await chapterService.create({
          book_id: Number(chapter.book_id),
          title: chapter.title,
          content: chapter.content ?? '',
          chapter_number: Number(chapter.chapter_number),
        });
        serverChapters.push(created);
        await replaceChapter(chapter.id, created);
      } catch (err) {
        console.warn(`Serveur indisponible pour synchroniser le chapitre : ${chapter.title}`);
      }
    }
  },
};