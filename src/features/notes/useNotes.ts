import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { formatJsonContent, parseJsonError } from "../../shared/lib/json";
import { createNote, deleteNote, updateNote } from "./api";
import { Note, NoteType } from "./types";

const noteSchema = z.object({
  title: z.string().trim().min(1, "Nhập tiêu đề trước khi lưu."),
  content: z.string(),
  contentType: z.enum(["plain", "json"]),
});

export function useNotes(
  notes: Note[],
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>,
  onError: (message: string) => void,
) {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("plain");
  const [jsonError, setJsonError] = useState("");

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;

  const wordCount = useMemo(() => {
    return noteContent.trim().split(/\s+/).filter(Boolean).length;
  }, [noteContent]);

  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNote]);

  useEffect(() => {
    if (!selectedNote) return;
    setNoteTitle(selectedNote.title);
    setNoteContent(selectedNote.content);
    setNoteType(selectedNote.content_type);
    setJsonError("");
  }, [selectedNote]);

  function newNote() {
    setSelectedNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteType("plain");
    setJsonError("");
  }

  async function saveNote() {
    const parsed = noteSchema.safeParse({
      title: noteTitle,
      content: noteContent,
      contentType: noteType,
    });

    if (!parsed.success) {
      setJsonError(parsed.error.issues[0]?.message ?? "Note chưa hợp lệ.");
      return;
    }

    if (parsed.data.contentType === "json") {
      const error = parseJsonError(parsed.data.content);
      if (error) {
        setJsonError(error);
        return;
      }
    }

    try {
      const saved = selectedNoteId
        ? await updateNote({ ...parsed.data, id: selectedNoteId })
        : await createNote(parsed.data);

      setNotes((current) => {
        const exists = current.some((note) => note.id === saved.id);
        const next = exists
          ? current.map((note) => (note.id === saved.id ? saved : note))
          : [saved, ...current];
        return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      });
      setSelectedNoteId(saved.id);
      setJsonError("");
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  async function deleteCurrentNote() {
    if (!selectedNoteId) return;
    try {
      await deleteNote(selectedNoteId);
      setNotes((current) => current.filter((note) => note.id !== selectedNoteId));
      newNote();
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  function formatJson() {
    try {
      setNoteContent(formatJsonContent(noteContent));
      setJsonError("");
    } catch (error) {
      setJsonError(`JSON chưa hợp lệ: ${String(error)}`);
    }
  }

  return {
    selectedNoteId,
    setSelectedNoteId,
    noteTitle,
    setNoteTitle,
    noteContent,
    setNoteContent,
    noteType,
    setNoteType,
    jsonError,
    wordCount,
    newNote,
    saveNote,
    deleteCurrentNote,
    formatJson,
  };
}
