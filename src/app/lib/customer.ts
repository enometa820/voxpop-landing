// 손님 폼 순수 헬퍼 — 레거시 s/index.html 로직을 React로 포팅.
// DOM·네트워크 의존 없음. 엔진/슬라임 모듈은 src/lib에서 가져온다.
import { growthFromPoints } from "../../lib/slime-engine.js";
import { treeLevelFromPoints, TREE_LABELS, type TreeLevel } from "./tree";
export { treeLevelFromPoints, TREE_LABELS, type TreeLevel };

type EngineResult = {
  submission?: { cleanSentence?: string; category?: string };
  moderation?: { hasPii?: boolean; profanityScore?: number };
  insight?: { reviewRiskLevel?: string; sentimentScore?: number };
};

// 스레드 토큰 — 불투명 난수 16바이트 hex(클라 생성). anon insert가 서버 default를
// 못 돌려주므로 payload에 직접 넣고 그대로 돌려받는다.
export function genClaimToken(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

// content_clean(사장 화면용 완결문) — 한마디 없으면 별점 요약. 가림 토큰 제거본 사용.
export function getSafeCleanContent(
  result: EngineResult,
  raw: string,
  rating: number,
): string {
  if (!raw) return `별점 ${rating}점 (한마디 없음)`;
  return result.submission?.cleanSentence || `별점 ${rating}점 (한마디 없음)`;
}

// 엔진 위험도 → DB urgency
export function getDbUrgency(result: EngineResult): "high" | "mid" | "low" {
  const risk = result.insight?.reviewRiskLevel;
  if (risk === "high") return "high";
  if (risk === "medium") return "mid";
  return "low";
}

// 별점이 1차 정서 신호, 텍스트는 보조.
export function estimateSentimentScore(rating: number, text: string): number {
  if (rating >= 4) return 0.7;
  if (rating <= 2) return -0.6;
  if (/좋|맛있|친절|감사|만족|최고|추천|또\s*갈|다시\s*올/.test(text)) return 0.4;
  if (/아쉽|불편|별로|늦|더럽|비싸|불친절|맛없|차갑|짜|시끄|불만|기다/.test(text)) return -0.4;
  return 0;
}

// store_slime 행(없으면 null)에서 나무 단계 + 라벨 산출. (나무 SSOT = ./tree)
export function resolveTree(slimeRow: { growth_points?: number } | null) {
  const points = slimeRow?.growth_points ?? 0;
  const level = treeLevelFromPoints(points);
  return { level, label: TREE_LABELS[level], points };
}

// 슬라임엔진 stage(0~3) — DB store_slime.stage 컬럼 호환 유지용.
export function resolveSlimeStage(slimeRow: { growth_points?: number; stage?: number } | null) {
  if (!slimeRow) return growthFromPoints(0, 0);
  return growthFromPoints(slimeRow.growth_points ?? 0, slimeRow.stage ?? 0);
}

// ── 스레드 재방문 (localStorage, 서버 비저장) ───────────────────
export function saveReceipt(slug: string, token: string) {
  try {
    localStorage.setItem(
      `voxpop-receipt-${slug}`,
      JSON.stringify({ token, savedAt: Date.now() }),
    );
  } catch { /* localStorage 불가 환경 무시 */ }
}
export function getSavedReceipt(slug: string): { token: string; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(`voxpop-receipt-${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── 클라이언트 중복 제출 가드 (DB 트리거가 최종 강제) ───────────
const LAST_SUBMIT_KEY = "voxpop-last-submit-v1";
const CLIENT_INTERVAL_MS = 20000;
export function tooSoonToResubmit(): boolean {
  const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0);
  return !!last && Date.now() - last < CLIENT_INTERVAL_MS;
}
export function markSubmitted() {
  try { localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now())); } catch { /* 무시 */ }
}

// rate limit 에러 메시지 매핑(DB 트리거 거부 시).
export function getRateLimitMessage(err: unknown): string | null {
  const msg = String((err as { message?: string })?.message || "");
  if (msg.includes("rate_limit_device_daily") || msg.includes("rate_limit_ip_daily")) {
    return "오늘은 한마디를 충분히 남기셨어요. 내일 다시 들러주세요.";
  }
  if (msg.includes("rate_limit")) {
    return "조금 빠르게 다시 누르셨어요. 잠시 후 다시 시도해주세요.";
  }
  return null;
}
