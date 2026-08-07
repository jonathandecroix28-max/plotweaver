import { useState } from 'react';
import { offlineBookService } from '../../../services/offlineBookService';
import type { BookResponse } from '../../../types/book';

export function useDeleteBook() {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBook = async (id: number): Promise<BookResponse[] | null> => {
    setIsDeleting(true);
    setError(null);
    try {
      const updatedBooks = await offlineBookService.remove(id);
      return updatedBooks;
    } catch (err) {
      setError("Erreur lors de la suppression du livre.");
      return null;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteBook, isDeleting, error };
}