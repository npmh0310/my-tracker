import { CheckSquare, Clock3, NotebookPen } from "lucide-react";
import type { ComponentType } from "react";
import type { TrayCardTab } from "./types";

const tabs: Array<{
  id: TrayCardTab;
  label: string;
  icon: ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
}> = [
  { id: "todo", label: "Todo", icon: CheckSquare },
  { id: "pomodoro", label: "Pomodoro", icon: Clock3 },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

type TrayCardTabsProps = {
  activeTab: TrayCardTab;
  onTabChange: (tab: TrayCardTab) => void;
};

export function TrayCardTabs({ activeTab, onTabChange }: TrayCardTabsProps) {
  return (
    <div className="mx-auto grid w-fit grid-cols-3 gap-1 rounded-full bg-white/[0.08] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.16)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            aria-label={tab.label}
            className={`grid h-10 w-10 place-items-center rounded-full border-none transition-all duration-200 ${
              isActive
                ? "bg-zinc-500/75 text-white shadow-[0_2px_8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.14)]"
                : "bg-transparent text-white/45 hover:bg-white/[0.08] hover:text-white/80"
            }`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <Icon size={20} strokeWidth={2.15} />
          </button>
        );
      })}
    </div>
  );
}
