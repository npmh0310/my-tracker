import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter } from "@codemirror/lint";
import { FileJson, Plus, SquarePen } from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { ScrollArea } from "../../shared/ui/scroll-area";
import { Textarea } from "../../shared/ui/textarea";
import { cn } from "../../shared/lib/utils";
import { useNotes } from "./useNotes";
import { Note } from "./types";

type NotesPanelProps = {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onError: (message: string) => void;
};

const jsonExtensions = [json(), lintGutter(), linter(jsonParseLinter())];

export function NotesPanel({ notes, setNotes, onError }: NotesPanelProps) {
  const noteState = useNotes(notes, setNotes, onError);

  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
        <div className="title-row">
          <SquarePen size={23} />
          <h2 className="text-2xl font-bold leading-none">Ghi chú</h2>
        </div>
        <Badge>{noteState.wordCount} từ</Badge>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[160px_minmax(0,1fr)] gap-4">
        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          <Button
            className="justify-start px-3"
            onClick={noteState.newNote}
            variant="secondary"
          >
            <Plus size={16} />
            Note mới
          </Button>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 pr-1">
              {notes.map((note) => (
                <button
                  className={cn(
                    "grid min-h-[62px] w-full gap-1 rounded-2xl bg-muted p-3 text-left transition hover:bg-zinc-100",
                    note.id === noteState.selectedNoteId &&
                      "bg-white shadow-[inset_0_0_0_1px_hsl(var(--border))]",
                  )}
                  key={note.id}
                  onClick={() => noteState.setSelectedNoteId(note.id)}
                  type="button"
                >
                  <strong className="truncate text-sm">{note.title}</strong>
                  <span className="text-[11px] font-extrabold text-muted-foreground">
                    {note.content_type.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] gap-2.5">
          <Input
            className="rounded-2xl font-bold"
            value={noteState.noteTitle}
            onChange={(event) => noteState.setNoteTitle(event.currentTarget.value)}
            placeholder="Tiêu đề ghi chú"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex rounded-full bg-muted p-1">
              <button
                className={cn(
                  "min-h-8 rounded-full px-3 text-sm font-bold text-muted-foreground transition",
                  noteState.noteType === "plain" && "bg-white text-foreground shadow-sm",
                )}
                onClick={() => noteState.setNoteType("plain")}
                type="button"
              >
                Plain
              </button>
              <button
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-muted-foreground transition",
                  noteState.noteType === "json" && "bg-white text-foreground shadow-sm",
                )}
                onClick={() => noteState.setNoteType("json")}
                type="button"
              >
                <FileJson size={15} />
                JSON
              </button>
            </div>
            {noteState.noteType === "json" ? (
              <Button onClick={noteState.formatJson} variant="secondary">
                Format
              </Button>
            ) : null}
          </div>

          {noteState.noteType === "json" ? (
            <CodeMirror
              basicSetup={{
                bracketMatching: true,
                closeBrackets: true,
                foldGutter: true,
                highlightActiveLine: true,
                lineNumbers: true,
              }}
              extensions={jsonExtensions}
              height="100%"
              onChange={noteState.setNoteContent}
              placeholder={'{\n  "idea": "Personal tracker"\n}'}
              value={noteState.noteContent}
            />
          ) : (
            <Textarea
              className="min-h-0"
              value={noteState.noteContent}
              onChange={(event) =>
                noteState.setNoteContent(event.currentTarget.value)
              }
              placeholder="Viết ghi chú..."
            />
          )}

          {noteState.jsonError ? (
            <p className="rounded-2xl bg-rose-50 p-3 text-sm leading-5 text-rose-700">
              {noteState.jsonError}
            </p>
          ) : null}

          <div className="flex shrink-0 justify-end gap-2.5">
            <Button onClick={() => void noteState.saveNote()}>Lưu note</Button>
            <Button
              disabled={!noteState.selectedNoteId}
              onClick={() => void noteState.deleteCurrentNote()}
              variant="destructive"
            >
              Xóa
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
