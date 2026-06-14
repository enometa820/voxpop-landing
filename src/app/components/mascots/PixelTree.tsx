import { type TreeLevel, TREE_LABELS } from "../../lib/tree";

/**
 * 매장 나무 마스코트 — higgsfield 생성 정교 픽셀아트 에셋(public/mascot/tree-N.png).
 * 6단계: 씨앗→새싹→줄기→앙상한→푸른→열매. 절차생성 폐기, higgsfield 생성 PNG 채택(2026-06-13).
 * Owner-only health="wilting" → 흐리게/탈색(시듦, never dead).
 */

export type TreeHealth = "healthy" | "wilting";

export function PixelTree({
  level = 1,
  health = "healthy",
  cell = 4,
  className = "",
  showLabel = false,
}: {
  level?: TreeLevel;
  health?: TreeHealth;
  cell?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const wilting = health === "wilting";

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <img
        src={`/mascot/tree-${level}.png`}
        alt={`매장 나무 LV.${level} ${TREE_LABELS[level]}${wilting ? " (시듦)" : ""}`}
        style={{
          display: "block",
          imageRendering: "pixelated",
          width: "100%",
          height: "auto",
          opacity: wilting ? 0.62 : 1,
          filter: wilting ? "grayscale(0.45) brightness(0.92)" : undefined,
          transition: "opacity 0.35s, filter 0.35s",
        }}
      />
      {showLabel && (
        <span className="font-mono text-[11px] text-muted-foreground">
          LV.{level} · {TREE_LABELS[level]}
        </span>
      )}
    </div>
  );
}
