// 나무 단계 SSOT — 타입·임계·라벨 단일 출처.
// store_slime.growth_points(불변 데이터 출처)를 6단계로 해석한다.
// 손님 폼·사장 대시보드·PixelTree가 모두 이 모듈을 재사용한다.
export type TreeLevel = 1 | 2 | 3 | 4 | 5 | 6;

// 임계(추정, 베타 보정 전): 씨앗0 · 새싹1~4 · 줄기5~12 · 앙상한13~24 · 푸른25~49 · 열매50+
export function treeLevelFromPoints(points?: number): TreeLevel {
  const p = Number(points);
  if (!Number.isFinite(p) || p < 1) return 1;
  if (p >= 50) return 6;
  if (p >= 25) return 5;
  if (p >= 13) return 4;
  if (p >= 5) return 3;
  return 2;
}

export const TREE_LABELS: Record<TreeLevel, string> = {
  1: "씨앗",
  2: "새싹",
  3: "줄기",
  4: "앙상한 나무",
  5: "푸른 나무",
  6: "열매",
};
