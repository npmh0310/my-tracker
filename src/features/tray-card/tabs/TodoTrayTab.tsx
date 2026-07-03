import {
  Check,
  CirclePlus,
  CornerDownLeft,
  Inbox,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createTodo,
  deleteTodo,
  listTodos,
  moveTodo,
  notifyTodosChanged,
  subscribeTodosChanged,
} from "../../todos/api";
import { TODO_DEFAULT_TAG, todoTagMeta, todoTags } from "../../todos/types";
import type { Todo, TodoPriority, TodoTag } from "../../todos/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../shared/ui/popover";

type TodoFilter = "all" | "today" | "upcoming" | "completed";

export function TodoTrayTab() {
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTag, setTaskTag] = useState<TodoTag>(TODO_DEFAULT_TAG);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void loadTodos();

    return subscribeTodosChanged(() => {
      void loadTodos({ showLoading: false });
    });
  }, []);

  const visibleTodos = useMemo(() => {
    const activeTodos = todos.filter((todo) => todo.status !== "done");
    const completedTodos = todos.filter((todo) => todo.status === "done");
    const todayTodos = activeTodos.filter((todo) => todo.due_at === todayIso);
    const upcomingTodos = activeTodos.filter((todo) => todo.due_at !== todayIso);

    if (filter === "all") return sortTodos(activeTodos, todayIso);
    if (filter === "today") return sortTodos(todayTodos, todayIso);
    if (filter === "upcoming") return sortTodos(upcomingTodos, todayIso);
    return sortTodos(completedTodos, todayIso);
  }, [filter, todayIso, todos]);
  const todoCounts = useMemo(() => {
    const activeTodos = todos.filter((todo) => todo.status !== "done");
    return {
      all: activeTodos.length,
      today: activeTodos.filter((todo) => todo.due_at === todayIso).length,
      upcoming: activeTodos.filter((todo) => todo.due_at !== todayIso).length,
      completed: todos.filter((todo) => todo.status === "done").length,
    };
  }, [todayIso, todos]);

  async function loadTodos({ showLoading = true } = {}) {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setTodos(await listTodos());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }

  async function handleCreateTodo(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle || isCreating) return;

    try {
      setIsCreating(true);
      const todo = await createTodo({
        title: trimmedTitle,
        description: "",
        status: "todo",
        priority: "normal",
        tag: taskTag,
        dueAt: todayIso,
      });
      setTodos((current) => [todo, ...current]);
      notifyTodosChanged();
      setTaskTitle("");
      setFilter("today");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleTodo(todo: Todo) {
    const nextStatus = todo.status === "done" ? "todo" : "done";

    try {
      const updated = await moveTodo(todo.id, nextStatus);
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyTodosChanged();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    }
  }

  async function removeTodo(id: number) {
    try {
      setTodos((current) => current.filter((todo) => todo.id !== id));
      await deleteTodo(id);
      notifyTodosChanged();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
      void loadTodos();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col pt-3">
      <form
        className="flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/[0.12] px-3 transition focus-within:border-white/[0.16]"
        onSubmit={handleCreateTodo}
      >
        <CirclePlus className="shrink-0 text-white/45" size={17} />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-bold text-white outline-none placeholder:text-white/35"
          onChange={(event) => setTaskTitle(event.target.value)}
          placeholder="Add task"
          value={taskTitle}
        />
        <TagPicker selectedTag={taskTag} onTagChange={setTaskTag} />
        <button
          aria-label="Add task"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-500/70 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-zinc-400/70 disabled:opacity-40"
          disabled={!taskTitle.trim() || isCreating}
          title="Add task"
          type="submit"
        >
          <CornerDownLeft size={16} strokeWidth={2.4} />
        </button>
      </form>

      <nav className="mt-3 flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-1">
        {(["all", "today", "upcoming", "completed"] as const).map((item) => (
          <button
            className={`relative h-8 text-[12px] font-bold transition ${
              filter === item
                ? "text-white"
                : "text-white/40 hover:text-white/70"
            }`}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            <span className="inline-flex items-center gap-1.5">
              {filterLabel(item)}
              <span className="text-[10px] text-white/30">
                {todoCounts[item]}
              </span>
            </span>
            {filter === item ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-zinc-300/85" />
            ) : null}
          </button>
        ))}
      </nav>

      {errorMessage ? (
        <div className="mt-3 shrink-0 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid h-full place-items-center text-[13px] font-semibold text-white/50">
            Loading...
          </div>
        ) : visibleTodos.length ? (
          <div className="space-y-1.5">
            {visibleTodos.map((todo) => (
              <TodoRow
                key={todo.id}
                onRemove={removeTodo}
                onToggle={toggleTodo}
                todayIso={todayIso}
                todo={todo}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}
      </div>
    </div>
  );
}

function TagPicker({
  onTagChange,
  selectedTag,
}: {
  onTagChange: (tag: TodoTag) => void;
  selectedTag: TodoTag;
}) {
  const selectedMeta = todoTagMeta[selectedTag];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Choose tag"
          className="inline-flex h-8 max-w-[92px] shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 text-[11px] font-bold text-white/65 transition hover:bg-white/[0.13] hover:text-white"
          title={`Tag: ${selectedMeta.label}`}
          type="button"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${tagDotColor(selectedTag)}`} />
          <span className="min-w-0 truncate">{selectedMeta.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-36 rounded-2xl border-white/[0.12] bg-zinc-900/95 p-1 text-white shadow-xl"
        sideOffset={8}
      >
        {todoTags.map((tag) => {
          const meta = todoTagMeta[tag];
          const isSelected = tag === selectedTag;

          return (
            <button
              className={`flex h-9 w-full items-center gap-2 rounded-xl px-2.5 text-left text-[12px] font-bold transition ${
                isSelected
                  ? "bg-white/[0.14] text-white"
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white"
              }`}
              key={tag}
              onClick={() => onTagChange(tag)}
              type="button"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tagDotColor(tag)}`} />
              <span className="min-w-0 truncate">{meta.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function TodoRow({
  onRemove,
  onToggle,
  todayIso,
  todo,
}: {
  onRemove: (id: number) => Promise<void>;
  onToggle: (todo: Todo) => Promise<void>;
  todayIso: string;
  todo: Todo;
}) {
  const completed = todo.status === "done";

  return (
    <div className="group flex min-h-[52px] items-start gap-2.5 rounded-2xl px-2.5 py-2 transition hover:bg-white/[0.055]">
      <button
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
          completed
            ? "border-zinc-400 bg-zinc-400 text-zinc-950"
            : `${priorityBorderColor(todo.priority)} text-transparent hover:bg-white/10 hover:text-white`
        }`}
        onClick={() => void onToggle(todo)}
        title={completed ? "Mark active" : "Complete task"}
        type="button"
      >
        <Check size={13} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={`break-words text-[13px] font-bold leading-5 ${
            completed ? "text-white/40 line-through" : "text-white/90"
          }`}
        >
          {todo.title}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${tagDotColor(todo.tag)}`}
            title={tagLabel(todo.tag)}
          />
          <span className="truncate text-[10px] font-bold text-white/30">
            {tagLabel(todo.tag)}
          </span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-white/[0.18]" />
          {todo.due_at ? (
            <span
              className={`shrink-0 text-[10px] font-bold ${
                todo.due_at <= todayIso
                  ? "text-emerald-200"
                  : "text-white/40"
              }`}
            >
              {formatDateLabel(todo.due_at, todayIso)}
            </span>
          ) : null}
        </div>
        {todo.description ? (
          <p
            className={`mt-1 line-clamp-2 break-words text-[12px] leading-4 ${
              completed ? "text-white/30 line-through" : "text-white/40"
            }`}
          >
            {todo.description}
          </p>
        ) : null}
        {todo.priority !== "normal" ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityPillColor(
                todo.priority,
              )}`}
            >
              {todo.priority}
            </span>
          </div>
        ) : null}
      </div>

      <button
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/30 opacity-0 transition hover:bg-red-500/15 hover:text-red-200 group-hover:opacity-100"
        onClick={() => void onRemove(todo.id)}
        title="Delete task"
        type="button"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function EmptyState({ filter }: { filter: TodoFilter }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        <Inbox className="mx-auto mb-3 text-white/20" size={34} />
        <div className="text-[13px] font-bold text-white/60">
          {emptyLabel(filter)}
        </div>
      </div>
    </div>
  );
}

function filterLabel(filter: TodoFilter) {
  if (filter === "all") return "All";
  if (filter === "today") return "Today";
  if (filter === "upcoming") return "Upcoming";
  return "Completed";
}

function emptyLabel(filter: TodoFilter) {
  if (filter === "all") return "No tasks";
  if (filter === "today") return "No tasks for today";
  if (filter === "upcoming") return "No upcoming tasks";
  return "No completed tasks";
}

function sortTodos(todos: Todo[], todayIso: string) {
  return [...todos].sort((left, right) => {
    const leftDue = left.due_at ?? todayIso;
    const rightDue = right.due_at ?? todayIso;
    if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);
    return right.created_at.localeCompare(left.created_at);
  });
}

function priorityBorderColor(priority: TodoPriority) {
  if (priority === "high") return "border-red-400/75";
  if (priority === "low") return "border-sky-400/75";
  return "border-amber-400/75";
}

function priorityPillColor(priority: TodoPriority) {
  if (priority === "high") return "bg-red-400/15 text-red-200";
  if (priority === "low") return "bg-sky-400/15 text-sky-200";
  return "bg-amber-400/15 text-amber-200";
}

function tagLabel(tag: TodoTag) {
  return tag.replace("#", "");
}

function tagDotColor(tag: TodoTag) {
  if (tag === "#madison") return "bg-violet-300/80";
  if (tag === "#galophy") return "bg-emerald-300/80";
  return "bg-sky-300/80";
}

function formatDateLabel(dueAt: string, todayIso: string) {
  if (dueAt <= todayIso) return "Today";
  return format(new Date(`${dueAt}T00:00:00`), "MMM d");
}
