import { type ReactNode } from "react";

/**
 * A desktop window chrome (mac/windows vibe): traffic-light controls,
 * centered title, softly rounded corners and a layered drop shadow.
 */
export function TerminalWindow({
  title,
  children,
  className = "",
  shadow = true,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  shadow?: boolean;
}) {
  return (
    <div
      className={`group/win overflow-hidden rounded-xl border border-border bg-card ${
        shadow
          ? "shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_10px_30px_-12px_rgba(12,36,23,0.35),0_2px_6px_-2px_rgba(12,36,23,0.18)]"
          : ""
      } ${className}`}
    >
      <div className="relative flex items-center border-b border-border bg-surface-raised px-3.5 py-2.5">
        {/* traffic lights */}
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
          <span className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
          <span className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
        </span>
        {/* centered title */}
        {title && (
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 truncate px-12 font-mono text-[11px] text-muted-foreground">
            {title}
          </span>
        )}
        {/* windows-style affordance on the right */}
        <span className="ml-auto hidden font-mono text-[11px] tracking-widest text-muted-foreground/50 sm:inline">
          ─ ▢ ✕
        </span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-relaxed text-foreground sm:p-5">
        {children}
      </div>
    </div>
  );
}
