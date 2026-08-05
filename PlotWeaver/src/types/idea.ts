export interface IdeaResponse {
    id: number;
    name: string;
    description?: string;
    bookId: number;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
}

export interface IdeaUpsertRequest {
    name: string;
    description?: string;
    bookId: number;
    categoryId: number;
}