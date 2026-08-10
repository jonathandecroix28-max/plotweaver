import axiosClient from '../../../api/axiosClient';
import type { ChapterResponse, ChapterUpsertRequest } from '../../../types/chapter';

export const chapterService = {
  getAll: async (): Promise<ChapterResponse[]> => {
    const response = await axiosClient.get<ChapterResponse[]>('/chapters');
    return response.data;
  },

  getById: async (id: number): Promise<ChapterResponse> => {
    const response = await axiosClient.get<ChapterResponse>(`/chapters/${id}`);
    return response.data;
  },

  getByTitle: async (title: string): Promise<ChapterResponse[]> => {
    const response = await axiosClient.get<ChapterResponse[]>(`/chapters/title/${title}`);
    return response.data;
  },

  getByBookId: async (bookId: number): Promise<ChapterResponse[]> => {
    const response = await axiosClient.get<ChapterResponse[]>(`/chapters/book/${bookId}`);
    return response.data;
  },

  create: async (data: ChapterUpsertRequest): Promise<ChapterResponse> => {
    const response = await axiosClient.post<ChapterResponse>('/chapters', data);
    return response.data;
  },

  update: async (id: number, data: ChapterUpsertRequest): Promise<ChapterResponse> => {
    const response = await axiosClient.put<ChapterResponse>(`/chapters/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/chapters/${id}`);
  },
};