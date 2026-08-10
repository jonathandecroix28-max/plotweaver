import { useState } from 'react';
import { offlineChapterService } from '../../../services/offlineChapterService';
import type { ChapterResponse } from '../../../types/chapter';

export function useCreateChapter() {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createChapter = async (
    bookId: number, 
    title: string, 
    chapterNumber: number, 
    content: string = ""
  ): Promise<ChapterResponse[] | null> => {
    setIsCreating(true);
    setError(null);
    try {
      const updatedChapters = await offlineChapterService.create(bookId, title, chapterNumber, content);
      return updatedChapters;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du chapitre.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createChapter, isCreating, error };
}