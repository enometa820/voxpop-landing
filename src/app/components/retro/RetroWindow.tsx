import { type ReactNode } from "react";
import { cn } from "../ui/utils";

/**
 * 레트로 OS 창 — 베벨 outset 프레임 + 녹색 타이틀바(`voxpop.exe` + _□×).
 * TerminalWindow(맥 트래픽라이트)를 대체하는 Win95 창 크롬.
 */
export function RetroWindow({
  title = "voxpop.exe",
  children,
  className = "",
  bodyClassName = "",
  status,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** 창 하단 상태바 셀들 (선택) */
  status?: ReactNode[];
}) {
  return (
    <section className={cn("bevel-out bg-card p-[3px]", className)}>
      <header className="retro-titlebar flex h-7 items-center gap-2 pl-2 pr-1">
        <span className="truncate font-mono text-[12px] font-bold tracking-tight">
          {title}
        </span>
        <span aria-hidden className="ml-auto flex items-center gap-[3px]">
          <span className="retro-titlebtn flex size-[18px] items-center justify-center pb-[5px] font-mono text-[11px] font-bold">
            _
          </span>
          <span className="retro-titlebtn flex size-[18px] items-center justify-center font-mono text-[10px] font-bold">
            □
          </span>
          <span className="retro-titlebtn flex size-[18px] items-center justify-center font-mono text-[11px] font-bold">
            ×
          </span>
        </span>
      </header>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
      {status && status.length > 0 && (
        <footer className="flex gap-[3px] pt-[3px]">
          {status.map((cell, i) => (
            <span
              key={i}
              className="retro-status-cell flex-1 truncate px-2 py-1 font-mono text-[11px] first:flex-[2]"
            >
              {cell}
            </span>
          ))}
        </footer>
      )}
    </section>
  );
}
