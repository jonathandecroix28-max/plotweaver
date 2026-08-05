export interface BookResponse {
  id: number;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  chapterCount: number;
}

export interface BookUpsertRequest {
  title: string;
  description?: string;
  coverImage?: string;
}