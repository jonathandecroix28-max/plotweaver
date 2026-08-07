import { useState, useEffect, useCallback } from 'react';
import { offlineBookService } from '../../../services/offlineBookService';
import type { BookResponse } from '../../../types/book';

export function useBooks() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await offlineBookService.getAll();
      setBooks(data);
    } catch (err) {
      setError("Impossible de charger la bibliothèque.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return { books, isLoading, error, refreshBooks: fetchBooks, setBooks };
}