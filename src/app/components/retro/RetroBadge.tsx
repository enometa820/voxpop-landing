import { type ReactNode } from "react";
import { cn } from "../ui/utils";

type Tone = "default" | "primary" | "danger";

/** 얇은 베벨 배지 — 상태·카운트 라벨. */
export function RetroBadge({
  tone = "default",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "bevel-out-thin inline-flex flex-none items-center gap-1 whitespace-nowrap px-2 py-0.5 font-mono text-caption",
        tone === "default" && "bg-secondary text-muted-foreground",
        tone === "primary" && "bg-primary text-primary-foreground",
        tone === "danger" && "bg-destructive text-destructive-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
