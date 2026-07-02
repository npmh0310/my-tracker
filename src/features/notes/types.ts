export type NoteType = "plain" | "json";

export type Note = {
  id: number;
  title: string;
  content: string;
  content_type: NoteType;
  created_at: string;
  updated_at: string;
};
