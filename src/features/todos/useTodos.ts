import { FormEvent, useMemo, useState } from "react";
import { z } from "zod";
import { createTodo, deleteTodo, moveTodo } from "./api";
import { Todo, TodoPriority, TodoStatus } from "./types";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Nhập tên task trước khi thêm."),
  description: z.string(),
  priority: z.enum(["low", "normal", "high"]),
  dueAt: z.string().nullable(),
});

export function useTodos(
  initialTodos: Todo[],
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>,
  onError: (message: string) => void,
) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TodoPriority>("normal");
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
      dueAt: taskDueAt || null,
    });
    if (!parsed.success) {
      onError(parsed.error.issues[0]?.message ?? "Task chưa hợp lệ.");
      return;
    }

    try {
      const todo = await createTodo({
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        dueAt: parsed.data.dueAt,
        status: "todo",
      });
      setTodos((current) => [todo, ...current]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("normal");
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
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  async function toggleCompleted(todo: Todo) {
    await moveTask(todo.id, todo.status === "done" ? "todo" : "done");
  }

  async function removeTask(id: number) {
    try {
      await deleteTodo(id);
      setTodos((current) => current.filter((todo) => todo.id !== id));
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
