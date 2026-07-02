import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "../lib/utils";

export function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("relative w-[210px] text-sm", className)}
      classNames={{
        root: "relative",
        month: "space-y-1.5",
        month_caption:
          "flex h-7 items-center justify-center text-sm font-bold text-zinc-900",
        caption_label: "text-sm font-bold",
        nav: "absolute left-0 right-0 top-0 flex h-7 items-center justify-between",
        button_previous:
          "grid h-6 w-6 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100",
        button_next:
          "grid h-6 w-6 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100",
        chevron: "h-4 w-4",
        weekdays: "grid grid-cols-7",
        weekday:
          "grid h-6 place-items-center text-[11px] font-bold text-muted-foreground",
        week: "grid grid-cols-7",
        day: "grid h-7 w-7 place-items-center p-0 text-sm",
        day_button:
          "grid h-6 w-6 place-items-center rounded-md text-sm font-medium hover:bg-zinc-100",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:font-bold [&>button]:text-red-500",
        outside: "[&>button]:text-zinc-300",
        disabled: "[&>button]:opacity-40",
      }}
      {...props}
    />
  );
}
