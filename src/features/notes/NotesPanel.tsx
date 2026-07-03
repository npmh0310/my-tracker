import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { format } from "date-fns";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { search } from "@codemirror/search";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { ScrollArea } from "../../shared/ui/scroll-area";
import { cn } from "../../shared/lib/utils";
import { useNotes } from "./useNotes";
import { Note } from "./types";

type NotesPanelProps = {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onError: (message: string) => void;
};

export function NotesPanel({ notes, setNotes, onError }: NotesPanelProps) {
  const noteState = useNotes(notes, setNotes, onError);
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const searchInput = document.querySelector(".cm-search input") as HTMLElement;
      const searchPanel = document.querySelector(".cm-search") as HTMLElement;

      // Nếu click KHÔNG phải trên search input, thì ẩn search
      if (searchInput && searchPanel && !searchInput.contains(target)) {
        searchPanel.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          pointer-events: none !important;
        `;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Khi bấm Cmd+F, xóa các style ẩn để search hiện lên và focus vào input
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        setTimeout(() => {
          const searchPanel = document.querySelector(".cm-search") as HTMLElement;
          const searchInput = document.querySelector(".cm-search input") as HTMLInputElement;
          if (searchPanel) {
            searchPanel.style.cssText = ""; // Clear all styles
          }
          if (searchInput) {
            searchInput.focus(); // Focus vào search input
          }
        }, 10);
      }

      // Cmd+E để Format
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        if (editorRef.current?.view) {
          const view = editorRef.current.view;
          const content = view.state.doc.toString();
          try {
            const formatted = JSON.stringify(JSON.parse(content), null, 2);
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: formatted,
              },
            });
          } catch (error) {
            console.error("Format error:", error);
          }
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    // Also listen on editor container for better capture
    if (editorContainerRef.current) {
      editorContainerRef.current.addEventListener("keydown", handleKeyDown, true);
    }

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (editorContainerRef.current) {
        editorContainerRef.current.removeEventListener("keydown", handleKeyDown, true);
      }
    };
  }, [noteState]);


  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
        <div className="title-row">
          <NotebookPen size={23} />
          <h2 className="text-2xl font-bold leading-none">Ghi chú</h2>
        </div>
        <Badge>{noteState.wordCount} từ</Badge>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-4">
        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          <Button
            className={cn(
              "justify-start px-3 text-xs",
              noteState.selectedNoteId === null && "bg-white shadow-[inset_0_0_0_1px_hsl(var(--border))]"
            )}
            onClick={noteState.newNote}
            variant="secondary"
          >
            <Plus size={14} />
            Note mới
          </Button>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 pr-1">
              {notes.map((note) => (
                <button
                  className={cn(
                    "flex flex-col min-h-[62px] w-full gap-1.5 rounded-xl p-3 text-left transition border",
                    note.id === noteState.selectedNoteId
                      ? "border-blue-500 bg-white shadow-[inset_0_0_0_1px_#3b82f6]"
                      : "border-border bg-white hover:border-zinc-300",
                  )}
                  key={note.id}
                  onClick={() => noteState.setSelectedNoteId(note.id)}
                  type="button"
                >
                  <strong className="truncate text-xs">{note.title}</strong>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-[11px] text-muted-foreground flex-1">
                      {note.content || "Empty note"}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {format(new Date(note.created_at), "dd/M/yy")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-2.5 relative">

          <style>{`
            .cm-search {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              position: absolute !important;
              top: 8px !important;
              right: 8px !important;
              width: 280px !important;
              display: flex !important;
              align-items: center !important;
              flex-direction: row !important;
              gap: 6px !important;
            }
            .cm-search label {
              display: none !important;
            }
            .cm-search > button {
              display: none !important;
            }
            .cm-search > input:first-of-type {
              display: block !important;
              border: 1px solid hsl(var(--border)) !important;
              background: hsl(var(--muted)) !important;
              border-radius: 24px !important;
              padding: 8px 14px !important;
              font-size: 13px !important;
              color: hsl(var(--foreground)) !important;
              width: 100% !important;
              flex: 1 !important;
            }
            .cm-search > input:first-of-type::placeholder {
              content: "Search" !important;
              color: hsl(var(--muted-foreground)) !important;
            }
            .cm-search > input:last-of-type {
              display: none !important;
            }
            .cm-search button[aria-label="close"] {
              display: none !important;
            }
            .cm-completion {
              display: none !important;
            }
            .cm-completionInfo {
              display: none !important;
            }
            .cm-completionLabel {
              display: none !important;
            }
            .cm-searchMatch { background: #fef08a !important; }
            .cm-searchMatch-selected { background: #fcd34d !important; }
          `}</style>
          <div
            ref={editorContainerRef}
            className="relative min-h-0 h-full rounded-2xl border border-input overflow-hidden"
          >
            <CodeMirror
              ref={editorRef}
              value={noteState.noteContent}
              onChange={(value) => noteState.setNoteContent(value)}
              extensions={[json(), search({ top: true })]}
              theme="light"
              height="100%"
              className="min-h-0 h-full"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                drawSelection: true,
                searchKeymap: true,
              }}
              style={{ fontSize: "14px" }}
            />
          </div>

          {noteState.jsonError ? (
            <p className="rounded-2xl bg-rose-50 p-3 text-sm leading-5 text-rose-700">
              {noteState.jsonError}
            </p>
          ) : null}

          <div className="flex shrink-0 justify-end gap-2">
            <Button
              onClick={() => void noteState.saveNote()}
              className="h-10 rounded-3xl px-4 text-sm font-semibold"
              variant="default"
            >
              Lưu
            </Button>
            <Button
              disabled={!noteState.selectedNoteId}
              onClick={() => void noteState.deleteCurrentNote()}
              className="h-10 rounded-3xl px-4 text-sm"
              variant="ghost"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
