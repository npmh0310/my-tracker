import {
  CircleDot,
  History,
  Pause,
  Play,
  RefreshCw,
  TimerReset,
} from "lucide-react";
import { formatTime } from "../../shared/lib/time";
import { Button } from "../../shared/ui/button";
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
import { PomodoroSession } from "./types";
import { PomodoroPreset, pomodoroPresets, usePomodoro } from "./usePomodoro";

type PomodoroPanelProps = {
  sessions: PomodoroSession[];
  setSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>;
  onError: (message: string) => void;
};

export function PomodoroPanel({
  sessions,
  setSessions,
  onError,
}: PomodoroPanelProps) {
  const pomodoro = usePomodoro(sessions, setSessions, onError);
  const focusSeconds = pomodoroPresets[pomodoro.preset].focusMinutes * 60;
  const progress =
    focusSeconds > 0 ? (focusSeconds - pomodoro.secondsLeft) / focusSeconds : 0;
  const ringRadius = 104;
  const ringStroke = 10;
  const ringSize = 244;
  const ringCenter = ringSize / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference * (1 - Math.min(Math.max(progress, 0), 1));
  const statusText =
    pomodoro.timerState === "running"
      ? "Đang tập trung"
      : pomodoro.timerState === "paused"
        ? "Đang tạm dừng"
        : "Sẵn sàng";
  const statusDotClass =
    pomodoro.timerState === "running"
      ? "bg-emerald-500"
      : pomodoro.timerState === "paused"
        ? "bg-amber-500"
        : "bg-sky-500";
  const statusTextClass =
    pomodoro.timerState === "running"
      ? "text-emerald-700"
      : pomodoro.timerState === "paused"
        ? "text-amber-700"
        : "text-sky-700";

  return (
    <section className="panel relative flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div className="title-row ml-12">
          <CircleDot size={23} />
          <h2 className="text-2xl font-bold leading-none">Pomodoro</h2>
        </div>
        <Select
          disabled={pomodoro.timerState !== "idle"}
          value={pomodoro.preset}
          onValueChange={(value) =>
            pomodoro.changePreset(value as PomodoroPreset)
          }
        >
          <SelectTrigger className="h-9 min-w-[116px] rounded-3xl bg-zinc-100 px-3 text-xs font-bold text-muted-foreground hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(pomodoroPresets).map(([value, preset]) => (
              <SelectItem key={value} value={value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-8">
        <div className="relative grid h-[244px] w-[244px] place-items-center">
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
              stroke="#f1f2f4"
              strokeWidth={ringStroke}
            />
            <circle
              className="transition-[stroke-dashoffset] duration-500"
              cx={ringCenter}
              cy={ringCenter}
              fill="none"
              r={ringRadius}
              stroke="#18181b"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              strokeWidth={ringStroke}
            />
          </svg>

          <div className="relative z-10 grid place-items-center gap-2 text-center">
            <strong className="text-[48px] font-extrabold leading-none text-zinc-950">
              {formatTime(pomodoro.secondsLeft)}
            </strong>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 rounded-3xl bg-zinc-100 p-1">
          {pomodoro.timerState === "running" ? (
            <Button
              className="h-11 w-11 rounded-3xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-800"
              onClick={pomodoro.pausePomodoro}
              title="Tạm dừng"
              variant="icon"
            >
              <Pause size={18} />
            </Button>
          ) : (
            <Button
              className="h-11 w-11 rounded-3xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-800"
              onClick={() => void pomodoro.startPomodoro()}
              title="Bắt đầu"
              variant="icon"
            >
              <Play size={18} />
            </Button>
          )}
          <Button
            className="h-11 w-11 border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-white hover:text-zinc-950"
            onClick={() => void pomodoro.finishPomodoro()}
            title="Kết thúc phiên"
            variant="icon"
          >
            <TimerReset size={20} />
          </Button>
          <Button
            className="h-11 w-11 border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-white hover:text-zinc-950"
            onClick={pomodoro.resetPomodoro}
            title="Reset timer"
            variant="icon"
          >
            <RefreshCw size={20} />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`inline-flex items-center gap-2 text-xs font-bold uppercase ${statusTextClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
            {statusText}
          </span>
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className="absolute bottom-6 right-6 inline-flex h-9 items-center gap-2 rounded-3xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            type="button"
          >
            <History size={15} />
            {pomodoro.completedSessionsToday}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[420px] rounded-3xl bg-zinc-50 p-3"
          side="top"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Phiên hôm nay
            </span>
            <span className="text-xs font-bold text-zinc-500">
              {pomodoro.completedSessionsToday} xong
            </span>
          </div>

          {pomodoro.todaySessions.length === 0 ? (
            <div className="rounded-2xl bg-white px-3 py-5 text-center text-sm font-semibold text-muted-foreground">
              Chưa có phiên nào hôm nay
            </div>
          ) : (
            <div className="grid max-h-[260px] gap-1.5 overflow-y-auto pr-1">
              {pomodoro.todaySessions.map((session) => (
                <div
                  className="grid h-11 grid-cols-[54px_72px_1fr_auto] items-center gap-3 rounded-2xl bg-white px-3 text-sm"
                  key={session.id}
                >
                  <span className="font-semibold text-zinc-900">
                    {formatSessionTime(session.started_at)}
                  </span>
                  <span className="text-xs font-bold text-zinc-700">
                    {formatSessionDuration(session)}
                  </span>
                  <span className="truncate text-xs font-bold text-muted-foreground">
                    {session.duration_minutes}/{session.break_minutes} phút
                  </span>
                  <span className={sessionStatusClass(session.status)}>
                    {session.status === "completed" ? "Xong" : "Đang chạy"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </section>
  );
}

function formatSessionTime(value: string) {
  return value.slice(11, 16);
}

function formatSessionDuration(session: PomodoroSession) {
  const startedAt = new Date(session.started_at.replace(" ", "T")).getTime();
  const endedAt = session.ended_at
    ? new Date(session.ended_at.replace(" ", "T")).getTime()
    : Date.now();
  const durationMinutes = Math.max(
    0,
    Math.round((endedAt - startedAt) / 60_000),
  );

  if (durationMinutes < 60) {
    return `${durationMinutes}p`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}p` : `${hours}h`;
}

function sessionStatusClass(status: PomodoroSession["status"]) {
  if (status === "completed") {
    return "rounded-3xl bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600";
  }

  return "rounded-3xl bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600";
}
