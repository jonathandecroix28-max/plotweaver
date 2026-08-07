import { useState, useEffect, useCallback } from 'react';
import { offlineBookService } from '../../../services/offlineBookService';
import type { BookResponse } from '../../../types/book';

export function useBook(id: number) {
  const [book, setBook] = useState<BookResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBook = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await offlineBookService.getById(id);
      setBook(data);
    } catch (err) {
      setError("Livre introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id, fetchBook]);

  return { book, isLoading, error, refreshBook: fetchBook };
}