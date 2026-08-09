import { useState } from 'react';
import { offlineBookService } from '../../../services/offlineBookService';
import type { BookResponse } from '../../../types/book';

export function useUpdateBook() {
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const updateBook = async (id: number, title: string, description?: string, coverImage?: string): Promise<BookResponse[] | null> => {
    setIsUpdating(true);
     setError(null);
    try {
      const updatedBooks = await offlineBookService.update(id, title, description, coverImage);
      return updatedBooks;
    } catch (err) {
      setError("Erreur lors de la mise à jour du livre.");
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {updateBook, isUpdating, error}
}