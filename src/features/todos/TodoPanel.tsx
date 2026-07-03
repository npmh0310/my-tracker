import { useRef, useState } from "react";
import type { ComponentType, FormEvent, Ref } from "react";
import { addDays, format } from "date-fns";
import {
  Check,
  CheckCircle2,
  Calendar,
  Flag,
  Hash,
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
import {
  TODO_DEFAULT_TAG,
  Todo,
  TodoPriority,
  TodoTag,
  todoTagMeta,
  todoTags,
} from "./types";

type TodoPanelProps = {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  onError: (message: string) => void;
};

type TodoView = "today" | "upcoming" | "all" | "completed";
type CreateTaskView = Exclude<TodoView, "completed">;

function canCreateTaskInView(view: TodoView): view is CreateTaskView {
  return view !== "completed";
}

export function TodoPanel({ todos, setTodos, onError }: TodoPanelProps) {
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<TodoView>("all");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const todoState = useTodos(todos, setTodos, onError);
  const canCreateTask = canCreateTaskInView(view);
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const tomorrowIso = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const activeTodos = todoState.visibleTodos.filter(
    (todo) => todo.status !== "done",
  );
  const todayTodos = activeTodos.filter(
    (todo) => !todo.due_at || todo.due_at <= todayIso,
  );
  const upcomingTodos = activeTodos.filter(
    (todo) => todo.due_at && todo.due_at > todayIso,
  );
  const completedTodos = todoState.visibleTodos.filter(
    (todo) => todo.status === "done",
  );
  const allTodos = todoState.visibleTodos;
  const selectedTodos = {
    today: todayTodos,
    upcoming: upcomingTodos,
    all: allTodos,
    completed: completedTodos,
  }[view];
  const resetTaskDraft = () => {
    todoState.setTaskTitle("");
    todoState.setTaskDescription("");
    todoState.setTaskDueAt("");
    todoState.setTaskPriority("normal");
    todoState.setTaskTag(TODO_DEFAULT_TAG);
    setIsCreatingTask(false);
  };
  const changeView = (nextView: TodoView) => {
    if (nextView !== view) {
      resetTaskDraft();
    }
    setView(nextView);
  };
  const startCreatingTask = () => {
    if (view === "upcoming") {
      todoState.setTaskDueAt(tomorrowIso);
    }
    setIsCreatingTask(true);
    window.requestAnimationFrame(() => taskInputRef.current?.focus());
  };
  const startQuickTask = () => {
    resetTaskDraft();
    if (view === "completed") {
      setView("all");
    }
    setIsCreatingTask(true);
    window.requestAnimationFrame(() => taskInputRef.current?.focus());
  };

  return (
    <section className="flex h-full min-h-0 overflow-hidden rounded-3xl border border-border/90 bg-[#f7f7f8] shadow-panel w-full">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-zinc-200/70 bg-[#fbfbfb] p-4">
        <Button
          className="ml-14 mb-4 h-10 w-full justify-start rounded-xl bg-transparent px-2 text-sm font-bold text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
          onClick={startQuickTask}
          type="button"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-600 text-white">
            <Plus size={14} strokeWidth={3} />
          </span>
          Add task
        </Button>

        <label className="mb-4 flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-muted-foreground shadow-sm ring-1 ring-zinc-200/70">
          <Search size={17} />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) =>
              todoState.setSearchQuery(event.currentTarget.value)
            }
            placeholder="Search"
            value={todoState.searchQuery}
          />
        </label>

        <nav className="grid gap-1 text-sm font-semibold">
          <SideItem
            active={view === "all"}
            count={allTodos.length}
            icon={Hash}
            label="All"
            onClick={() => changeView("all")}
          />
          <SideItem
            active={view === "today"}
            count={todayTodos.length}
            icon={Sun}
            label="Today"
            onClick={() => changeView("today")}
          />
          <SideItem
            active={view === "upcoming"}
            count={upcomingTodos.length}
            icon={Calendar}
            label="Upcoming"
            onClick={() => changeView("upcoming")}
          />
          <SideItem
            active={view === "completed"}
            count={completedTodos.length}
            icon={CheckCircle2}
            label="Completed"
            onClick={() => changeView("completed")}
          />
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex h-full min-h-0 flex-col px-10 py-8">
          <div className="ml-2 flex w-full max-w-[760px] shrink-0 items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <CheckCircle2 size={15} />
            <span>{selectedTodos.length} task</span>
          </div>

          <div className="mt-7 flex min-h-0 flex-1 flex-col bg-white">
            {canCreateTask && selectedTodos.length === 0 ? (
              <EmptyTaskState onAddTask={startCreatingTask} view={view} />
            ) : view === "completed" && completedTodos.length === 0 ? (
              <EmptyCompleted />
            ) : !canCreateTask && selectedTodos.length === 0 ? (
              <EmptyList view={view} />
            ) : view === "all" ? (
              <AllTasksByTag
                onAddTask={startCreatingTask}
                onRemove={todoState.removeTask}
                onToggle={todoState.toggleCompleted}
                todos={allTodos}
              />
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="w-full pr-3">
                  {selectedTodos.map((todo) => (
                    <TaskRow
                      completed={view === "completed"}
                      key={todo.id}
                      onRemove={todoState.removeTask}
                      onToggle={todoState.toggleCompleted}
                      todo={todo}
                    />
                  ))}

                  {canCreateTask ? (
                    <button
                      className="mt-2 flex h-10 w-full items-center gap-3 px-2 text-left text-[13px] font-medium text-muted-foreground transition hover:text-red-500 rounded-3xl"
                      onClick={startCreatingTask}
                      type="button"
                    >
                      <Plus className="text-red-500" size={16} />
                      Add task
                    </button>
                  ) : null}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>

      {canCreateTask && isCreatingTask ? (
        <TaskComposerModal
          description={todoState.taskDescription}
          dueAt={todoState.taskDueAt}
          onCancel={resetTaskDraft}
          onDescriptionChange={todoState.setTaskDescription}
          onDueAtChange={todoState.setTaskDueAt}
          onPriorityChange={todoState.setTaskPriority}
          onSubmit={async (event) => {
            const created = await todoState.createTask(event);
            if (created) {
              setIsCreatingTask(false);
            }
          }}
          onTagChange={todoState.setTaskTag}
          onTitleChange={todoState.setTaskTitle}
          priority={todoState.taskPriority}
          tag={todoState.taskTag}
          title={todoState.taskTitle}
          titleRef={taskInputRef}
        />
      ) : null}
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
        "flex h-10 items-center gap-3 rounded-3xl px-3 text-left text-zinc-700 transition",
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

function EmptyTaskState({
  onAddTask,
  view,
}: {
  onAddTask: () => void;
  view: Extract<TodoView, "today" | "upcoming" | "all">;
}) {
  const emptyCopy = {
    all: {
      title: "No task yet",
      description: "Thêm task đầu tiên rồi phân loại bằng tag để dễ theo dõi.",
    },
    today: {
      title: "No task today",
      description: "Thêm task mới hoặc chọn ngày để task hiện ở Today.",
    },
    upcoming: {
      title: "No upcoming task",
      description: "Thêm task mới hoặc chọn ngày sau để task hiện ở Upcoming.",
    },
  }[view];

  return (
    <div className="grid min-h-0 flex-1 place-items-center px-6 py-10 text-center">
      <div className="max-w-[310px]">
        <img alt="" className="mx-auto mb-2 h-36 w-36" src={emptyInbox} />
        <h2 className="text-base font-bold text-zinc-900">{emptyCopy.title}</h2>
        <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
          {emptyCopy.description}
        </p>
        <Button
          className="mt-5 min-h-8 rounded-3xl bg-red-500 px-3 text-xs hover:bg-red-600"
          onClick={onAddTask}
        >
          <Plus size={15} />
          Add task
        </Button>
      </div>
    </div>
  );
}

function EmptyList({ view }: { view: TodoView }) {
  const message =
    view === "all" ? "Chưa có task nào." : "Không có task nào cho ngày sau.";

  return (
    <div className="grid min-h-0 flex-1 place-items-center px-6 py-10 text-center">
      <p className="text-[13px] font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function AllTasksByTag({
  onAddTask,
  onRemove,
  onToggle,
  todos,
}: {
  onAddTask: () => void;
  onRemove: (id: number) => Promise<void>;
  onToggle: (todo: Todo) => Promise<void>;
  todos: Todo[];
}) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-5 pr-3">
        {todoTags.map((tag) => {
          const tagTodos = todos.filter((todo) => todo.tag === tag);
          if (tagTodos.length === 0) return null;

          const completedCount = tagTodos.filter(
            (todo) => todo.status === "done",
          ).length;

          return (
            <section className="min-w-0" key={tag}>
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-3xl bg-zinc-50 px-2.5 text-xs font-bold",
                    todoTagMeta[tag].color,
                  )}
                >
                  <Hash size={14} />
                  {todoTagMeta[tag].label}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {tagTodos.length} task
                  {completedCount ? `, ${completedCount} done` : ""}
                </span>
              </div>

              <div className="overflow-hidden rounded-3xl border border-zinc-100">
                {tagTodos.map((todo) => (
                  <TaskRow
                    completed={todo.status === "done"}
                    key={todo.id}
                    onRemove={onRemove}
                    onToggle={onToggle}
                    todo={todo}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <button
          className="flex h-10 w-full items-center gap-3 px-2 text-left text-[13px] font-medium text-muted-foreground transition hover:text-red-500 rounded-3xl"
          onClick={onAddTask}
          type="button"
        >
          <Plus className="text-red-500" size={16} />
          Add task
        </button>
      </div>
    </ScrollArea>
  );
}

function TaskComposerModal(props: TaskComposerProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-5"
      onClick={props.onCancel}
    >
      <div
        className="w-full max-w-[820px]"
        onClick={(event) => event.stopPropagation()}
      >
        <TaskComposer {...props} />
      </div>
    </div>
  );
}

type TaskComposerProps = {
  description: string;
  dueAt: string;
  onCancel: () => void;
  onDescriptionChange: (value: string) => void;
  onDueAtChange: (value: string) => void;
  onPriorityChange: (value: TodoPriority) => void;
  onTagChange: (value: TodoTag) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onTitleChange: (value: string) => void;
  priority: TodoPriority;
  tag: TodoTag;
  title: string;
  titleRef: Ref<HTMLInputElement>;
};

function TaskComposer({
  description,
  dueAt,
  onCancel,
  onDescriptionChange,
  onDueAtChange,
  onPriorityChange,
  onTagChange,
  onSubmit,
  onTitleChange,
  priority,
  tag,
  title,
  titleRef,
}: TaskComposerProps) {
  const canSubmit = title.trim().length > 0;

  return (
    <form
      className="w-full shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-panel"
      onSubmit={(event) => {
        if (!canSubmit) {
          event.preventDefault();
          return;
        }
        void onSubmit(event);
      }}
    >
      <div className="px-6 py-5">
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
            <SelectTrigger className="h-8 min-w-[112px] rounded-3xl border-zinc-200 bg-white px-2.5 text-xs hover:bg-zinc-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <PriorityLabel priority="low" />
              </SelectItem>
              <SelectItem value="normal">
                <PriorityLabel priority="normal" />
              </SelectItem>
              <SelectItem value="high">
                <PriorityLabel priority="high" />
              </SelectItem>
            </SelectContent>
          </Select>
          <button
            className="grid h-8 w-8 place-items-center rounded-3xl border border-zinc-200 bg-white hover:bg-zinc-50"
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

      <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Select
            value={tag}
            onValueChange={(value) => onTagChange(value as TodoTag)}
          >
            <SelectTrigger className="h-8 min-w-[126px] rounded-3xl border-transparent bg-transparent px-2 text-xs hover:bg-zinc-50">
              <TagLabel tag={tag} />
            </SelectTrigger>
            <SelectContent>
              {todoTags.map((item) => (
                <SelectItem key={item} value={item}>
                  <TagLabel tag={item} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="min-h-8 rounded-3xl bg-zinc-100 px-3 text-xs text-zinc-700 hover:bg-zinc-200"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="min-h-8 rounded-3xl bg-red-400 px-3 text-xs hover:bg-red-500 disabled:bg-zinc-100 disabled:text-zinc-400"
            disabled={!canSubmit}
            type="submit"
          >
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
  const [open, setOpen] = useState(false);
  const today = new Date();
  const quickDates = [
    { icon: Calendar, label: "Today", date: today, tone: "text-green-600" },
    {
      icon: Sun,
      label: "Tomorrow",
      date: addDays(today, 1),
      tone: "text-amber-500",
    },
    {
      icon: Calendar,
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="h-8 min-h-8 w-28 justify-start rounded-3xl border border-zinc-200 bg-white px-2.5 text-xs font-normal text-zinc-700 hover:bg-zinc-50"
          id="todo-date-picker"
          type="button"
        >
          <Calendar size={15} />
          {date ? format(date, "MMM d") : <span>Date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[252px] overflow-hidden p-0"
        sideOffset={5}
      >
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
                className="flex h-8 items-center justify-between rounded-3xl px-2 text-left text-sm hover:bg-zinc-50"
                key={item.label}
                onClick={() => {
                  onDueAtChange(format(item.date, "yyyy-MM-dd"));
                  setOpen(false);
                }}
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
              setOpen(false);
            }}
            selected={date}
            weekStartsOn={1}
          />
        </div>
        {dueAt ? (
          <div className=" p-2">
            <button
              className="h-8 w-full rounded-3xl text-xs font-semibold text-muted-foreground hover:bg-zinc-50"
              onClick={() => {
                onDueAtChange("");
                setOpen(false);
              }}
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
        <CheckCircle2 className="mx-auto mb-4 text-zinc-300" size={40} />
        <h2 className="text-base font-bold text-zinc-900">
          Chưa có task hoàn thành
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
          Khi tick xong task ở Today, task sẽ chuyển qua đây.
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
    <div className="group flex min-h-[64px] items-start gap-3 border-b border-zinc-100 px-4 py-3 transition hover:bg-zinc-50/80 last:border-b-0">
      <button
        className={cn(
          "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-3xl border-2 transition",
          priorityToggleColor(todo.priority, completed),
        )}
        onClick={() => void onToggle(todo)}
        title={completed ? "Mark active" : "Complete task"}
        type="button"
      >
        <Check size={13} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div
            className={cn(
              "min-w-0 break-words text-[15px] font-semibold leading-5 text-zinc-900",
              completed && "text-muted-foreground line-through",
            )}
          >
            {todo.title}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {todo.due_at ? (
              <span className="inline-flex h-6 items-center gap-1 rounded-3xl bg-zinc-100 px-2 text-[11px] font-semibold text-zinc-500">
                <Calendar size={12} />
                {todo.due_at}
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-3xl px-2 text-[11px] font-bold",
                tagPillColor(todo.tag),
              )}
            >
              {todo.tag}
            </span>
            {todo.priority !== "normal" ? (
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded-3xl px-2 text-[11px] font-bold",
                  priorityPillColor(todo.priority),
                )}
              >
                {todo.priority}
              </span>
            ) : null}
          </div>
        </div>

        {todo.description ? (
          <p
            className={cn(
              "mt-1 max-w-[680px] break-words text-[13px] leading-5 text-muted-foreground",
              completed && "line-through",
            )}
          >
            {todo.description}
          </p>
        ) : null}
      </div>

      <button
        className="mt-0.5 shrink-0 rounded-3xl p-1 text-muted-foreground opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        onClick={() => void onRemove(todo.id)}
        title="Delete task"
        type="button"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function priorityToggleColor(priority: TodoPriority, completed: boolean) {
  if (priority === "high") {
    return completed
      ? "border-red-500 bg-red-500 text-white"
      : "border-red-400 text-transparent hover:bg-red-50 hover:text-red-500";
  }

  if (priority === "low") {
    return completed
      ? "border-sky-500 bg-sky-500 text-white"
      : "border-sky-400 text-transparent hover:bg-sky-50 hover:text-sky-500";
  }

  return completed
    ? "border-amber-500 bg-amber-500 text-white"
    : "border-amber-400 text-transparent hover:bg-amber-50 hover:text-amber-500";
}

function priorityPillColor(priority: TodoPriority) {
  if (priority === "high") return "bg-red-50 text-red-600";
  if (priority === "low") return "bg-sky-50 text-sky-600";
  return "bg-amber-50 text-amber-600";
}

function tagPillColor(tag: TodoTag) {
  if (tag === "#madison") return "bg-violet-50 text-violet-600";
  if (tag === "#galophy") return "bg-emerald-50 text-emerald-600";
  return "bg-sky-50 text-sky-600";
}

function PriorityLabel({ priority }: { priority: TodoPriority }) {
  const label = priorityLabels[priority];

  return (
    <span className="flex items-center gap-2">
      <Flag
        className={cn("shrink-0", priorityFlagColor(priority))}
        fill="currentColor"
        size={15}
      />
      <span>{label}</span>
    </span>
  );
}

function TagLabel({ tag }: { tag: TodoTag }) {
  const meta = todoTagMeta[tag];

  return (
    <span className="flex items-center gap-2">
      <Hash className={cn("shrink-0", meta.color)} size={15} />
      <span className={meta.color}>{meta.label}</span>
    </span>
  );
}

const priorityLabels: Record<TodoPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

function priorityFlagColor(priority: TodoPriority) {
  if (priority === "high") return "text-red-500";
  if (priority === "low") return "text-sky-500";
  return "text-amber-500";
}
