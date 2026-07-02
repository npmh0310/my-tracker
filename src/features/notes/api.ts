import { callCommand } from "../../shared/lib/tauri";
import { Note, NoteType } from "./types";

export function listNotes() {
  return callCommand<Note[]>("list_notes");
}

export function createNote(input: {
  title: string;
  content: string;
  contentType: NoteType;
}) {
  return callCommand<Note>("create_note", input);
}

export function updateNote(input: {
  id: number;
  title: string;
  content: string;
  contentType: NoteType;
}) {
  return callCommand<Note>("update_note", input);
}

export function deleteNote(id: number) {
  return callCommand<void>("delete_note", { id });
}
