import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createTodo, deleteTodo, moveTodo, notifyTodosChanged } from "./api";
import {
  TODO_DEFAULT_TAG,
  Todo,
  TodoPriority,
  TodoStatus,
  TodoTag,
  todoTags,
} from "./types";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Nhập tên task trước khi thêm."),
  description: z.string(),
  priority: z.enum(["low", "normal", "high"]),
  tag: z.enum(todoTags),
  dueAt: z.string().nullable(),
});

const completedToastStyle = {
  background: "#ecfdf5",
  borderRadius: "8px",
  borderColor: "#a7f3d0",
  color: "#064e3b",
};

const deletedToastStyle = {
  background: "#f0f9ff",
  borderRadius: "8px",
  borderColor: "#bae6fd",
  color: "#0c4a6e",
};

const toastActionStyle = {
  background: "rgba(255, 255, 255, 0.84)",
  borderRadius: "24px",
  color: "inherit",
  fontSize: "12px",
  height: "28px",
  padding: "0 12px",
};

export function useTodos(
  initialTodos: Todo[],
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>,
  onError: (message: string) => void,
) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TodoPriority>("normal");
  const [taskTag, setTaskTag] = useState<TodoTag>(TODO_DEFAULT_TAG);
  const [taskDueAt, setTaskDueAt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleTodos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialTodos;
    return initialTodos.filter((todo) =>
      `${todo.title} ${todo.description}`.toLowerCase().includes(query),
    );
  }, [searchQuery, initialTodos]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    const parsed = taskSchema.safeParse({
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      tag: taskTag,
      dueAt: taskDueAt || null,
    });
    if (!parsed.success) {
      return;
    }

    try {
      const todo = await createTodo({
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        tag: parsed.data.tag,
        dueAt: parsed.data.dueAt,
        status: "todo",
      });
      setTodos((current) => [todo, ...current]);
      notifyTodosChanged();
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("normal");
      setTaskTag(TODO_DEFAULT_TAG);
      setTaskDueAt("");
      onError("");
      return true;
    } catch (error) {
      onError(String(error));
    }
    return false;
  }

  async function moveTask(id: number, status: TodoStatus) {
    try {
      const updated = await moveTodo(id, status);
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyTodosChanged();
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  async function toggleCompleted(todo: Todo) {
    const nextStatus = todo.status === "done" ? "todo" : "done";
    try {
      const updated = await moveTodo(todo.id, nextStatus);
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyTodosChanged();
      onError("");

      if (nextStatus === "done") {
        toast.success("Task completed", {
          actionButtonStyle: toastActionStyle,
          description: todo.title,
          style: completedToastStyle,
          action: {
            label: "Undo",
            onClick: () => {
              void undoCompleted(updated.id, todo.status);
            },
          },
        });
      }
    } catch (error) {
      onError(String(error));
    }
  }

  async function removeTask(id: number) {
    const removedTodo = initialTodos.find((todo) => todo.id === id);
    if (!removedTodo) return;

    let undone = false;
    let committed = false;
    const commitDelete = () => {
      if (undone || committed) return;
      committed = true;
      void permanentlyDeleteTask(id);
    };
    try {
      setTodos((current) => current.filter((todo) => todo.id !== id));
      onError("");
      toast("Task deleted", {
        actionButtonStyle: toastActionStyle,
        description: removedTodo.title,
        style: deletedToastStyle,
        action: {
          label: "Undo",
          onClick: () => {
            undone = true;
            setTodos((current) => {
              if (current.some((todo) => todo.id === removedTodo.id)) {
                return current;
              }
              return [removedTodo, ...current];
            });
          },
        },
        onAutoClose: () => {
          commitDelete();
        },
        onDismiss: () => {
          commitDelete();
        },
      });
    } catch (error) {
      onError(String(error));
    }
  }

  async function undoCompleted(id: number, status: TodoStatus) {
    try {
      const restored = await moveTodo(id, status);
      setTodos((current) =>
        current.map((item) => (item.id === restored.id ? restored : item)),
      );
      notifyTodosChanged();
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  async function permanentlyDeleteTask(id: number) {
    try {
      await deleteTodo(id);
      notifyTodosChanged();
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  return {
    taskTitle,
    setTaskTitle,
    taskDescription,
    setTaskDescription,
    taskPriority,
    setTaskPriority,
    taskTag,
    setTaskTag,
    taskDueAt,
    setTaskDueAt,
    searchQuery,
    setSearchQuery,
    visibleTodos,
    createTask,
    moveTask,
    toggleCompleted,
    removeTask,
  };
}
