export type PomodoroSession = {
  id: number;
  todo_id: number | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  break_minutes: number;
  status: "running" | "completed" | "cancelled";
};

export type TimerState = "idle" | "running" | "paused";
