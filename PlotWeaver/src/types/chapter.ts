export interface ChapterResponse {
  id: number;
  title: string;
  content: string;
  chapter_number: number;
  book_id: number;
  book_title: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterUpsertRequest {
  title: string;
  content: string;
  chapter_number: number;
  book_id: number;
}