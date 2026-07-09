import { lazy, Suspense, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { CheckSquare, Clock3, SquarePen } from "lucide-react";
import { listNotes } from "./features/notes/api";
import { Note } from "./features/notes/types";
import { listTodaySessions } from "./features/pomodoro/api";
import { PomodoroSession } from "./features/pomodoro/types";
import { listTodos, subscribeTodosChanged } from "./features/todos/api";
import { Todo } from "./features/todos/types";
import { Toaster } from "./shared/ui/sonner";
import { TooltipProvider } from "./shared/ui/tooltip";

type ActiveTab = "todos" | "pomodoro" | "notes";

const NotesPanel = lazy(() =>
  import("./features/notes/NotesPanel").then((module) => ({
    default: module.NotesPanel,
  })),
);
const PomodoroPanel = lazy(() =>
  import("./features/pomodoro/PomodoroPanel").then((module) => ({
    default: module.PomodoroPanel,
  })),
);
const TodoPanel = lazy(() =>
  import("./features/todos/TodoPanel").then((module) => ({
    default: module.TodoPanel,
  })),
);

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("notes");
  const [loadedTabs, setLoadedTabs] = useState<Record<ActiveTab, boolean>>({
    todos: false,
    pomodoro: false,
    notes: false,
  });

  useEffect(() => {
    void loadActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === "notes") {
        void loadNotesOnly();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [activeTab]);

  useEffect(() => {
    return subscribeTodosChanged(() => {
      if (loadedTabs.todos) {
        void loadTodosOnly();
      }
    });
  }, [loadedTabs.todos]);

  async function loadActiveTab(tab: ActiveTab) {
    if (loadedTabs[tab]) return;

    try {
      if (tab === "todos") {
        setTodos(await listTodos());
      } else if (tab === "pomodoro") {
        setSessions(await listTodaySessions());
      } else {
        setNotes(await listNotes());
      }
      setLoadedTabs((current) => ({ ...current, [tab]: true }));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    }
  }

  async function loadTodosOnly() {
    try {
      setTodos(await listTodos());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    }
  }

  async function loadNotesOnly() {
    try {
      setNotes(await listNotes());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    }
  }

  return (
    <TooltipProvider>
      <main className="relative flex h-screen max-h-screen flex-col overflow-hidden px-24 py-16 rounded-3xl bg-background">
        {errorMessage ? (
          <div className="mb-4 shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="absolute top-[42px] left-[64px] z-10 size-20">
          <div
            aria-hidden
            className="absolute -inset-2 rounded-full bg-background [clip-path:polygon(50%_50%,100%_25%,100%_100%,25%_100%)]"
          />
          <button
            className="relative z-10 grid size-20 place-items-center rounded-full bg-white text-foreground shadow-lg ring-1 ring-border transition-all hover:scale-105 active:scale-95 overflow-hidden pointer-events-none"
            type="button"
          >
            {(() => {
              const currentTab = tabs.find((t) => t.id === activeTab);
              const Icon = currentTab?.icon;
              return Icon ? (
                <div
                  key={activeTab}
                  className="flex items-center justify-center animate-in fade-in zoom-in duration-200"
                >
                  <Icon size={24} />
                </div>
              ) : null;
            })()}
          </button>

          {/* Left zone - Previous */}
          <div
            className="absolute left-0 top-0 h-full w-1/2 cursor-pointer rounded-l-full z-20"
            onClick={() => {
              const currentIndex = tabs.findIndex((t) => t.id === activeTab);
              const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
              setActiveTab(tabs[prevIndex].id);
            }}
            aria-label="Previous tab"
          />

          {/* Right zone - Next */}
          <div
            className="absolute right-0 top-0 h-full w-1/2 cursor-pointer rounded-r-full z-20"
            onClick={() => {
              const currentIndex = tabs.findIndex((t) => t.id === activeTab);
              const nextIndex = (currentIndex + 1) % tabs.length;
              setActiveTab(tabs[nextIndex].id);
            }}
            aria-label="Next tab"
          />
        </div>

        <section className="min-h-0 flex-1 overflow-hidden rounded-3xl">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center rounded-3xl bg-white text-sm font-semibold text-muted-foreground">
                Loading...
              </div>
            }
          >
            {activeTab === "todos" ? (
              <TodoPanel
                onError={setErrorMessage}
                setTodos={setTodos}
                todos={todos}
              />
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
          </Suspense>
        </section>
      </main>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
