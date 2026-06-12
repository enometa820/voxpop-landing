import { PixelTree, type TreeHealth } from "./PixelTree";
import { PixelCat } from "./PixelCat";
import { type TreeLevel } from "../../lib/tree";

/**
 * 고양이가 나무에 물을 주며 가꾸는 합성 씬 (고해상도). 손님 폼·사장 대시보드 공용.
 * 무기명 절대선: health(시듦)·mood는 사장 컨텍스트에서만 전달한다.
 * 손님 화면은 성장(level)만 보여주고 health·mood를 넘기지 않는다.
 */

// 픽셀 물뿌리개 — 주둥이는 왼쪽(나무 방향), 물방울이 나무로 떨어진다.
function WateringCan({ cell = 3 }: { cell?: number }) {
  const C = "#7fb0ff"; // 몸체 (밝은 sky)
  const c = "#4d7bff"; // 몸체 그림자
  const D = "#163021"; // 아웃라인 (손잡이)
  const w = "#bcd6ff"; // 물방울
  const W = 11;
  const H = 10;
  const px: [number, number, string][] = [
    // 손잡이 (위 아치)
    [6, 0, D], [7, 0, D], [8, 1, D], [8, 2, D],
    // 몸체
    [5, 2, C], [6, 2, C], [7, 2, C],
    [4, 3, C], [5, 3, C], [6, 3, C], [7, 3, C], [8, 3, c],
    [4, 4, C], [5, 4, C], [6, 4, C], [7, 4, C], [8, 4, c],
    [5, 5, C], [6, 5, c], [7, 5, c],
    [6, 6, c], [7, 6, c],
    // 주둥이 (왼쪽 아래로)
    [3, 2, C], [2, 3, C], [1, 3, C], [0, 4, C],
    // 물방울 (주둥이 → 나무, 왼 아래로)
    [0, 6, w], [0, 7, w], [1, 8, w], [1, 9, w], [2, 7, w],
  ];
  return (
    <svg
      viewBox={`0 0 ${W * cell} ${H * cell}`}
      width={W * cell}
      height={H * cell}
      style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
      role="img"
      aria-label="물뿌리개"
    >
      {px.map(([x, y, f], i) => (
        <rect key={i} x={x * cell} y={y * cell} width={cell} height={cell} fill={f} />
      ))}
    </svg>
  );
}

export function PixelGarden({
  level,
  health = "healthy",
  mood,
  cell = 5,
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
  const catCell = Math.max(2, Math.round(cell * 0.55));
  const canCell = Math.max(2, Math.round(cell * 0.5));

  return (
    <div className={`inline-flex items-end justify-center gap-1 ${className}`}>
      <PixelTree level={level} health={health} cell={cell} showLabel={showLabel} />
      <div className="relative flex flex-col items-center pb-2 select-none" aria-hidden>
        {/* 물뿌리개 — 고양이가 나무 쪽으로 기울여 물 주는 모습 */}
        <div className="absolute left-0 top-1/4 -translate-x-3/4 rotate-[-14deg]">
          <WateringCan cell={canCell} />
        </div>
        <PixelCat expression={catExpr} cell={catCell} />
      </div>
    </div>
  );
}
