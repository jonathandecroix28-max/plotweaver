export interface IdeaVersionResponse {
  id: number;
  ideaId: number;
  versionNumber: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaVersionUpsertRequest {
  ideaId: number;
  versionNumber: number;
  name: string;
  description?: string;
}