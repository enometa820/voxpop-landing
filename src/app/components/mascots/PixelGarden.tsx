import { PixelTree, type TreeHealth } from "./PixelTree";
import { PixelCat } from "./PixelCat";
import { type TreeLevel } from "../../lib/tree";

/**
 * 고양이가 나무를 가꾸는 합성 씬. 손님 폼·사장 대시보드 공용.
 * 무기명 절대선: health(시듦)·mood는 사장 컨텍스트에서만 전달한다.
 * 손님 화면은 성장(level)만 보여주고 health·mood를 넘기지 않는다.
 */
export function PixelGarden({
  level,
  health = "healthy",
  mood,
  cell = 6,
  showLabel = false,
  className = "",
}: {
  level: TreeLevel;
  health?: TreeHealth;
  mood?: "happy" | "calm" | "worried" | "hungry";
  cell?: number;
  showLabel?: boolean;
  className?: string;
}) {
  // 나무가 자랄수록(또는 기분 좋을수록) 고양이도 happy
  const catExpr = mood === "happy" || level >= 4 ? "happy" : "default";
  const catCell = Math.max(3, Math.round(cell * 0.6));

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <PixelTree level={level} health={health} cell={cell} showLabel={showLabel} />
      <div className="pointer-events-none absolute bottom-0 right-0 flex items-end gap-0.5">
        <span className="mb-1 font-mono text-[10px] text-lime select-none" aria-hidden>
          ✦
        </span>
        <PixelCat expression={catExpr} cell={catCell} />
      </div>
    </div>
  );
}
