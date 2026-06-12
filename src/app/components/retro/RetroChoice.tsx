import { type ReactNode } from "react";
import { cn } from "../ui/utils";

/** 베벨 inset 체크박스 — ✓ 표시. */
export function RetroCheckbox({
  label,
  checked,
  onChange,
  className,
}: {
  label: ReactNode;
  checked: boolean;
  onChange?: (next: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2",
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="retro-check-box flex size-[18px] items-center justify-center font-mono text-[13px] font-bold text-primary peer-focus-visible:[outline:1px_dotted_var(--foreground)] peer-focus-visible:[outline-offset:2px]">
        {checked ? "✓" : ""}
      </span>
      <span className="text-[13px] text-foreground">{label}</span>
    </label>
  );
}

/** 베벨 inset 라디오 — 픽셀 사각 점. */
export function RetroRadio({
  label,
  checked,
  onSelect,
  name,
  className,
}: {
  label: ReactNode;
  checked: boolean;
  onSelect?: () => void;
  name?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        className="peer sr-only"
        checked={checked}
        onChange={() => onSelect?.()}
      />
      <span className="retro-radio-box flex size-[18px] items-center justify-center peer-focus-visible:[outline:1px_dotted_var(--foreground)] peer-focus-visible:[outline-offset:2px]">
        {checked && <span className="size-2 bg-primary" />}
      </span>
      <span className="text-[13px] text-foreground">{label}</span>
    </label>
  );
}
