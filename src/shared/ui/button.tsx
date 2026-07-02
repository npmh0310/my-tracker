import * as React from "react";
import { cn } from "../lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 rounded-3xl px-5 font-bold",
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 min-h-10 rounded-3xl px-4 font-semibold",
  ghost:
    "bg-transparent text-muted-foreground hover:bg-muted min-h-10 rounded-3xl px-4 font-semibold",
  destructive:
    "bg-rose-50 text-destructive hover:bg-rose-100 min-h-10 rounded-3xl px-4 font-semibold",
  icon:
    "grid h-10 w-10 place-items-center rounded-3xl bg-muted text-muted-foreground hover:bg-zinc-200",
};

export function Button({
  className,
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 border-0 outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
