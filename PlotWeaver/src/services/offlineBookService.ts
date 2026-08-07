import { bookService } from '../modules/books/services/bookService';
import type { BookResponse } from '../types/book';

const LOCAL_STORAGE_KEY = 'plotweaver_offline_books';
const LOCAL_STORAGE_DELETED_KEY = 'plotweaver_deleted_books'; 
const CHAPTER_LOCAL_STORAGE_KEY = 'plotweaver_offline_chapters';

export const offlineBookService = {

  getLocalBooks(): BookResponse[] {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!localData) return [];
    try {
      const parsed = JSON.parse(localData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveLocalBooks(books: BookResponse[]) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
  },

  getPendingDeletions(): number[] {
    const localData = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return localData ? JSON.parse(localData) : [];
  },

  savePendingDeletions(ids: number[]) {
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(ids));
  },

  addPendingDeletion(id: number) {
    if (id > 1000000000) return; 

    const pending = this.getPendingDeletions();
    if (!pending.includes(id)) {
      this.savePendingDeletions([...pending, id]);
    }
  },

  async getAll(): Promise<BookResponse[]> {
    const localBooks = this.getLocalBooks();

    try {
      const serverBooks = await bookService.getAll();

      if (Array.isArray(serverBooks)) {
        await this.syncToServer();

        const finalServerBooks = await bookService.getAll();
        if (Array.isArray(finalServerBooks)) {
          this.saveLocalBooks(finalServerBooks);
          return finalServerBooks;
        }
      }
    } catch (error) {
      console.warn("Mode hors-ligne actif : utilisation du stockage local.");
    }

    return localBooks;
  },

  async getById(id: number): Promise<BookResponse> {
    const books = this.getLocalBooks();
    const book = books.find((b) => b.id === id);
    if (!book) {
      throw new Error("Livre introuvable.");
    }
    return book;
  },

  async create(title: string, description?: string, coverImage?: string): Promise<BookResponse[]> {
    const books = this.getLocalBooks();

    const tempBook: BookResponse = {
      id: Date.now(), 
      title,
      description,
      coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapterCount: 0
    };

    let updatedBooks = [tempBook, ...books];
    this.saveLocalBooks(updatedBooks);

    try {
      const createdServerBook = await bookService.create({ title, description, coverImage });
      
      updatedBooks = updatedBooks.map(b => b.id === tempBook.id ? createdServerBook : b);
      this.saveLocalBooks(updatedBooks);

      const chaptersData = localStorage.getItem(CHAPTER_LOCAL_STORAGE_KEY);
      if (chaptersData) {
        try {
          const chapters = JSON.parse(chaptersData);
          if (Array.isArray(chapters)) {
            const updatedChapters = chapters.map((c: any) => {
              if (Number(c.bookId ?? c.book_id) === tempBook.id) {
                return { ...c, bookId: createdServerBook.id, book_id: createdServerBook.id };
              }
              return c;
            });
            localStorage.setItem(CHAPTER_LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
          }
        } catch (e) {
          console.error("Erreur lors de la mise à jour des IDs de chapitres liés :", e);
        }
      }

    } catch (err) {
      console.log("Livre enregistré localement en attente de synchronisation.");
    }

    return updatedBooks;
  },

  async remove(id: number): Promise<BookResponse[]> {
    let books = this.getLocalBooks();
    books = books.filter(b => b.id !== id);
    this.saveLocalBooks(books);

    try {
      await bookService.delete(id);
    } catch (err) {
      console.log("Suppression enregistrée en local (serveur injoignable).");
      this.addPendingDeletion(id);
    }

    return books;
  },

  async syncToServer(): Promise<void> {
    const pendingDeletions = this.getPendingDeletions();
    if (pendingDeletions.length > 0) {
      const remainingDeletions: number[] = [];
      for (const id of pendingDeletions) {
        try {
          await bookService.delete(id);
        } catch (err: any) { 
          if (err?.response?.status === 404) {
            console.log(`Le livre ${id} n'existe déjà plus sur le serveur.`);
          } else {
            remainingDeletions.push(id); 
          }
        }
      }
      this.savePendingDeletions(remainingDeletions);
    }

    const books = this.getLocalBooks();
    const pendingBooks = books.filter(b => b.id > 1000000000);

    if (pendingBooks.length === 0) return;

    try {
      const serverBooks = await bookService.getAll();
      if (Array.isArray(serverBooks)) {
        for (const book of pendingBooks) {
          const existingOnServer = serverBooks.find(
            s => s.title.trim().toLowerCase() === book.title.trim().toLowerCase()
          );

          if (!existingOnServer) {
            try {
              const created = await bookService.create({
                title: book.title,
                description: book.description,
                coverImage: book.coverImage
              });

              let currentBooks = this.getLocalBooks();
              currentBooks = currentBooks.map(b => b.id === book.id ? created : b);
              this.saveLocalBooks(currentBooks);

              const chaptersData = localStorage.getItem(CHAPTER_LOCAL_STORAGE_KEY);
              if (chaptersData) {
                const chapters = JSON.parse(chaptersData);
                if (Array.isArray(chapters)) {
                  const updatedChapters = chapters.map((c: any) => {
                    if (Number(c.bookId ?? c.book_id) === book.id) {
                      return { ...c, bookId: created.id, book_id: created.id };
                    }
                    return c;
                  });
                  localStorage.setItem(CHAPTER_LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
                }
              }

            } catch (err) {
              console.warn(`Serveur encore indisponible pour synchroniser : ${book.title}`);
              return; 
            }
          }
        }
      }
    } catch (err) {
      return; 
    }

    try {
      const freshServerBooks = await bookService.getAll();
      if (Array.isArray(freshServerBooks)) {
        this.saveLocalBooks(freshServerBooks);
      }
    } catch (err) {
      console.error("Erreur lors du rafraîchissement post-synchronisation", err);
    }
  }
};