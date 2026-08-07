import axiosClient from '../../../api/axiosClient';
import { type BookResponse, type BookUpsertRequest } from '../../../types/book';

export const bookService = {
  getAll: async (): Promise<BookResponse[]> => {
    const response = await axiosClient.get<BookResponse[]>('/books');
    return response.data;
  },

  getById: async (id: number): Promise<BookResponse> => {
    const response = await axiosClient.get<BookResponse>(`/books/${id}`);
    return response.data;
  },

  create: async (data: BookUpsertRequest): Promise<BookResponse> => {
    const response = await axiosClient.post<BookResponse>('/books', data);
    return response.data;
  },

  update: async (id: number, data: BookUpsertRequest): Promise<BookResponse> => {
    const response = await axiosClient.put<BookResponse>(`/books/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/books/${id}`);
  },
};