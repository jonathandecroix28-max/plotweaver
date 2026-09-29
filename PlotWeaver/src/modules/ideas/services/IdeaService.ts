import axiosClient from '../../../api/axiosClient';
import type { IdeaResponse, IdeaUpsertRequest } from '../../../types/idea';

export const ideaService = {
    getAll: async (): Promise<IdeaResponse[]> => {
        const response = await axiosClient.get<IdeaResponse[]>('/ideas');
        return response.data;
    },

    getById: async (id: number): Promise<IdeaResponse> => {
        const response = await axiosClient.get<IdeaResponse>(`/ideas/${id}`);
        return response.data;
    },

    getByBookId: async (bookId: number): Promise<IdeaResponse[]> => {
        const response = await axiosClient.get<IdeaResponse[]>(`/ideas/book/${bookId}`);
        return response.data;
    },

    getByBookIdAndCount: async (bookId: number): Promise<number> => {
        const response = await axiosClient.get<number>(`/ideas/book/${bookId}/count`);
        return response.data;
    },

    create: async (data: IdeaUpsertRequest): Promise<IdeaResponse> => {
        const response = await axiosClient.post<IdeaResponse>('/ideas', data);
        return response.data;
    },

    update: async (id: number, data: IdeaUpsertRequest): Promise<IdeaResponse> => {
        const response = await axiosClient.put<IdeaResponse>(`/ideas/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/ideas/${id}`);
    },

    getByCategoryId: async (categoryId: number): Promise<IdeaResponse[]> => {
        const response = await axiosClient.get<IdeaResponse[]>(`/ideas/category/${categoryId}`);
        return response.data;
    },
}