import { type SelectHTMLAttributes } from "react";
import { cn } from "../ui/utils";

/** 베벨 inset 셀렉트 — 우측 outset ▼ 버튼 장식. */
export function RetroSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("retro-field relative inline-flex w-full", className)}>
      <select
        className="w-full appearance-none bg-transparent px-3 py-2 pr-9 font-mono text-[13px] text-foreground outline-none"
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="retro-btn pointer-events-none absolute right-[4px] top-1/2 flex size-[22px] -translate-y-1/2 items-center justify-center font-mono text-[9px]"
      >
        ▼
      </span>
    </span>
  );
}
