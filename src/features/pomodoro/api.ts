import { callCommand } from "../../shared/lib/tauri";
import { PomodoroSession } from "./types";

export function listTodaySessions() {
  return callCommand<PomodoroSession[]>("list_today_sessions");
}

export function createPomodoroSession(input: {
  todoId: number | null;
  durationMinutes: number;
  breakMinutes: number;
}) {
  return callCommand<PomodoroSession>("create_pomodoro_session", input);
}

export function completePomodoroSession(id: number) {
  return callCommand<PomodoroSession>("complete_pomodoro_session", { id });
}

export function setPomodoroTrayCountdown(secondsLeft: number | null) {
  return callCommand<void>("set_pomodoro_tray_countdown", { secondsLeft });
}
