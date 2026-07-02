import { callCommand } from "../../shared/lib/tauri";
import { Todo, TodoPriority, TodoStatus } from "./types";

export function listTodos() {
  return callCommand<Todo[]>("list_todos");
}

export function createTodo(input: {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueAt: string | null;
}) {
  return callCommand<Todo>("create_todo", input);
}

export function moveTodo(id: number, status: TodoStatus) {
  return callCommand<Todo>("move_todo", { id, status });
}

export function deleteTodo(id: number) {
  return callCommand<void>("delete_todo", { id });
}
