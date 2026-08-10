import { useState, useEffect, useCallback } from 'react';
import { offlineChapterService } from '../../../services/offlineChapterService';
import type { ChapterResponse } from '../../../types/chapter';

export function useChapterReader(bookId: number | null, chapterId: number | null) {
  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReaderData = useCallback(async () => {
    if (!bookId || !chapterId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [chapterData, allChaptersData] = await Promise.all([
        offlineChapterService.getById(chapterId),
        offlineChapterService.getByBookId(bookId),
      ]);

      if (!chapterData) {
        setError("Chapitre introuvable.");
        setChapter(null);
        return;
      }

      setChapter(chapterData);
      
      const sorted = [...allChaptersData].sort((a, b) => a.chapter_number - b.chapter_number);
      setChapters(sorted);
    } catch (err) {
      console.error("Erreur lors du chargement du lecteur :", err);
      setError("Impossible de charger le chapitre.");
    } finally {
      setIsLoading(false);
    }
  }, [bookId, chapterId]);

  useEffect(() => {
    fetchReaderData();
  }, [fetchReaderData]);

  const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const currentIndex = chapter ? sortedChapters.findIndex((c) => c.id === chapter.id) : -1;
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex !== -1 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  return {
    chapter,
    chapters: sortedChapters,
    isLoading,
    error,
    prevChapter,
    nextChapter,
    refetch: fetchReaderData,
  };
}