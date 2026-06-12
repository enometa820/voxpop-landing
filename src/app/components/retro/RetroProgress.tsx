import { cn } from "../ui/utils";

/** Win95 파일 복사 스타일 세그먼트 블록 프로그레스. */
export function RetroProgress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("retro-progress h-[18px] p-[3px]", className)}
    >
      <div className="retro-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
