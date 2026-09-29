import { bookService } from '../modules/books/services/bookService';
import type { BookResponse } from '../types/book';
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
  remapBookId,
} from '../db/plotweaverDb';

let bookSyncPromise: Promise<void> | null = null;

async function replaceBook(tempId: number, serverBook: BookResponse) {
  const tx = await rwTx();
  await tx.objectStore('books').delete(tempId);
  await tx.objectStore('books').put(serverBook);
  await remapBookId(tx, tempId, serverBook.id);
  await tx.done;
}

export const offlineBookService = {
  async getLocalBooks(): Promise<BookResponse[]> {
    const db = await getDb();
    return sortNewestFirst(await db.getAll('books'));
  },

  async getAll(): Promise<BookResponse[]> {
    try {
      await this.syncToServer();

      const serverBooks = await bookService.getAll();
      if (Array.isArray(serverBooks)) {
        return await mergeServerSnapshot('book', serverBooks);
      }
    } catch (error) {
      console.warn('Mode hors-ligne actif : utilisation du stockage local.');
    }

    return this.getLocalBooks();
  },

  async getById(id: number): Promise<BookResponse> {
    const db = await getDb();
    const book = await db.get('books', id);
    if (!book) throw new Error('Livre introuvable.');
    return book;
  },

  async create(title: string, description?: string, coverImage?: string): Promise<BookResponse[]> {
    const db = await getDb();

    const tempBook: BookResponse = {
      id: newTempId(),
      title,
      description,
      coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapterCount: 0,
    };
    await db.put('books', tempBook);

    try {
      const createdServerBook = await bookService.create({ title, description, coverImage });
      await replaceBook(tempBook.id, createdServerBook);
    } catch (err) {
      console.log('Livre enregistré localement en attente de synchronisation.');
    }

    return this.getLocalBooks();
  },

  async remove(id: number): Promise<BookResponse[]> {
    const tx = await rwTx();

    await tx.objectStore('books').delete(id);

    const ideas = tx.objectStore('ideas');
    for (const idea of await ideas.index('by_book').getAll(id)) {
      await ideas.put({ ...idea, bookId: null });
    }

    if (isTempId(id)) {
      const chapters = tx.objectStore('chapters');
      for (const c of await chapters.index('by_book').getAll(id)) {
        await chapters.delete(c.id);
      }
    } else {
      await queueOp(tx, 'book', 'delete', id);
    }
    await tx.done;

    if (isTempId(id)) return this.getLocalBooks();

    try {
      await bookService.delete(id);
      await clearOpsFor('book', 'delete', id);
    } catch (err) {
      if (httpStatus(err) === 404) {
        await clearOpsFor('book', 'delete', id);
      } else {
        console.log('Suppression enregistrée en local (serveur injoignable).');
      }
    }

    return this.getLocalBooks();
  },

  async update(id: number, title: string, description?: string, coverImage?: string): Promise<BookResponse[]> {
    const db = await getDb();
    const current = await db.get('books', id);
    if (!current) throw new Error('Livre introuvable.');

    const updatedBook: BookResponse = {
      ...current,
      title,
      description,
      coverImage,
      updatedAt: new Date().toISOString(),
    };

    const tx = await rwTx();
    await tx.objectStore('books').put(updatedBook);
    await queueOp(tx, 'book', 'update', id);
    await tx.done;

    if (!isTempId(id)) {
      try {
        const serverUpdated = await bookService.update(id, { title, description, coverImage });
        await db.put('books', serverUpdated);
        await clearOpsFor('book', 'update', id);
      } catch (err) {
        console.log('Mise à jour enregistrée en local.');
      }
    }

    return this.getLocalBooks();
  },

  async syncToServer(): Promise<void> {
    if (bookSyncPromise) return bookSyncPromise;

    bookSyncPromise = this._doSync().finally(() => {
      bookSyncPromise = null;
    });
    return bookSyncPromise;
  },

  async _doSync(): Promise<void> {
    const db = await getDb();

    for (const op of await getOps('book', 'delete')) {
      try {
        await bookService.delete(op.entityId);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) {
          console.log(`Le livre ${op.entityId} n'existe plus sur le serveur.`);
          await clearOp(op.key!);
        }
      }
    }

    for (const op of await getOps('book', 'update')) {
      const local = await db.get('books', op.entityId);
      if (!local) {
        await clearOp(op.key!);
        continue;
      }
      try {
        const serverUpdated = await bookService.update(local.id, {
          title: local.title,
          description: local.description,
          coverImage: local.coverImage,
        });
        await db.put('books', serverUpdated);
        await clearOp(op.key!);
      } catch (err) {
        if (httpStatus(err) === 404) await clearOp(op.key!);
      }
    }

    const pending = (await db.getAll('books')).filter((b) => isTempId(b.id));
    if (pending.length === 0) return;

    let serverBooks: BookResponse[];
    try {
      const res = await bookService.getAll();
      if (!Array.isArray(res)) return;
      serverBooks = res;
    } catch (err) {
      return;
    }

    for (const book of pending) {
      const existingOnServer = serverBooks.find(
        (s) => s.title.trim().toLowerCase() === book.title.trim().toLowerCase()
      );

      if (existingOnServer) {
        await replaceBook(book.id, existingOnServer);
        continue;
      }

      try {
        const created = await bookService.create({
          title: book.title,
          description: book.description,
          coverImage: book.coverImage,
        });
        serverBooks.push(created);
        await replaceBook(book.id, created);
      } catch (err) {
        console.warn(`Impossible de synchroniser la création du livre : ${book.title}`);
        return; 
      }
    }
  },
};