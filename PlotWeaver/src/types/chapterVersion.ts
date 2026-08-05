export interface ChapterVersionResponse {
  id: number;
  chapterId: number;
  versionNumber: number;
  name: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterVersionUpsertRequest {
  chapterId: number;
  versionNumber: number;
  name: string;
  content?: string;
}