// 사장 대시보드 순수 파생 헬퍼 — 레거시 owner/index.html 로직 포팅.
// 슬라임/집계 엔진은 src/lib에서 직접 import해 재사용한다.

export type OwnerStatus = "new" | "seen" | "acted" | "later";

export const OWNER_STATUSES: Record<OwnerStatus, string> = {
  new: "새 한마디",
  seen: "확인함",
  acted: "조치함",
  later: "나중에 볼 것",
};

export type Feedback = {
  id: string;
  stores?: { id: string; slug?: string; display_name?: string };
  store_id?: string;
  content_clean?: string;
  content_polished?: string;
  sentiment_score?: number | null;
  urgency?: string;
  categories?: string[] | string;
  pii_removed?: boolean;
  profanity_removed?: boolean;
  created_at?: string;
  owner_status?: OwnerStatus;
};

export function getOwnerStatus(item: Feedback): OwnerStatus {
  return item.owner_status || "new";
}

export function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export function sentimentBadge(score?: number | null) {
  if (score == null) return { tone: "neu" as const, label: "중립" };
  if (score >= 0.3) return { tone: "pos" as const, label: "긍정" };
  if (score <= -0.3) return { tone: "neg" as const, label: "부정" };
  return { tone: "neu" as const, label: "중립" };
}

export function urgencyBadge(urgency?: string) {
  if (urgency === "high") return { tone: "high" as const, label: "긴급" };
  if (urgency === "mid" || urgency === "medium") return { tone: "mid" as const, label: "주의" };
  return { tone: "low" as const, label: "평이" };
}

export function getCategories(item: Feedback): string[] {
  if (Array.isArray(item.categories)) return item.categories.filter(Boolean);
  if (typeof item.categories === "string" && item.categories.trim()) return [item.categories.trim()];
  return ["기타"];
}
export function primaryCategory(item: Feedback): string {
  return getCategories(item)[0] || "기타";
}

export function isUrgentFeedback(item: Feedback): boolean {
  return item.urgency === "high" || (item.sentiment_score != null && item.sentiment_score <= -0.5);
}
export function isPositiveFeedback(item: Feedback): boolean {
  if (item.sentiment_score != null) return item.sentiment_score >= 0.3;
  return /좋|맛있|친절|감사|만족|최고|추천|또\s*갈|다시\s*올/.test(item.content_clean || "");
}
export function isNegativeFeedback(item: Feedback): boolean {
  if (item.sentiment_score != null) return item.sentiment_score <= -0.3;
  return /아쉽|불편|별로|늦|더럽|비싸|불친절|맛없|차갑|짜|시끄|불만|기다/.test(item.content_clean || "");
}
export function isOpenFeedback(item: Feedback): boolean {
  return !["seen", "acted"].includes(getOwnerStatus(item));
}

export type RepeatSignal = {
  category: string;
  count: number;
  lowCount: number;
  latestAt: string;
  hidden?: boolean;
};

export function buildRepeatSignals(feedback: Feedback[]): RepeatSignal[] {
  const groups = new Map<string, RepeatSignal>();
  feedback.filter(isOpenFeedback).forEach((item) => {
    const category = primaryCategory(item);
    const current = groups.get(category) || {
      category,
      count: 0,
      lowCount: 0,
      latestAt: item.created_at || "",
    };
    current.count += 1;
    if (isNegativeFeedback(item) || item.urgency === "high") current.lowCount += 1;
    if (new Date(item.created_at || 0) > new Date(current.latestAt || 0)) {
      current.latestAt = item.created_at || "";
    }
    groups.set(category, current);
  });
  return Array.from(groups.values())
    .filter((g) => g.count >= 2)
    .sort((a, b) => {
      const aStrong = a.count >= 3 || a.lowCount >= 2 ? 1 : 0;
      const bStrong = b.count >= 3 || b.lowCount >= 2 ? 1 : 0;
      if (bStrong !== aStrong) return bStrong - aStrong;
      if (b.count !== a.count) return b.count - a.count;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });
}

export type TodayAction = {
  kind: "urgent" | "repeat" | "low" | "positive" | "empty";
  item?: Feedback;
  title: string;
  reason: string;
  next: string;
};

export function buildTodayAction(feedback: Feedback[]): TodayAction {
  const open = feedback.filter(isOpenFeedback);
  const urgent = open.find(isUrgentFeedback);
  if (urgent) {
    return {
      kind: "urgent",
      item: urgent,
      title: "고객 주장 기준 긴급 신호 확인",
      reason: `${primaryCategory(urgent)} 관련 한마디가 긴급 확인으로 들어왔어요.`,
      next: "실제 상황이 있었는지 먼저 확인하고, 확인 후 조치함으로 바꿔주세요.",
    };
  }
  const repeated = buildRepeatSignals(open)[0];
  if (repeated) {
    return {
      kind: "repeat",
      title: `${repeated.category} 반복 신호 확인`,
      reason: `같은 주제 한마디가 ${repeated.count}건 들어왔어요.`,
      next: "오늘 현장에서 같은 문제가 반복될 수 있는 지점 1곳만 확인해보세요.",
    };
  }
  const low = open.find(isNegativeFeedback);
  if (low) {
    return {
      kind: "low",
      item: low,
      title: `${primaryCategory(low)} 한마디 1건 확인`,
      reason: "아직 반복은 아니지만 그냥 넘기기 아쉬운 신호예요.",
      next: "원문을 읽고 오늘 바로 확인할 수 있는 작은 지점만 봐주세요.",
    };
  }
  const positive = open.find(isPositiveFeedback);
  if (positive) {
    return {
      kind: "positive",
      item: positive,
      title: "좋은 한마디 확인",
      reason: "지금은 고칠 신호보다 유지하면 좋은 경험이 먼저 보여요.",
      next: "좋았던 지점을 유지할 수 있게 오늘 한 번만 체크해보세요.",
    };
  }
  return {
    kind: "empty",
    title: "오늘은 억지 액션을 만들지 않아도 돼요",
    reason: "아직 충분한 근거가 없어요.",
    next: "새 한마디가 들어오면 여기에서 먼저 보여드릴게요.",
  };
}

// Supabase feedback → slimeEngine item (rating·reviewRiskLevel 매핑). 새 수치 생성 없음.
export function toSlimeItem(item: Feedback) {
  const urgent = item.urgency === "high";
  const negative = isNegativeFeedback(item);
  const positive = isPositiveFeedback(item);
  let rating = 3;
  if (positive) rating = 5;
  else if (negative) rating = 2;
  let reviewRiskLevel = "low";
  if (urgent || (item.sentiment_score != null && item.sentiment_score <= -0.5)) reviewRiskLevel = "high";
  else if (item.urgency === "mid" || item.urgency === "medium" || negative) reviewRiskLevel = "medium";
  return {
    submission: { id: item.id, rating, category: primaryCategory(item), submittedAt: item.created_at },
    moderation: { includeInStats: true, urgentAlert: urgent },
    insight: { reviewRiskLevel },
  };
}

export function slimeItemsFor(storeId: string | null, feedback: Feedback[]) {
  return feedback.filter((f) => !storeId || f.stores?.id === storeId).map(toSlimeItem);
}

export function moodLabel(mood?: string): string {
  return (
    { happy: "좋음", calm: "평온", worried: "주의", hungry: "한마디 기다리는 중" } as Record<string, string>
  )[mood || ""] || "평온";
}

// 매장 나무 단계(1~5) — store_slime.growth_points 단일 출처. (손님 폼과 동일 규칙)
export function treeLevelFromPoints(points?: number): 1 | 2 | 3 | 4 | 5 {
  const p = Number(points) || 0;
  if (p >= 45) return 5;
  if (p >= 20) return 4;
  if (p >= 8) return 3;
  if (p >= 3) return 2;
  return 1;
}
