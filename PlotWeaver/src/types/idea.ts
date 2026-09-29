export type IdeaStatus = 'draft' | 'in-progress' | 'integrated';

export interface IdeaResponse {
    id: number;
    name: string;
    description?: string;
    bookId: number | null;
    categoryId: number;
    status?: IdeaStatus;
    createdAt: string;
    updatedAt: string;
}

export interface IdeaUpsertRequest {
    name: string;
    description?: string;
    bookId: number | null;
    categoryId: number;
    status?: IdeaStatus;
}