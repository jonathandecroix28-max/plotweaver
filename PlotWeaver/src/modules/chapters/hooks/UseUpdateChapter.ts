import { useState } from 'react';
import { offlineChapterService } from '../../../services/offlineChapterService';
import type { ChapterResponse } from '../../../types/chapter';

export function useUpdateChapter() {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateChapter = async (id: number, title: string, content: string): Promise<ChapterResponse | null> => {
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await offlineChapterService.update(id, title, content);
      return updated;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la sauvegarde du chapitre.");
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateChapter, isUpdating, error };
}