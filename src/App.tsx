import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { CheckSquare, Clock3, SquarePen } from "lucide-react";
import { NotesPanel } from "./features/notes/NotesPanel";
import { listNotes } from "./features/notes/api";
import { Note } from "./features/notes/types";
import { PomodoroPanel } from "./features/pomodoro/PomodoroPanel";
import { listTodaySessions } from "./features/pomodoro/api";
import { PomodoroSession } from "./features/pomodoro/types";
import { TodoPanel } from "./features/todos/TodoPanel";
import { listTodos } from "./features/todos/api";
import { Todo } from "./features/todos/types";
import { Toaster } from "./shared/ui/sonner";
import { TooltipProvider } from "./shared/ui/tooltip";

type ActiveTab = "todos" | "pomodoro" | "notes";

const tabs: Array<{
  id: ActiveTab;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { id: "todos", label: "Todo", icon: CheckSquare },
  { id: "pomodoro", label: "Pomodoro", icon: Clock3 },
  { id: "notes", label: "Ghi chú", icon: SquarePen },
];

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("todos");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [loadedNotes, loadedTodos, loadedSessions] = await Promise.all([
        listNotes(),
        listTodos(),
        listTodaySessions(),
      ]);
      setNotes(loadedNotes);
      setTodos(loadedTodos);
      setSessions(loadedSessions);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    }
  }

  return (
    <TooltipProvider>
      <main className="flex h-screen max-h-screen flex-col overflow-hidden p-6">
        {errorMessage ? (
          <div className="mb-4 shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <nav className="mb-4 flex w-fit shrink-0 rounded-3xl bg-white/80 p-1 shadow-sm ring-1 ring-border/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                className={`inline-flex min-h-10 items-center gap-2 rounded-3xl px-4 text-sm font-bold transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="min-h-0 flex-1 overflow-hidden">
          {activeTab === "todos" ? (
            <TodoPanel onError={setErrorMessage} setTodos={setTodos} todos={todos} />
          ) : null}

          {activeTab === "pomodoro" ? (
            <PomodoroPanel
              onError={setErrorMessage}
              sessions={sessions}
              setSessions={setSessions}
            />
          ) : null}

          {activeTab === "notes" ? (
            <NotesPanel
              notes={notes}
              onError={setErrorMessage}
              setNotes={setNotes}
            />
          ) : null}
        </section>
      </main>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
