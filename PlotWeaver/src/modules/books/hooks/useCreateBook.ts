import { useState } from 'react';
import { offlineBookService } from '../../../services/offlineBookService';
import type { BookResponse } from '../../../types/book';

export function useCreateBook() {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createBook = async (title: string, description?: string, coverImage?: string): Promise<BookResponse[] | null> => {
    setIsCreating(true);
    setError(null);
    try {
      const updatedBooks = await offlineBookService.create(title, description, coverImage);
      return updatedBooks;
    } catch (err) {
      setError("Erreur lors de la création du livre.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createBook, isCreating, error };
}