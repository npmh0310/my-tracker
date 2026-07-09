import { Plus } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { Note } from "../../notes/types";

type NotesTrayTabProps = {
  setNotes: Dispatch<SetStateAction<Note[]>>;
};

export function NotesTrayTab({ setNotes }: NotesTrayTabProps) {
  const [content, setContent] = useState("");

  async function handleSave() {
    if (!content.trim()) return;

    try {
      const { createNote } = await import("../../notes/api");
      const title = content.split("\n")[0]?.trim() || "New Note";
      const newNote = await createNote({
        title,
        content,
        contentType: "plain",
      });
      setNotes((prev) => [newNote, ...prev]);
      setContent("");
    } catch (err) {
      console.error("Save error:", err);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          // Cmd/Ctrl + S to save
          if ((e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault();
            void handleSave();
          }
          // Cmd/Ctrl + E to format JSON
          if ((e.metaKey || e.ctrlKey) && e.key === "e") {
            e.preventDefault();
            try {
              const formatted = JSON.stringify(JSON.parse(content), null, 2);
              setContent(formatted);
            } catch (error) {
              console.error("Format error:", error);
            }
          }
        }}
        placeholder="Write note... (Cmd+S to save, Cmd+E to format JSON)"
        className="min-h-0 flex-1 rounded-lg border border-white/[0.12] bg-white/[0.05] p-3 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-white/[0.25] resize-none"
      />

      <button
        onClick={handleSave}
        disabled={!content.trim()}
        type="button"
        className="h-10 shrink-0 rounded-lg bg-zinc-500/70 px-3 text-[12px] font-bold text-white transition hover:bg-zinc-400/70 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        <span>Save</span>
      </button>
    </div>
  );
}
