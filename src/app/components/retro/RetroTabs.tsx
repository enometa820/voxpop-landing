import { type ReactNode } from "react";
import { cn } from "../ui/utils";

/** 폴더 탭 — 선택 탭이 본문과 한 면으로 붙는다. */
export function RetroTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: ReactNode }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-end gap-[2px] border-b-2 border-[color:var(--bevel-light)]",
        className,
      )}
    >
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            data-on={on ? "true" : undefined}
            onClick={() => onChange(t.id)}
            className="retro-tab px-3 py-2 font-mono text-[12px]"
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
