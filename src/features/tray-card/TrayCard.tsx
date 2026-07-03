import { useState } from "react";
import { NotesTrayTab } from "./tabs/NotesTrayTab";
import { PomodoroTrayTab } from "./tabs/PomodoroTrayTab";
import { TodoTrayTab } from "./tabs/TodoTrayTab";
import { TrayCardTabs } from "./TrayCardTabs";
import type { TrayCardTab } from "./types";

export function TrayCard() {
  const [activeTab, setActiveTab] = useState<TrayCardTab>("todo");

  return (
    <main className="h-screen overflow-hidden rounded-[28px] border border-white/[0.18] bg-[rgba(31,34,38,0.78)] text-zinc-100 shadow-[0_18px_48px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-18px_48px_rgba(0,0,0,0.14)]">
      <section className="flex h-full flex-col p-3">
        <TrayCardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-2 h-px bg-white/[0.16]" />

        <div className="min-h-0 flex-1">
          {activeTab === "todo" ? <TodoTrayTab /> : null}
          {activeTab === "pomodoro" ? <PomodoroTrayTab /> : null}
          {activeTab === "notes" ? <NotesTrayTab /> : null}
        </div>
      </section>
    </main>
  );
}
