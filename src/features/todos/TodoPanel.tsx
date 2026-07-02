import { useRef, useState } from "react";
import type { ComponentType, FormEvent, Ref } from "react";
import { addDays, format } from "date-fns";
import {
  Check,
  CheckCircle2,
  Calendar,
  Flag,
  Inbox,
  List,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { ScrollArea } from "../../shared/ui/scroll-area";
import { Calendar as CalendarPicker } from "../../shared/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/ui/select";
import { cn } from "../../shared/lib/utils";
import emptyInbox from "../../assets/empty-inbox.svg";
import { useTodos } from "./useTodos";
import { Todo, TodoPriority } from "./types";

type TodoPanelProps = {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  onError: (message: string) => void;
};

type TodoView = "inbox" | "completed";

export function TodoPanel({ todos, setTodos, onError }: TodoPanelProps) {
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<TodoView>("inbox");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const todoState = useTodos(todos, setTodos, onError);
  const activeTodos = todoState.visibleTodos.filter(
    (todo) => todo.status !== "done",
  );
  const completedTodos = todoState.visibleTodos.filter(
    (todo) => todo.status === "done",
  );

  return (
    <section className="flex h-full min-h-0 overflow-hidden rounded-3xl border border-border/90 bg-[#f7f7f8] shadow-panel w-full">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-zinc-200/70 bg-[#fbfbfb] p-4">
        <div className="mb-6 flex items-center gap-3 rounded-2xl px-2 py-1.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-sm font-bold text-white">
            PT
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">Personal Tracker</div>
            <div className="text-xs text-muted-foreground">Todo list</div>
          </div>
        </div>

        <label className="mb-4 flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-muted-foreground shadow-sm ring-1 ring-zinc-200/70">
          <Search size={17} />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => todoState.setSearchQuery(event.currentTarget.value)}
            placeholder="Search"
            value={todoState.searchQuery}
          />
        </label>

        <nav className="grid gap-1 text-sm font-semibold">
          <SideItem
            active={view === "inbox"}
            count={activeTodos.length}
            icon={Inbox}
            label="Inbox"
            onClick={() => setView("inbox")}
          />
          <SideItem
            active={view === "completed"}
            count={completedTodos.length}
            icon={CheckCircle2}
            label="Completed"
            onClick={() => setView("completed")}
          />
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex h-full min-h-0 flex-col px-12 py-10">
          <div className="ml-4 w-full max-w-[760px] shrink-0">
            <div>
              <h1 className="text-[30px] font-extrabold leading-tight tracking-normal">
                {view === "inbox" ? "Inbox" : "Completed"}
              </h1>
              <p className="mt-1 text-[15px] text-muted-foreground">
                {view === "inbox"
                  ? `${activeTodos.length} task đang mở`
                  : `${completedTodos.length} task đã xong`}
              </p>
            </div>
          </div>

          <div className="mt-7 flex min-h-0 flex-1 flex-col rounded-3xl border border-zinc-100 bg-white px-4 py-4 shadow-sm">
            {view === "inbox" && isCreatingTask ? (
              <TaskComposer
                description={todoState.taskDescription}
                onCancel={() => {
                  todoState.setTaskTitle("");
                  todoState.setTaskDescription("");
                  todoState.setTaskDueAt("");
                  todoState.setTaskPriority("normal");
                  setIsCreatingTask(false);
                }}
                onDescriptionChange={todoState.setTaskDescription}
                dueAt={todoState.taskDueAt}
                onDueAtChange={todoState.setTaskDueAt}
                onPriorityChange={todoState.setTaskPriority}
                onSubmit={async (event) => {
                  const created = await todoState.createTask(event);
                  if (created) {
                    setIsCreatingTask(false);
                  }
                }}
                priority={todoState.taskPriority}
                onTitleChange={todoState.setTaskTitle}
                title={todoState.taskTitle}
                titleRef={taskInputRef}
              />
            ) : null}

            {view === "inbox" && activeTodos.length === 0 && !isCreatingTask ? (
              <EmptyInbox
                onAddTask={() => {
                  setIsCreatingTask(true);
                  window.requestAnimationFrame(() => taskInputRef.current?.focus());
                }}
              />
            ) : view === "completed" && completedTodos.length === 0 ? (
              <EmptyCompleted />
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="w-full pr-3">
                  {view === "inbox" && !isCreatingTask ? (
                    <button
                      className="mb-3 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-bold text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setIsCreatingTask(true);
                        window.requestAnimationFrame(() =>
                          taskInputRef.current?.focus(),
                        );
                      }}
                      type="button"
                    >
                      <Plus size={17} />
                      Add task
                    </button>
                  ) : null}
                  {(view === "inbox" ? activeTodos : completedTodos).map((todo) => (
                    <TaskRow
                      completed={view === "completed"}
                      key={todo.id}
                      onRemove={todoState.removeTask}
                      onToggle={todoState.toggleCompleted}
                      todo={todo}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </section>
  );
}

function SideItem({
  active = false,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  count: number;
  icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-10 items-center gap-3 rounded-xl px-3 text-left text-zinc-700 transition",
        active ? "bg-red-50 text-red-500" : "hover:bg-zinc-100",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon size={18} />
      <span>{label}</span>
      <span className="ml-auto text-xs">{count}</span>
    </button>
  );
}

function EmptyInbox({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-6 py-10 text-center">
      <div className="max-w-[310px]">
        <img alt="" className="mx-auto mb-7 h-36 w-36" src={emptyInbox} />
        <h2 className="text-xl font-extrabold text-zinc-900">
          Capture now, plan later
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
          Inbox là nơi ghi nhanh mọi task. Cứ thêm vào đây, sắp xếp sau khi bạn
          sẵn sàng.
        </p>
        <Button
          className="mt-6 bg-red-500 px-5 hover:bg-red-600"
          onClick={onAddTask}
        >
          <Plus size={18} />
          Add task
        </Button>
      </div>
    </div>
  );
}

function TaskComposer({
  description,
  dueAt,
  onCancel,
  onDescriptionChange,
  onDueAtChange,
  onPriorityChange,
  onSubmit,
  onTitleChange,
  priority,
  title,
  titleRef,
}: {
  description: string;
  dueAt: string;
  onCancel: () => void;
  onDescriptionChange: (value: string) => void;
  onDueAtChange: (value: string) => void;
  onPriorityChange: (value: TodoPriority) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onTitleChange: (value: string) => void;
  priority: TodoPriority;
  title: string;
  titleRef: Ref<HTMLInputElement>;
}) {
  return (
    <form
      className="mb-5 w-full shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      onSubmit={(event) => void onSubmit(event)}
    >
      <div className="p-3">
        <Input
          className="h-7 rounded-none border-0 bg-transparent px-0 text-base font-bold placeholder:text-zinc-400 focus:bg-transparent focus:ring-0"
          onChange={(event) => onTitleChange(event.currentTarget.value)}
          placeholder="Task name"
          ref={titleRef}
          value={title}
        />
        <Input
          className="mt-1 h-6 rounded-none border-0 bg-transparent px-0 text-sm placeholder:text-zinc-400 focus:bg-transparent focus:ring-0"
          onChange={(event) => onDescriptionChange(event.currentTarget.value)}
          placeholder="Description"
          value={description}
        />

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-zinc-600">
          <DatePickerSimple dueAt={dueAt} onDueAtChange={onDueAtChange} />
          <Select
            value={priority}
            onValueChange={(value) => onPriorityChange(value as TodoPriority)}
          >
            <SelectTrigger className="h-8 min-w-[112px] rounded-lg bg-white px-2.5 text-xs">
              <Flag size={15} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
            type="button"
          >
            <MoreHorizontal size={15} />
          </button>
          <div className="ml-auto flex items-center gap-3 text-zinc-500">
            <List size={18} />
            <SlidersHorizontal size={18} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2">
        <button
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
          type="button"
        >
          <Inbox size={15} />
          Inbox
        </button>
        <div className="flex items-center gap-2">
          <Button
            className="min-h-8 rounded-lg bg-zinc-100 px-3 text-xs text-zinc-700 hover:bg-zinc-200"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </Button>
          <Button className="min-h-8 rounded-lg bg-red-400 px-3 text-xs hover:bg-red-500" type="submit">
            Add task
          </Button>
        </div>
      </div>
    </form>
  );
}

function DatePickerSimple({
  dueAt,
  onDueAtChange,
}: {
  dueAt: string;
  onDueAtChange: (value: string) => void;
}) {
  const date = dueAt ? new Date(`${dueAt}T00:00:00`) : undefined;
  const today = new Date();
  const quickDates = [
    { icon: Calendar, label: "Today", date: today, tone: "text-green-600" },
    { icon: Sun, label: "Tomorrow", date: addDays(today, 1), tone: "text-amber-500" },
    {
      icon: Inbox,
      label: "This weekend",
      date: nextDay(today, 6),
      tone: "text-blue-600",
    },
    {
      icon: MoreHorizontal,
      label: "Next week",
      date: addDays(today, 7),
      tone: "text-violet-600",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-8 min-h-8 w-28 justify-start rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-normal text-zinc-700 hover:bg-zinc-50"
          id="todo-date-picker"
          type="button"
        >
          <Calendar size={15} />
          {date ? format(date, "MMM d") : <span>Date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[252px] overflow-hidden p-0" sideOffset={5}>
        <div className="border-b border-zinc-100 px-3 py-2">
          <input
            className="h-8 w-full rounded-lg border-0 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400 focus:bg-zinc-50"
            placeholder="Type a date"
            readOnly
            type="text"
            value={date ? format(date, "MMM d, yyyy") : ""}
          />
        </div>
        <div className="grid gap-0.5 border-b border-zinc-100 p-2">
          {quickDates.map((item) => {
            const Icon = item.icon;
            return (
            <button
              className="flex h-8 items-center justify-between rounded-lg px-2 text-left text-sm hover:bg-zinc-50"
              key={item.label}
              onClick={() => onDueAtChange(format(item.date, "yyyy-MM-dd"))}
              type="button"
            >
              <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-zinc-800">
                <Icon className={item.tone} size={15} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                {item.label === "Next week"
                  ? format(item.date, "MMM d")
                  : format(item.date, "EEE")}
              </span>
            </button>
            );
          })}
        </div>
        <div className="px-3 py-2">
          <CalendarPicker
            className="mx-auto"
            defaultMonth={date}
            mode="single"
            onSelect={(selectedDate) => {
              onDueAtChange(
                selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
              );
            }}
            selected={date}
            weekStartsOn={1}
          />
        </div>
        {dueAt ? (
          <div className="border-t border-zinc-100 p-2">
            <button
              className="h-8 w-full rounded-lg text-xs font-semibold text-muted-foreground hover:bg-zinc-50"
              onClick={() => onDueAtChange("")}
              type="button"
            >
              Clear date
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function nextDay(from: Date, day: number) {
  const diff = (day + 7 - from.getDay()) % 7;
  return addDays(from, diff === 0 ? 7 : diff);
}

function EmptyCompleted() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-6 py-10 text-center">
      <div className="max-w-[300px]">
        <CheckCircle2 className="mx-auto mb-5 text-zinc-300" size={64} />
        <h2 className="text-xl font-extrabold text-zinc-900">
          Chưa có task hoàn thành
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
          Khi tick xong task ở Inbox, task sẽ chuyển qua đây.
        </p>
      </div>
    </div>
  );
}

function TaskRow({
  completed,
  onRemove,
  onToggle,
  todo,
}: {
  completed: boolean;
  onRemove: (id: number) => Promise<void>;
  onToggle: (todo: Todo) => Promise<void>;
  todo: Todo;
}) {
  return (
    <div className="group flex min-h-[58px] items-start gap-3 border-b border-zinc-100 px-1 py-3 last:border-b-0">
      <button
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition",
          completed
            ? "border-red-500 bg-red-500 text-white"
            : "border-red-400 text-transparent hover:bg-red-50 hover:text-red-500",
        )}
        onClick={() => void onToggle(todo)}
        title={completed ? "Mark active" : "Complete task"}
        type="button"
      >
        <Check size={13} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "break-words text-[15px] font-semibold leading-5 text-zinc-900",
            completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </div>
        {todo.description ? (
          <p
            className={cn(
              "mt-1 break-words text-sm leading-5 text-muted-foreground",
              completed && "line-through",
            )}
          >
            {todo.description}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {todo.due_at ? <span>{todo.due_at}</span> : null}
          {todo.priority !== "normal" ? (
            <span className={priorityColor(todo.priority)}>
              {todo.priority}
            </span>
          ) : null}
        </div>
      </div>

      <button
        className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        onClick={() => void onRemove(todo.id)}
        title="Delete task"
        type="button"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function priorityColor(priority: TodoPriority) {
  if (priority === "high") return "font-bold text-red-500";
  if (priority === "low") return "font-bold text-sky-600";
  return "font-bold text-zinc-500";
}
