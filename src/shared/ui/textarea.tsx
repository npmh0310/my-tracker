import * as React from "react";
import { cn } from "../lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[158px] w-full resize-y rounded-2xl border border-transparent bg-muted p-3.5 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-border focus:bg-white focus:ring-2 focus:ring-ring/20",
        className,
      )}
      {...props}
    />
  );
}
