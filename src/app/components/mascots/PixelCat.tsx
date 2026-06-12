/**
 * 손님 고양이 마스코트 — Figma 정교 픽셀아트 9포즈 시트(public/mascot/cat-sheet.png).
 * 절차생성 폐기, Figma export 채택(2026-06-12). 3×3 시트를 background-position으로 슬라이스.
 * 코스튬은 로드맵(시트 베이스엔 없음).
 */

export type CatExpression = "default" | "sleepy" | "happy";
export type CatCostume = "none" | "ribbon" | "beret" | "tuxedo" | "crown";

// 9포즈 3×3 [col,row]:
// (0,0)기본 (1,0)웃음 (2,0)놀람 / (0,1)점프 (1,1)걷기 (2,1)잠 / (0,2)윙크 (1,2)앉음옆 (2,2)앉음정면
const POSE: Record<CatExpression, [number, number]> = {
  default: [2, 2], // 앉음 정면 — 마스코트 기본
  happy: [0, 2], // 윙크/웃음
  sleepy: [2, 1], // 잠
};

export function PixelCat({
  expression = "default",
  costume = "none",
  cell = 4,
  className = "",
}: {
  expression?: CatExpression;
  costume?: CatCostume;
  cell?: number;
  className?: string;
}) {
  void costume; // 시트 베이스엔 코스튬 미포함 (코스튬은 로드맵)
  const [col, row] = POSE[expression];

  return (
    <div
      role="img"
      aria-label={`손님 고양이 (${expression})`}
      className={className}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        backgroundImage: "url(/mascot/cat-sheet.png)",
        backgroundSize: "300% 300%",
        backgroundPosition: `${col * 50}% ${row * 50}%`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  );
}
