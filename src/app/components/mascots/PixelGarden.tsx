import { PixelTree, type TreeHealth } from "./PixelTree";
import { PixelCat } from "./PixelCat";
import { type TreeLevel } from "../../lib/tree";

/**
 * 고양이가 나무를 가꾸는 합성 씬 — Figma 정교 픽셀 에셋(나무 + 고양이 시트).
 * 부모 폭을 나무 2.3 : 고양이 1로 나눠 나란히 배치(겹침 0).
 * 무기명 절대선: health(시듦)·mood는 사장 컨텍스트에서만 전달.
 * 손님 화면은 성장(level)만 보여주고 health·mood를 넘기지 않는다.
 */
export function PixelGarden({
  level,
  health = "healthy",
  mood,
  cell,
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
  void cell; // 폭은 부모 + flex 비율로 결정 (Figma 에셋이라 px 그리드 무관)
  // 나무가 자랄수록(또는 기분 좋을수록) 고양이도 happy
  const catExpr = mood === "happy" || level >= 4 ? "happy" : "default";

  return (
    <div className={`flex items-end justify-center gap-1 ${className}`}>
      <PixelTree level={level} health={health} showLabel={showLabel} className="flex-[2.3] min-w-0" />
      <PixelCat expression={catExpr} className="flex-[1] min-w-0 mb-0.5" />
    </div>
  );
}
