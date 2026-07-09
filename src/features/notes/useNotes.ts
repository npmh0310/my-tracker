import { useEffect, useMemo, useState, useRef } from "react";
import { formatJsonContent } from "../../shared/lib/json";
import { createNote, deleteNote, updateNote } from "./api";
import { Note } from "./types";

export function useNotes(
  notes: Note[],
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>,
  onError: (message: string) => void,
) {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [jsonError, setJsonError] = useState("");
  const isInitializedRef = useRef(false);

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;

  // Auto-generate title từ dòng đầu tiên của content
  const noteTitle = useMemo(() => {
    const firstLine = noteContent.split("\n")[0]?.trim() || "Untitled";
    return firstLine.substring(0, 100); // Limit to 100 chars
  }, [noteContent]);

  const wordCount = useMemo(() => {
    return noteContent.trim().split(/\s+/).filter(Boolean).length;
  }, [noteContent]);

  useEffect(() => {
    if (!isInitializedRef.current && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
      isInitializedRef.current = true;
    }
  }, [notes]);

  useEffect(() => {
    if (!selectedNote) return;
    setNoteContent(selectedNote.content);
    setJsonError("");
  }, [selectedNote]);

  function newNote() {
    setSelectedNoteId(null);
    setNoteContent("");
    setJsonError("");
  }

  async function saveNote() {
    const noteInput = {
      title: noteTitle,
      content: noteContent,
    };

    try {
      const saved = selectedNoteId
        ? await updateNote({
            ...noteInput,
            contentType: "plain",
            id: selectedNoteId,
          })
        : await createNote({ ...noteInput, contentType: "plain" });

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

  function formatJson(
    selectionStart: number,
    selectionEnd: number,
    sourceContent = noteContent,
  ) {
    const hasSelection = selectionEnd > selectionStart;
    const selectedContent = hasSelection
      ? sourceContent.slice(selectionStart, selectionEnd)
      : sourceContent;

    try {
      const formatted = formatJsonContent(selectedContent);
      setNoteContent(() => {
        if (!hasSelection) return formatted;
        return `${sourceContent.slice(0, selectionStart)}${formatted}${sourceContent.slice(selectionEnd)}`;
      });
      setJsonError("");
      return formatted.length;
    } catch (error) {
      setJsonError(`JSON chưa hợp lệ: ${String(error)}`);
    }

    return null;
  }

  return {
    selectedNoteId,
    setSelectedNoteId,
    noteTitle,
    noteContent,
    setNoteContent,
    jsonError,
    wordCount,
    newNote,
    saveNote,
    deleteCurrentNote,
    formatJson,
  };
}
