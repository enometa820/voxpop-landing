// slimeEngine.js — 매장 슬라임 상태(기분·건강·성장) 계산
//
// vocEngine의 processFeedback 결과(items)와 사장 조치 기록(actions),
// 영속 성장값(slimeRow)을 입력으로 슬라임의 mood·health·stage를 계산한다.
//
// 핵심 원칙(BP 조사 반영): 슬라임은 "보상"이 아니라 "가게 건강의 정보 신호(계기판 얼굴)"다.
// 표정·건강·성장은 잘했으니 주는 별이 아니라 "지금 가게 상태가 이렇다"의 감정 번역이다.
// 저압 모드 — 슬라임은 죽지 않고 시들기만 하며(B2B 해지 트리거 회피), 성장은 단계 후퇴가 없다.
// 무기명 — 이 모듈은 매장 단위 집계만 다룬다. 손님 식별 정보를 받지 않는다.

// 표정 6종 — 마스코트 에셋 expressions와 1:1 (idle·happy·playful·sassy·hungry·sick)
export const SLIME_EXPRESSION = {
  IDLE: 'idle',
  HAPPY: 'happy',
  PLAYFUL: 'playful',
  SASSY: 'sassy',
  HUNGRY: 'hungry',
  SICK: 'sick',
};

// 성장 4단계 — 마스코트 에셋 growth와 1:1
export const SLIME_STAGE = { DROPLET: 0, BABY: 1, GROWN: 2, THRIVING: 3 };
const STAGE_NAMES = ['방울', '아기', '성체', '번성'];

// 빡센 성장 곡선 — 단계별 누적 성장 포인트 임계. 초반 빠름·후반 느림(헌신 신호).
// 번성(왕관/꽃)은 의도적으로 멀다. 베타 데이터로 보정 전 초기값.
const STAGE_THRESHOLDS = [0, 3, 12, 40];

// "최근"의 정의 — 기분 판단 창
const RECENT_MS = 36 * 60 * 60 * 1000; // 36시간
const HUNGRY_MS = 24 * 60 * 60 * 1000; // 24시간 이상 응답 없으면 배고픔
// 건강 게이트 — 이 점수 이상일 때만 조치가 성장으로 누적된다(꾸준히 듣고 고쳐야 큰다)
export const HEALTH_GATE = 60;

// 건강 점수 차감 가중치
const PENALTY_UNRESOLVED_RISK = 22; // 미조치 고위험·긴급 신호 1건당
const PENALTY_UNRESOLVED_MID = 8; // 미조치 중위험 1건당

function toMs(value) {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function nowMs(now) {
  return toMs(now) ?? toMs(new Date().toISOString());
}

// 활성(통계 포함) item만 — 도배·스팸 제외
function activeItems(items) {
  return items.filter((item) => item?.moderation?.includeInStats);
}

// 조치된 feedback id 집합 (action_type 무관하게 "그 한마디를 다뤘다"로 본다)
function resolvedIds(actions) {
  const set = new Set();
  for (const a of actions ?? []) {
    if (a?.feedback_id) set.add(a.feedback_id);
  }
  return set;
}

// ─────────────────────────────────────────────────────────────
// AC-3.1 기분(실시간) — 최근 톤에 반응
// ─────────────────────────────────────────────────────────────
export function computeMood(items = [], now = new Date().toISOString()) {
  const ref = nowMs(now);
  const active = activeItems(items);

  if (active.length === 0) {
    return { mood: 'hungry', recent: 0, reason: '아직 받은 한마디가 없어요' };
  }

  const lastAt = Math.max(...active.map((i) => toMs(i.submission.submittedAt) ?? 0));
  if (ref - lastAt > HUNGRY_MS) {
    return { mood: 'hungry', recent: 0, reason: '한동안 새 한마디가 없어요' };
  }

  const recent = active.filter((i) => ref - (toMs(i.submission.submittedAt) ?? 0) <= RECENT_MS);
  if (recent.length === 0) {
    return { mood: 'calm', recent: 0, reason: '최근은 잠잠해요' };
  }

  const praise = recent.filter((i) => Number(i.submission.rating) >= 4).length;
  const complaints = recent.filter((i) => Number(i.submission.rating) <= 2).length;

  if (complaints > praise) {
    return { mood: 'worried', recent: recent.length, reason: '최근 아쉬운 한마디가 늘었어요' };
  }
  if (praise > complaints) {
    return { mood: 'happy', recent: recent.length, reason: '최근 좋은 한마디가 들어왔어요' };
  }
  return { mood: 'calm', recent: recent.length, reason: '최근은 평온해요' };
}

// ─────────────────────────────────────────────────────────────
// AC-3.2 건강(단기) — 미조치 불만·위험에 반비례
// ─────────────────────────────────────────────────────────────
export function computeHealth(items = [], actions = [], now = new Date().toISOString()) {
  const active = activeItems(items);
  if (active.length === 0) {
    return { score: 100, state: SLIME_EXPRESSION.HUNGRY, unresolvedRisk: 0 };
  }

  const resolved = resolvedIds(actions);
  const unresolved = active.filter((i) => !resolved.has(i.submission.id));

  const unresolvedHigh = unresolved.filter(
    (i) => i.insight.reviewRiskLevel === 'high' || i.moderation.urgentAlert,
  ).length;
  const unresolvedMid = unresolved.filter((i) => i.insight.reviewRiskLevel === 'medium').length;

  let score = 100 - unresolvedHigh * PENALTY_UNRESOLVED_RISK - unresolvedMid * PENALTY_UNRESOLVED_MID;
  score = Math.max(0, Math.min(100, score));

  // 최근 조치가 있었는지(회복 신호) — 미조치 위험이 0이고 조치 기록이 있으면 '회복'
  const justRecovered = unresolvedHigh === 0 && resolved.size > 0 && active.length > 0;

  let state;
  if (score < 40) state = SLIME_EXPRESSION.SICK;
  else if (justRecovered) state = SLIME_EXPRESSION.HAPPY; // 다 돌본 직후 = 밝음(회복)
  else if (score < 70) state = SLIME_EXPRESSION.SASSY; // 처리할 게 남음 — 무심한 재촉
  else state = SLIME_EXPRESSION.IDLE;

  return { score, state, unresolvedRisk: unresolvedHigh, unresolvedMid };
}

// ─────────────────────────────────────────────────────────────
// AC-3.3 성장(누적·빡셈) — 영속 포인트에서 단계 산출, 후퇴 없음
// ─────────────────────────────────────────────────────────────
export function growthFromPoints(points = 0, prevStage = 0) {
  const p = Math.max(0, Math.floor(points));
  let stage = 0;
  for (let s = STAGE_THRESHOLDS.length - 1; s >= 0; s -= 1) {
    if (p >= STAGE_THRESHOLDS[s]) {
      stage = s;
      break;
    }
  }
  // 후퇴 없음 — 한 번 오른 단계는 내려가지 않는다(저압 모드)
  stage = Math.max(stage, prevStage ?? 0);

  const isMax = stage >= SLIME_STAGE.THRIVING;
  const nextThreshold = isMax ? null : STAGE_THRESHOLDS[stage + 1];
  const base = STAGE_THRESHOLDS[stage];
  const progress = isMax ? 1 : Math.min(1, (p - base) / (nextThreshold - base));

  return {
    stage,
    stageName: STAGE_NAMES[stage],
    points: p,
    nextThreshold,
    progress: Math.round(progress * 100) / 100,
    isMax,
  };
}

// 이번 조치가 성장으로 누적되는지 판정 — 건강 게이트(건강 양호일 때만 큰다)
export function growthGateOpen(healthScore) {
  return Number(healthScore) >= HEALTH_GATE;
}

// ─────────────────────────────────────────────────────────────
// 표정 선택 — 기분·건강을 종합해 6종 중 하나
// ─────────────────────────────────────────────────────────────
function pickExpression(moodResult, healthResult) {
  // 건강이 우선(가장 진지한 신호) — 아프면 무조건 sick
  if (healthResult.state === SLIME_EXPRESSION.SICK) return SLIME_EXPRESSION.SICK;
  if (moodResult.mood === 'hungry') return SLIME_EXPRESSION.HUNGRY;
  if (moodResult.mood === 'worried') return SLIME_EXPRESSION.SASSY;
  if (moodResult.mood === 'happy') {
    // 최근 좋은 한마디가 여러 건 몰리면 신남(playful), 한두 건이면 행복(happy)
    return moodResult.recent >= 3 ? SLIME_EXPRESSION.PLAYFUL : SLIME_EXPRESSION.HAPPY;
  }
  // 건강이 보통(처리할 게 남음)이면 sassy, 아니면 idle
  if (healthResult.state === SLIME_EXPRESSION.SASSY) return SLIME_EXPRESSION.SASSY;
  return SLIME_EXPRESSION.IDLE;
}

// ─────────────────────────────────────────────────────────────
// AC-3.4 통합 상태
// ─────────────────────────────────────────────────────────────
export function buildSlimeState(items = [], actions = [], slimeRow = {}, now = new Date().toISOString()) {
  const mood = computeMood(items, now);
  const health = computeHealth(items, actions, now);
  const growth = growthFromPoints(slimeRow.growth_points ?? 0, slimeRow.stage ?? 0);
  const expression = pickExpression(mood, health);

  return {
    expression, // 표정 에셋 키 (idle·happy·playful·sassy·hungry·sick)
    mood: mood.mood,
    moodReason: mood.reason,
    health: health.score,
    healthState: health.state,
    unresolvedRisk: health.unresolvedRisk,
    stage: growth.stage,
    stageName: growth.stageName,
    growthPoints: growth.points,
    growthProgress: growth.progress,
    nextThreshold: growth.nextThreshold,
    isMaxStage: growth.isMax,
    gateOpen: growthGateOpen(health.score),
  };
}

// ─────────────────────────────────────────────────────────────
// AC-3.5 말풍선 — buildOwnerDashboard 결과를 슬라임 말투로 번역
// 정직: 슬라임이 "AI가 다 한다"고 과장하지 않는다(현재 규칙 기반).
// ─────────────────────────────────────────────────────────────
export function slimeBubble(dashboard = {}, slimeState = {}) {
  const state = dashboard.state;
  if (state === 'empty' || state == null) {
    return '아직 배가 고파요. QR로 손님 한마디를 받아 저를 키워주세요!';
  }
  if (state === 'loading') return '잠깐만요, 한마디를 불러오고 있어요…';
  if (state === 'error') return '앗, 한마디를 못 불러왔어요. 잠시 후 다시 봐주세요.';

  if (slimeState.expression === SLIME_EXPRESSION.SICK) {
    return `오늘은 좀 아파요 — ${dashboard.todayAction || '확인할 신호가 쌓였어요.'}`;
  }
  if (slimeState.unresolvedRisk > 0) {
    return `먼저 봐주세요 — ${dashboard.todayAction || '위험 신호가 있어요.'}`;
  }
  if (dashboard.todayAction) {
    return `오늘은 이거 하나만 — ${dashboard.todayAction}`;
  }
  return '오늘은 평온해요. 잘 돌봐주셔서 고마워요!';
}

// ─────────────────────────────────────────────────────────────
// AC-3.6 k-anonymity 노출 게이트
// 응답이 k건 미만인 슬라이스(시간대·카테고리)는 사장 화면에 노출하지 않는다
// (소표본 재식별 통로 차단).
// ─────────────────────────────────────────────────────────────
export function kAnonGate(count, k = 3) {
  return Number(count) >= k;
}

// 슬라이스 배열에서 k 미만 항목을 가린다
export function applyKAnon(slices = [], k = 3, countKey = 'count') {
  return slices.map((s) => (kAnonGate(s[countKey], k) ? s : { ...s, hidden: true }));
}
