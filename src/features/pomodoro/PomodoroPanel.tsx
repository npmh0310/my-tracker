import { CircleDot, Pause, Play, RefreshCw, TimerReset } from "lucide-react";
import { formatTime } from "../../shared/lib/time";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Todo } from "../todos/types";
import { PomodoroSession } from "./types";
import { usePomodoro } from "./usePomodoro";

type PomodoroPanelProps = {
  sessions: PomodoroSession[];
  setSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>;
  doingTask: Todo | null;
  onError: (message: string) => void;
};

export function PomodoroPanel({
  sessions,
  setSessions,
  doingTask,
  onError,
}: PomodoroPanelProps) {
  const pomodoro = usePomodoro(
    sessions,
    setSessions,
    doingTask?.id ?? null,
    onError,
  );

  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="title-row">
          <CircleDot size={23} />
          <h2 className="text-2xl font-bold leading-none">Pomodoro</h2>
        </div>
        <Badge>Chuyên sâu</Badge>
      </div>

      <div className="mx-auto my-7 grid h-[230px] w-[230px] place-items-center content-center gap-2 rounded-full border-[14px] border-zinc-100">
        <span className="text-xs font-extrabold uppercase tracking-[3px] text-muted-foreground">
          Tập trung
        </span>
        <strong className="text-[52px] leading-none">
          {formatTime(pomodoro.secondsLeft)}
        </strong>
        <small className="text-sm font-semibold text-muted-foreground">
          {pomodoro.completedSessionsToday} phiên hôm nay
        </small>
      </div>

      <div className="mb-6 flex justify-center gap-3">
        {pomodoro.timerState === "running" ? (
          <Button onClick={pomodoro.pausePomodoro}>
            <Pause size={18} />
            Tạm dừng
          </Button>
        ) : (
          <Button onClick={() => void pomodoro.startPomodoro()}>
            <Play size={18} />
            Bắt đầu
          </Button>
        )}
        <Button onClick={() => void pomodoro.finishPomodoro()} variant="icon">
          <TimerReset size={20} />
        </Button>
        <Button onClick={pomodoro.resetPomodoro} variant="icon">
          <RefreshCw size={20} />
        </Button>
      </div>

      <div className="grid gap-2 text-center">
        <span className="font-semibold text-muted-foreground">Đang làm:</span>
        <strong className="leading-6">
          {doingTask?.title ?? "Chưa có task nào ở cột Doing"}
        </strong>
      </div>
    </section>
  );
}
