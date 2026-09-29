import { useState, useEffect, useCallback } from 'react';
import { offlineIdeaService } from '../../../services/offlineIdeaService';
import type { IdeaResponse } from '../../../types/idea';

export function useIdeas(bookId?: number | null) {
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = (bookId !== undefined && bookId !== null)
        ? await offlineIdeaService.getByBookId(bookId)
        : await offlineIdeaService.getAll();
      setIdeas(data);
    } catch (err) {
      console.error("Erreur chargement idées :", err);
      setError("Impossible de charger les idées.");
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return { ideas, setIdeas, isLoading, error, refreshIdeas: fetchIdeas };
}