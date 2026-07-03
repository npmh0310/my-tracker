import { emit, listen } from "@tauri-apps/api/event";
import { callCommand } from "../../shared/lib/tauri";
import { Todo, TodoPriority, TodoStatus, TodoTag } from "./types";

const TODO_CHANGED_EVENT = "todos:changed";
const TODO_CHANGED_STORAGE_KEY = "personal-tracker:todos:changed";

type Unsubscribe = () => void;

export function listTodos() {
  return callCommand<Todo[]>("list_todos");
}

export function createTodo(input: {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  tag: TodoTag;
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

export function notifyTodosChanged() {
  window.dispatchEvent(new CustomEvent(TODO_CHANGED_EVENT));

  try {
    localStorage.setItem(
      TODO_CHANGED_STORAGE_KEY,
      `${Date.now()}:${Math.random()}`,
    );
  } catch {
    // localStorage can be unavailable in restricted contexts; Tauri events still cover the app.
  }

  void emit(TODO_CHANGED_EVENT).catch(() => {
    // Browser preview does not provide Tauri's event bridge.
  });
}

export function subscribeTodosChanged(callback: () => void): Unsubscribe {
  let tauriUnlisten: Unsubscribe | null = null;
  let disposed = false;
  let queued = false;

  const handleChange = () => {
    if (queued) return;
    queued = true;
    window.setTimeout(() => {
      queued = false;
      if (!disposed) {
        callback();
      }
    }, 0);
  };
  const handleLocalChange = () => handleChange();
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === TODO_CHANGED_STORAGE_KEY) {
      handleChange();
    }
  };

  window.addEventListener(TODO_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);

  void listen(TODO_CHANGED_EVENT, handleChange)
    .then((unlisten) => {
      if (disposed) {
        unlisten();
        return;
      }
      tauriUnlisten = unlisten;
    })
    .catch(() => {
      // Browser preview does not provide Tauri's event bridge.
    });

  return () => {
    disposed = true;
    window.removeEventListener(TODO_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
    tauriUnlisten?.();
  };
}
