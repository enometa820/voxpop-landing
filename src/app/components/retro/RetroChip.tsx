import { type ButtonHTMLAttributes } from "react";
import { cn } from "../ui/utils";

/** 토글 칩 — 켜지면 inset(눌림) + 진녹색. 후속칩·필터에 사용. */
export function RetroChip({
  on = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      type="button"
      data-on={on ? "true" : undefined}
      aria-pressed={on}
      className={cn("retro-chip px-3 py-1.5 font-mono text-[12px]", className)}
      {...props}
    >
      {children}
    </button>
  );
}
