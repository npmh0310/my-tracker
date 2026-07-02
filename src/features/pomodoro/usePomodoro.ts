import { useEffect, useMemo, useState } from "react";
import {
  completePomodoroSession,
  createPomodoroSession,
} from "./api";
import { PomodoroSession, TimerState } from "./types";

const focusMinutes = 50;
const breakMinutes = 10;

export function usePomodoro(
  sessions: PomodoroSession[],
  setSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>,
  doingTaskId: number | null,
  onError: (message: string) => void,
) {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const completedSessionsToday = useMemo(
    () => sessions.filter((session) => session.status === "completed").length,
    [sessions],
  );

  useEffect(() => {
    if (timerState !== "running") return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          void finishPomodoro();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerState, activeSessionId]);

  async function startPomodoro() {
    if (timerState === "paused") {
      setTimerState("running");
      return;
    }

    try {
      const session = await createPomodoroSession({
        todoId: doingTaskId,
        durationMinutes: focusMinutes,
        breakMinutes,
      });
      setSessions((current) => [session, ...current]);
      setActiveSessionId(session.id);
      setSecondsLeft(focusMinutes * 60);
      setTimerState("running");
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  function pausePomodoro() {
    setTimerState("paused");
  }

  function resetPomodoro() {
    setTimerState("idle");
    setSecondsLeft(focusMinutes * 60);
    setActiveSessionId(null);
  }

  async function finishPomodoro() {
    if (!activeSessionId) {
      resetPomodoro();
      return;
    }

    try {
      const completed = await completePomodoroSession(activeSessionId);
      setSessions((current) =>
        current.map((session) =>
          session.id === completed.id ? completed : session,
        ),
      );
      setTimerState("idle");
      setActiveSessionId(null);
      setSecondsLeft(focusMinutes * 60);
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  return {
    timerState,
    secondsLeft,
    completedSessionsToday,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    finishPomodoro,
  };
}
