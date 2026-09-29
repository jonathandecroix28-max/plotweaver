import axiosClient from '../../../api/axiosClient';
import type { CategoryResponse, CategoryUpsertRequest } from '../../../types/category';

export const categoryService = {
    getAll: async (): Promise<CategoryResponse[]> => {
        const response = await axiosClient.get<CategoryResponse[]>('/categories');
        return response.data;
    },

    getById: async (id: number): Promise<CategoryResponse> => {
        const response = await axiosClient.get<CategoryResponse>(`/categories/${id}`);
        return response.data;
    },

    getByName: async (name: string): Promise<CategoryResponse> => {
        const response = await axiosClient.get<CategoryResponse>(`/categories/name/${name}`);
        return response.data;
    },

    getByColor: async (color: string): Promise<CategoryResponse[]> => {
        const response = await axiosClient.get<CategoryResponse[]>(`/categories/color/${color}`);
        return response.data;
    },

    create: async (data: CategoryUpsertRequest): Promise<CategoryResponse> => {
        const response = await axiosClient.post<CategoryResponse>('/categories', data);
        return response.data;
    },
    
    update: async (id: number, data: CategoryUpsertRequest): Promise<CategoryResponse> => {
        const response = await axiosClient.put<CategoryResponse>(`/categories/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/categories/${id}`);
    },
};