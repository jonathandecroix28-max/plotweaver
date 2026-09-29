import { useState, useEffect } from 'react';
import { offlineCategoryService } from '../../../services/offlineCategoryService'; 
import type { CategoryResponse, CategoryUpsertRequest } from '../../../types/category';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await offlineCategoryService.getAll();
      setCategories(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des catégories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const createCategory = async (data: CategoryUpsertRequest) => {
    const updated = await offlineCategoryService.create(data);
    setCategories(updated);
    return updated;
  };

  const updateCategory = async (id: number, data: CategoryUpsertRequest) => {
    const updated = await offlineCategoryService.update(id, data);
    setCategories(updated);
    return updated;
  };

  const deleteCategory = async (id: number) => {
    const updated = await offlineCategoryService.remove(id);
    setCategories(updated);
    return updated;
  };

  return {
    categories,
    setCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
}