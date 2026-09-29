import { useState } from 'react';
import { offlineIdeaService } from '../../../services/offlineIdeaService';
import type { IdeaUpsertRequest, IdeaResponse } from '../../../types/idea';

export function useCreateIdea() {
  const [isCreating, setIsCreating] = useState(false);

  const createIdea = async (data: IdeaUpsertRequest): Promise<IdeaResponse[] | null> => {
    try {
      setIsCreating(true);
      const updatedList = await offlineIdeaService.create(data);
      return updatedList;
    } catch (err) {
      console.error("Erreur lors de la création de l'idée :", err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createIdea, isCreating };
}