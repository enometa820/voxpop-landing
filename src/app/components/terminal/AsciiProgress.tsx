/**
 * ASCII-style progress bar: [████░░░░]
 */
export function AsciiProgress({
  value,
  max = 10,
  segments = 10,
  label,
  className = "",
  tone = "primary",
}: {
  value: number;
  max?: number;
  segments?: number;
  label?: string;
  className?: string;
  tone?: "primary" | "accent" | "destructive" | "muted";
}) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(ratio * segments);
  const empty = segments - filled;

  const toneClass = {
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  }[tone];

  return (
    <div className={`flex items-center gap-2 font-mono text-[12px] ${className}`}>
      <span className="text-muted-foreground/60">[</span>
      <span className="tracking-[-0.05em]">
        <span className={toneClass}>{"█".repeat(filled)}</span>
        <span className="text-border">{"░".repeat(empty)}</span>
      </span>
      <span className="text-muted-foreground/60">]</span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
}
