import { type TreeHealth } from "./PixelTree";
import { type TreeLevel, TREE_LABELS } from "../../lib/tree";
import { TREE_FOOT_INSET, CAT_FOOT_INSET } from "../../lib/mascotAnchors";
import { footOffsetPx } from "../../lib/stageLayout";

/**
 * 땅 앵커 무대 — 나무 흙 밑선 = 고양이 발 밑선을 공통 ground 선에 맞춰 함께 세운다.
 * 배치 기본 = B(존재감): 고양이를 크게 나무 곁에 바짝. 매직 넘버 없이 측정된 앵커로 정렬.
 * 무기명 절대선: 손님 화면은 level만 전달(health·mood 미전달 → 시듦 비표시).
 */
const CAT_DEFAULT_EXPR = "default"; // 앉음 정면
const STAGE_H = 188;            // 무대 높이(px)
const GROUND_H = 18;            // 땅 띠 높이(px)
const TREE_H = 168;             // 나무 렌더 높이(px)
const CAT_H = 92;               // 고양이 렌더 높이(px) — 배치 B(크게)

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
  void cell; // 폭은 무대 기준(에셋이라 px 그리드 무관)
  const catExpr = mood === "happy" || level >= 4 ? "happy" : CAT_DEFAULT_EXPR;

  const treeBottom = GROUND_H - footOffsetPx(TREE_FOOT_INSET[level] ?? 0, TREE_H);
  const catBottom = GROUND_H - footOffsetPx(CAT_FOOT_INSET[catExpr] ?? 0, CAT_H);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full" style={{ height: STAGE_H }}>
        {/* 땅 */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: GROUND_H,
            background: "repeating-linear-gradient(90deg,#b9c9a6 0 8px,#aebd9b 8px 16px)",
            borderTop: "3px solid #9fb389",
          }}
        />
        {/* 나무 — 흙 밑선이 땅에. 무대에선 height 기준 렌더(직접 img — PixelTree는 width:100% 계약이라 무대 부적합) */}
        <img
          src={`/mascot/tree-${level}.png`}
          alt={`매장 나무 LV.${level} ${TREE_LABELS[level]}${health === "wilting" ? " (시듦)" : ""}`}
          className="absolute left-1/2"
          style={{
            bottom: treeBottom,
            transform: "translateX(-58%)",
            height: TREE_H,
            width: "auto",
            zIndex: 1,
            imageRendering: "pixelated",
            opacity: health === "wilting" ? 0.82 : 1,
            filter: health === "wilting" ? "grayscale(0.25) brightness(0.97)" : undefined,
            transition: "opacity 0.35s, filter 0.35s",
          }}
        />
        {/* 고양이 — 발 밑선이 같은 땅에 (배치 B: 나무 곁에 바짝) + 숨쉬기 애니메이션 */}
        <img
          src={`/mascot/cats/cat-${catExpr}.png`}
          alt="손님 고양이"
          className="absolute mascot-breathe"
          style={{
            bottom: catBottom,
            left: "51%",
            width: CAT_H,
            height: CAT_H,
            zIndex: 2,
            imageRendering: "pixelated",
          }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-caption text-muted-foreground">
          LV.{level} · {TREE_LABELS[level]}
        </span>
      )}
    </div>
  );
}
