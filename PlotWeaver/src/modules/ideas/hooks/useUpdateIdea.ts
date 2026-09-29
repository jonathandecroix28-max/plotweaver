import { useState } from 'react';
import { offlineIdeaService } from '../../../services/offlineIdeaService';
import type { IdeaUpsertRequest, IdeaResponse } from '../../../types/idea';

export function useUpdateIdea() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateIdea = async (id: number, data: IdeaUpsertRequest): Promise<IdeaResponse[] | null> => {
    try {
      setIsUpdating(true);
      const updatedList = await offlineIdeaService.update(id, data);
      return updatedList;
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'idée :", err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateIdea, isUpdating };
}