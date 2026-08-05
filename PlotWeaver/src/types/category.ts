export interface CategoryResponse {
    id: number;
    name: string;
    color?: string;
    bookId: number;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryUpsertRequest {
    name: string;
    color?: string;
    bookId: number;
}