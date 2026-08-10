import { chapterService } from '../modules/chapters/services/chapterService';
import type { ChapterResponse } from '../types/chapter';

const LOCAL_STORAGE_KEY = 'plotweaver_offline_chapters';
const LOCAL_STORAGE_DELETED_KEY = 'plotweaver_deleted_chapters';


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
        item => Number(item.book_id) === bId && Number(item.chapter_number) === cNum
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

export const offlineChapterService = {
  getLocalChapters(): ChapterResponse[] {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!localData) return [];
    try {
      const parsed = JSON.parse(localData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveLocalChapters(chapters: ChapterResponse[]) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chapters));
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

  async getAll(): Promise<ChapterResponse[]> {
    try {
      await this.syncToServer();
      const serverChapters = await chapterService.getAll();
      
      if (Array.isArray(serverChapters)) {
        const local = this.getLocalChapters();
        
        const pendingLocal = local.filter(c => c.id > 1000000000);

        const merged = deduplicateChapters([...serverChapters, ...pendingLocal]);
        
        this.saveLocalChapters(merged);
        return merged;
      }
    } catch (error) {
      console.warn("Mode hors-ligne actif : utilisation du stockage local.");
    }

    return deduplicateChapters(this.getLocalChapters());
  },

  async getByBookId(bookId: number): Promise<ChapterResponse[]> {

    try {
      await this.getAll();
    } catch (e) {

    }
    
    const chapters = this.getLocalChapters();
    return chapters.filter(c => Number(c.book_id ?? c.book_id) === Number(bookId));
  },

  async getById(id: number): Promise<ChapterResponse> {
    const chapters = this.getLocalChapters();
    const chapter = chapters.find((c) => c.id === id);
    if (!chapter) throw new Error("Chapitre introuvable.");
    return chapter;
  },

  async create(bookId: number, title: string, chapterNumber: number, content: string = ""): Promise<ChapterResponse[]> {
    const chapters = this.getLocalChapters();

    const tempChapter: ChapterResponse = {
      id: Date.now(), 
      book_id: bookId,
      title,
      content, 
      chapter_number: chapterNumber,
      book_title: "", 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedChapters = deduplicateChapters([...chapters, tempChapter]);
    this.saveLocalChapters(updatedChapters);

    try {
      const createdServerChapter = await chapterService.create({ 
        book_id: bookId,
        title, 
        content, 
        chapter_number: chapterNumber 
      });
      
      const filtered = updatedChapters.filter(c => c.id !== tempChapter.id);
      updatedChapters = deduplicateChapters([...filtered, createdServerChapter]);
      this.saveLocalChapters(updatedChapters);
    } catch (err) {
      console.log("Chapitre enregistré localement en attente de synchronisation.");
    }

    return updatedChapters.filter(c => Number(c.book_id ?? c.book_id) === Number(bookId));
  },

  async update(id: number, title: string, content: string): Promise<ChapterResponse> {
    const chapters = this.getLocalChapters();
    const chapterIndex = chapters.findIndex(c => c.id === id);
    
    if (chapterIndex === -1) {
      throw new Error("Chapitre introuvable.");
    }

    const current = chapters[chapterIndex];
    const bId = current.book_id ?? current.book_id;
    const cNum = current.chapter_number ?? current.chapter_number;

    const updatedChapter: ChapterResponse = { 
      ...current, 
      title, 
      content, 
      updated_at: new Date().toISOString() 
    };

    chapters[chapterIndex] = updatedChapter;
    this.saveLocalChapters(chapters);

    try {
      const serverUpdated = await chapterService.update(id, { 
        book_id: Number(bId),
        chapter_number: Number(cNum),
        title, 
        content 
      });
      chapters[chapterIndex] = serverUpdated;
      this.saveLocalChapters(chapters);
      return serverUpdated;
    } catch (err: any) {
      console.error("🚨 ERREUR SERVEUR LORS DU PUT :", err.response?.data || err.message);
    }

    return updatedChapter;
  },

  async remove(id: number): Promise<boolean> {
    let chapters = this.getLocalChapters();
    chapters = chapters.filter(c => c.id !== id);
    this.saveLocalChapters(chapters);

    try {
      await chapterService.delete(id);
      return true; 
    } catch (err) {
      console.log("Suppression enregistrée en local (serveur injoignable).");
      this.addPendingDeletion(id);
      return false; 
    }
  },

  isSyncing: false,

  async syncToServer(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingDeletions = this.getPendingDeletions();
      if (pendingDeletions.length > 0) {
        const remainingDeletions: number[] = [];
        for (const id of pendingDeletions) {
          try {
            await chapterService.delete(id);
          } catch (error) {
            remainingDeletions.push(id);
          }
        }
        this.savePendingDeletions(remainingDeletions);
      }

      const chapters = this.getLocalChapters();
      const pendingChapters = chapters.filter(c => c.id > 1000000000);

      if (pendingChapters.length > 0) {
        let serverChapters: ChapterResponse[] = [];
        try {
          const res = await chapterService.getAll();
          if (Array.isArray(res)) serverChapters = res;
        } catch (e) {
          return;
        }

        let currentChapters = this.getLocalChapters();

        for (const chapter of pendingChapters) {
          const existingOnServer = serverChapters.find(
            s => Number(s.book_id) === Number(chapter.book_id) && 
                 Number(s.chapter_number) === Number(chapter.chapter_number)
          );

          if (existingOnServer) {
            currentChapters = currentChapters.filter(c => c.id !== chapter.id);
            currentChapters = deduplicateChapters([...currentChapters, existingOnServer]);
            this.saveLocalChapters(currentChapters);
          } else {
            try {
              const created = await chapterService.create({
                book_id: Number(chapter.book_id),
                title: chapter.title,
                content: chapter.content ?? "",
                chapter_number: Number(chapter.chapter_number)
              });

              
              serverChapters.push(created);
              currentChapters = currentChapters.filter(c => c.id !== chapter.id);
              currentChapters = deduplicateChapters([...currentChapters, created]);
              this.saveLocalChapters(currentChapters);
            } catch (err) {
              console.warn(`Serveur indisponible pour synchroniser le chapitre : ${chapter.title}`);
            }
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
};