import axiosClient from '../../../api/axiosClient';
import type { ChapterVersionResponse, ChapterVersionUpsertRequest } from '../../../types/chapterVersion';

export const chapterVersionService = {
  getAll: async (): Promise<ChapterVersionResponse[]> => {
    const response = await axiosClient.get<ChapterVersionResponse[]>('/chapter-versions');
    return response.data;
  },

  getById: async (id: number): Promise<ChapterVersionResponse> => {
    const response = await axiosClient.get<ChapterVersionResponse>(`/chapter-versions/${id}`);
    return response.data;
  },

  getByChapterId: async (chapterId: number): Promise<ChapterVersionResponse[]> => {
    const response = await axiosClient.get<ChapterVersionResponse[]>(`/chapter-versions/chapter/${chapterId}`);
    return response.data;
  },

  getByChapterIdAndNumber: async (chapterId: number, versionNumber: number): Promise<ChapterVersionResponse> => {
    const response = await axiosClient.get<ChapterVersionResponse>(`/chapter-versions/chapter/${chapterId}/version/${versionNumber}`);
    return response.data;
  },

  create: async (data: ChapterVersionUpsertRequest): Promise<ChapterVersionResponse> => {
    const response = await axiosClient.post<ChapterVersionResponse>('/chapter-versions', data);
    return response.data;
  },

  update: async (id: number, data: ChapterVersionUpsertRequest): Promise<ChapterVersionResponse> => {
    const response = await axiosClient.put<ChapterVersionResponse>(`/chapter-versions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/chapter-versions/${id}`);
  },
};