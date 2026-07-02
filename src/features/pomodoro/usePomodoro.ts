import { useEffect, useMemo, useState } from "react";
import {
  completePomodoroSession,
  createPomodoroSession,
} from "./api";
import { PomodoroSession, TimerState } from "./types";

const pomodoroPresets = {
  "25/5": { focusMinutes: 25, breakMinutes: 5, label: "25 / 5" },
  "50/10": { focusMinutes: 50, breakMinutes: 10, label: "50 / 10" },
  "90/15": { focusMinutes: 90, breakMinutes: 15, label: "90 / 15" },
} as const;

export type PomodoroPreset = keyof typeof pomodoroPresets;

export { pomodoroPresets };

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSessionDateKey(session: PomodoroSession) {
  return session.started_at.slice(0, 10);
}

export function usePomodoro(
  sessions: PomodoroSession[],
  setSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>,
  onError: (message: string) => void,
) {
  const [preset, setPreset] = useState<PomodoroPreset>("50/10");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [todayKey, setTodayKey] = useState(getLocalDateKey);
  const [secondsLeft, setSecondsLeft] = useState(
    pomodoroPresets[preset].focusMinutes * 60,
  );
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const currentPreset = pomodoroPresets[preset];

  const todaySessions = useMemo(
    () =>
      sessions.filter((session) => getSessionDateKey(session) === todayKey),
    [sessions, todayKey],
  );
  const completedSessionsToday = useMemo(
    () =>
      todaySessions.filter((session) => session.status === "completed").length,
    [todaySessions],
  );

  function changePreset(nextPreset: PomodoroPreset) {
    setPreset(nextPreset);
    if (timerState === "idle") {
      setSecondsLeft(pomodoroPresets[nextPreset].focusMinutes * 60);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTodayKey(getLocalDateKey());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

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
        todoId: null,
        durationMinutes: currentPreset.focusMinutes,
        breakMinutes: currentPreset.breakMinutes,
      });
      setSessions((current) => [session, ...current]);
      setActiveSessionId(session.id);
      setSecondsLeft(currentPreset.focusMinutes * 60);
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
    setSecondsLeft(currentPreset.focusMinutes * 60);
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
      setSecondsLeft(currentPreset.focusMinutes * 60);
      onError("");
    } catch (error) {
      onError(String(error));
    }
  }

  return {
    preset,
    timerState,
    secondsLeft,
    todaySessions,
    completedSessionsToday,
    changePreset,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    finishPomodoro,
  };
}
