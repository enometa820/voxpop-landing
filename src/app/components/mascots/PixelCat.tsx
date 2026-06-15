import type { CSSProperties } from "react";

/**
 * 손님 고양이 마스코트 — 검정 void 픽셀 고양이 15포즈(개별 투명 PNG, public/mascot/cats/cat-{expression}.png).
 * 무기명 손님의 화신(이름 대신 익명의 검정 고양이). higgsfield 생성, work/blackcat → 320px 승격(2026-06-15).
 * 표정 15종 + 동작 anim(retro.css mascot-* keyframes). 크기는 부모 박스가 정함(width:100%) — size 주면 px 고정.
 * 코스튬은 로드맵(미사용). 옛 3×3 시트(cat-sheet.png)는 폐기.
 */
export type CatExpression =
  | "default" | "happy" | "loaf" | "jump" | "surprised" | "love"
  | "sad" | "wave" | "write" | "think" | "bow" | "angry"
  | "celebrate" | "sleepy" | "wink";
export type CatCostume = "none" | "ribbon" | "beret" | "tuxedo" | "crown";
export type CatAnim =
  | "breathe" | "bounce" | "hop" | "sway" | "wiggle"
  | "squash" | "shake" | "pounce" | "spin" | "walk";

export function PixelCat({
  expression = "default",
  costume = "none",
  anim,
  breathe = false,
  size,
  cell,
  className = "",
  style,
}: {
  expression?: CatExpression;
  costume?: CatCostume;
  anim?: CatAnim;
  breathe?: boolean;
  size?: number | string;
  cell?: number;
  className?: string;
  style?: CSSProperties;
}) {
  void costume; // 코스튬은 로드맵(시트 베이스엔 미포함)
  void cell; // (구) 픽셀 그리드 — 폐기. 폭은 부모 박스가 정함
  const animClass = anim ? `mascot-${anim}` : breathe ? "mascot-breathe" : "";

  return (
    <img
      src={`/mascot/cats/cat-${expression}.png`}
      alt={`손님 고양이 (${expression})`}
      className={`${animClass} ${className}`.trim()}
      style={{
        width: size != null ? (typeof size === "number" ? `${size}px` : size) : "100%",
        height: "auto",
        display: "block",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}
