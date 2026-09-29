import { useState } from 'react';
import { offlineIdeaService } from '../../../services/offlineIdeaService';

export function useDeleteIdea() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteIdea = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await offlineIdeaService.remove(id);
      return true;
    } catch (err) {
      console.error("Erreur suppression idée :", err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteIdea, isDeleting };
}