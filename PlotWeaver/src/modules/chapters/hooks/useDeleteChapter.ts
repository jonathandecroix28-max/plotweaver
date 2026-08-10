import { useState } from 'react';
import { offlineChapterService } from '../../../services/offlineChapterService';

export function useDeleteChapter() {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteChapter = async (id: number): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    try {
      await offlineChapterService.remove(id);
      return true; 
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression du chapitre.");
      return false; 
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteChapter, isDeleting, error };
}