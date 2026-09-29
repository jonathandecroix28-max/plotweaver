import axiosClient from '../../../api/axiosClient';
import type { IdeaVersionResponse, IdeaVersionUpsertRequest } from '../../../types/ideaVersion';

export const ideaVersionService = {
  getAll: async (): Promise<IdeaVersionResponse[]> => {
    const response = await axiosClient.get<IdeaVersionResponse[]>('/idea-versions');
    return response.data;
  },
  
  getById: async (id: number): Promise<IdeaVersionResponse> => {
    const response = await axiosClient.get<IdeaVersionResponse>(`/idea-versions/${id}`);
    return response.data;
  },

  getByIdeaId: async (ideaId: number): Promise<IdeaVersionResponse[]> => {
    const response = await axiosClient.get<IdeaVersionResponse[]>(`/idea-versions/idea/${ideaId}`);
    return response.data;
  },

  getByIdeaIdAndNumber: async (ideaId: number, versionNumber: number): Promise<IdeaVersionResponse> => {
    const response = await axiosClient.get<IdeaVersionResponse>(`/idea-versions/idea/${ideaId}/version/${versionNumber}`);
    return response.data;
  },

  create: async (data: IdeaVersionUpsertRequest): Promise<IdeaVersionResponse> => {
    const response = await axiosClient.post<IdeaVersionResponse>('/idea-versions', data);
    return response.data;
  },

  update: async (id: number, data: IdeaVersionUpsertRequest): Promise<IdeaVersionResponse> => {
    const response = await axiosClient.put<IdeaVersionResponse>(`/idea-versions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/idea-versions/${id}`);
  },
};