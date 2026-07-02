import * as React from "react";
import { cn } from "../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "h-11 w-full min-w-0 rounded-full border border-transparent bg-muted px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-border focus:bg-white focus:ring-2 focus:ring-ring/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
