export type TodoStatus = "backlog" | "todo" | "doing" | "done";
export type TodoPriority = "low" | "normal" | "high";

export const todoTags = ["#madison", "#peronal", "#galophy"] as const;
export type TodoTag = (typeof todoTags)[number];
export const TODO_DEFAULT_TAG: TodoTag = "#peronal";

export const todoTagMeta: Record<
  TodoTag,
  {
    color: string;
    label: string;
  }
> = {
  "#madison": { color: "text-violet-600", label: "madison" },
  "#peronal": { color: "text-sky-600", label: "peronal" },
  "#galophy": { color: "text-emerald-600", label: "galophy" },
};

export type Todo = {
  id: number;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  tag: TodoTag;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TodoColumn = {
  status: TodoStatus;
  title: string;
  tone: string;
};

export const todoColumns: TodoColumn[] = [
  { status: "backlog", title: "Backlog", tone: "bg-slate-400" },
  { status: "todo", title: "Todo", tone: "bg-sky-500" },
  { status: "doing", title: "Doing", tone: "bg-amber-500" },
  { status: "done", title: "Done", tone: "bg-rose-500" },
];
