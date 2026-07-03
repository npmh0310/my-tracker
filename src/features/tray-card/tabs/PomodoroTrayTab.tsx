import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  TimerReset,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatTime } from "../../../shared/lib/time";
import {
  listTodaySessions,
  setPomodoroTrayCountdown,
} from "../../pomodoro/api";
import type { PomodoroSession } from "../../pomodoro/types";
import {
  PomodoroPreset,
  pomodoroPresets,
  usePomodoro,
} from "../../pomodoro/usePomodoro";

export function PomodoroTrayTab() {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const pomodoro = usePomodoro(sessions, setSessions, setErrorMessage);
  const focusSeconds = pomodoroPresets[pomodoro.preset].focusMinutes * 60;
  const progress =
    focusSeconds > 0 ? (focusSeconds - pomodoro.secondsLeft) / focusSeconds : 0;
  const ringSize = 184;
  const ringStroke = 9;
  const ringRadius = 78;
  const ringCenter = ringSize / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - Math.min(Math.max(progress, 0), 1));
  const statusLabel =
    pomodoro.timerState === "running"
      ? "Focus"
      : pomodoro.timerState === "paused"
        ? "Paused"
        : "Ready";

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    syncTrayCountdown(
      pomodoro.timerState === "running" && pomodoro.secondsLeft > 0
        ? pomodoro.secondsLeft
        : null,
    );
  }, [pomodoro.secondsLeft, pomodoro.timerState]);

  useEffect(() => {
    return () => {
      syncTrayCountdown(null);
    };
  }, []);

  async function loadSessions() {
    try {
      setSessions(await listTodaySessions());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(String(error));
    }
  }

  function syncTrayCountdown(secondsLeft: number | null) {
    void setPomodoroTrayCountdown(secondsLeft).catch(() => {
      // Browser preview does not provide Tauri's tray bridge.
    });
  }

  function resetPomodoro() {
    pomodoro.resetPomodoro();
    syncTrayCountdown(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-2 pt-4">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex rounded-full bg-black/[0.13] p-1">
          {Object.entries(pomodoroPresets).map(([value, preset]) => {
            const isActive = pomodoro.preset === value;

            return (
              <button
                className={`h-8 rounded-full px-3 text-[11px] font-bold transition ${
                  isActive
                    ? "bg-white/[0.16] text-white"
                    : "text-white/38 hover:bg-white/[0.08] hover:text-white/70"
                }`}
                disabled={pomodoro.timerState !== "idle"}
                key={value}
                onClick={() => pomodoro.changePreset(value as PomodoroPreset)}
                type="button"
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/[0.13] px-3 text-[11px] font-bold text-white/55">
          <CheckCircle2 size={14} />
          {pomodoro.completedSessionsToday}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-3 shrink-0 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4">
        <div className="relative grid h-[184px] w-[184px] place-items-center">
          <svg
            aria-hidden="true"
            className="absolute inset-0 rotate-[-90deg]"
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            width={ringSize}
          >
            <circle
              cx={ringCenter}
              cy={ringCenter}
              fill="none"
              r={ringRadius}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={ringStroke}
            />
            <circle
              className="transition-[stroke-dashoffset] duration-500"
              cx={ringCenter}
              cy={ringCenter}
              fill="none"
              r={ringRadius}
              stroke="rgba(255,255,255,0.82)"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              strokeWidth={ringStroke}
            />
          </svg>

          <div className="relative z-10 grid place-items-center gap-2 text-center">
            <strong className="text-[40px] font-extrabold leading-none text-white">
              {formatTime(pomodoro.secondsLeft)}
            </strong>
            {pomodoro.timerState !== "idle" ? (
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/36">
                {statusLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-black/[0.14] p-1.5">
          {pomodoro.timerState === "running" ? (
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.86] text-zinc-950 transition hover:bg-white"
              onClick={pomodoro.pausePomodoro}
              title="Pause"
              type="button"
            >
              <Pause size={18} strokeWidth={2.6} />
            </button>
          ) : (
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.86] text-zinc-950 transition hover:bg-white"
              onClick={() => void pomodoro.startPomodoro()}
              title="Start"
              type="button"
            >
              <Play size={18} strokeWidth={2.6} />
            </button>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-full text-white/45 transition hover:bg-white/[0.1] hover:text-white"
            onClick={() => void pomodoro.finishPomodoro()}
            title="Finish"
            type="button"
          >
            <TimerReset size={18} strokeWidth={2.4} />
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full text-white/45 transition hover:bg-white/[0.1] hover:text-white"
            onClick={resetPomodoro}
            title="Reset"
            type="button"
          >
            <RotateCcw size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
