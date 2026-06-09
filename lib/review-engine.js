// review-engine — 관리자(운영자) 검수 로직
// 원본↔가림 결과를 검수 카드로 만들고, 위험도 트리아지·오탐 플래그·다매장 집계를 제공한다.
// vocEngine 재사용(가림·분류 단일 출처). 명세 = business/beta/관리자-검수-명세.md
// 정직 선: 원본(original)은 운영자 전용. 실서비스는 RLS+content_raw 분리 테이블로 강제.
//
// 주의: 이 파일은 src/reviewEngine.js의 voxpop-deploy 사본이다.
// import 경로만 ./voc-engine.js로 조정됨. src/ 수정 시 이 파일도 함께 갱신.

import { EXPOSURE_STATUS } from './voc-engine.js';

export const REVIEW_FLAG = {
  UNREVIEWED: 'unreviewed',
  ACCURATE: 'accurate', // 가림 정확
  OVER: 'over',         // 과가림 — 안 가려도 되는데 가림
  UNDER: 'under',       // 미가림 — 가려야 하는데 놓침
};

export const REVIEW_FLAG_LABEL = {
  unreviewed: '미검수',
  accurate: '가림 정확',
  over: '과가림',
  under: '미가림',
};

// 가려진(또는 위험으로 잡힌) 항목 유형 — 검수 카드에서 "무엇이 왜 처리됐나" 표시용.
export function maskedTypes(moderation) {
  const types = [];
  if (moderation.hasPii) types.push('개인정보');
  if (moderation.hasStaffReference) types.push('직원 지칭');
  if (moderation.hasDefamationRisk) types.push('명예훼손 위험');
  if (moderation.hasPersonalAttack) types.push('인신공격');
  if (moderation.profanityScore > 0) types.push('욕설');
  if (moderation.urgentAlert) types.push('긴급(안전·위생)');
  return types;
}

// processFeedback 결과 1건 → 검수 아이템.
export function buildReviewItem(processed, flag = REVIEW_FLAG.UNREVIEWED) {
  const { submission, moderation } = processed;
  return {
    id: submission.id,
    storeId: submission.storeId ?? '',
    qrLocation: submission.qrLocation ?? '',
    submittedAt: submission.submittedAt,
    original: submission.comment,
    masked: submission.sanitizedComment,
    changed: submission.comment !== submission.sanitizedComment,
    category: submission.category,
    rating: submission.rating,
    exposureStatus: moderation.exposureStatus,
    includeInStats: moderation.includeInStats,
    urgent: moderation.urgentAlert,
    abuseScore: submission.abuseScore ?? 0,
    holdReason: moderation.holdReason ?? '',
    maskedTypes: maskedTypes(moderation),
    // 알 수 없는 플래그 값은 조용히 증발시키지 않고 미검수로 정규화한다.
    reviewFlag: Object.values(REVIEW_FLAG).includes(flag) ? flag : REVIEW_FLAG.UNREVIEWED,
  };
}

// 위험도 순위 (낮을수록 위)
function severityRank(item) {
  if (item.urgent) return 0;                              // 긴급 안전·위생 최상위
  if (item.exposureStatus === EXPOSURE_STATUS.HELD) return 1;     // 민감 보류(PII·명예훼손)
  if (item.exposureStatus === EXPOSURE_STATUS.SANITIZED) return 2; // 가림 후 표시
  if (item.exposureStatus === EXPOSURE_STATUS.SPAM) return 3;     // 스팸 제외
  return 4;                                               // 정상 노출
}

// 검수 큐 트리아지: 미검수 먼저 → 위험도 높은 것 → 최신순. (FIFO 금지 — BP)
export function triageSort(items) {
  return items.slice().sort((a, b) => {
    const au = a.reviewFlag === REVIEW_FLAG.UNREVIEWED ? 0 : 1;
    const bu = b.reviewFlag === REVIEW_FLAG.UNREVIEWED ? 0 : 1;
    if (au !== bu) return au - bu;
    const sr = severityRank(a) - severityRank(b);
    if (sr !== 0) return sr;
    return new Date(b.submittedAt) - new Date(a.submittedAt);
  });
}

// processFeedback 결과 배열 + 플래그맵(id→flag) → 트리아지된 검수 큐.
export function buildReviewQueue(processedList, flagMap = {}) {
  const items = processedList.map((p) =>
    buildReviewItem(p, flagMap[p.submission.id] ?? REVIEW_FLAG.UNREVIEWED),
  );
  return triageSort(items);
}

// 집계 (검수 진행·엔진 품질 지표)
export function reviewStats(items) {
  const s = {
    total: items.length,
    unreviewed: 0, accurate: 0, over: 0, under: 0,
    urgent: 0, held: 0, spam: 0, sanitized: 0,
    flagged: 0, // 오탐(over+under)
  };
  for (const it of items) {
    if (it.reviewFlag === REVIEW_FLAG.UNREVIEWED) s.unreviewed += 1;
    else if (it.reviewFlag === REVIEW_FLAG.ACCURATE) s.accurate += 1;
    else if (it.reviewFlag === REVIEW_FLAG.OVER) { s.over += 1; s.flagged += 1; }
    else if (it.reviewFlag === REVIEW_FLAG.UNDER) { s.under += 1; s.flagged += 1; }
    if (it.urgent) s.urgent += 1;
    if (it.exposureStatus === EXPOSURE_STATUS.HELD) s.held += 1;
    if (it.exposureStatus === EXPOSURE_STATUS.SPAM) s.spam += 1;
    if (it.exposureStatus === EXPOSURE_STATUS.SANITIZED) s.sanitized += 1;
  }
  return s;
}

// 다매장 요약 (관리자 홈 — 매장 목록 + 미검수 배지)
export function storesSummary(items, stores = []) {
  const byStore = new Map();
  for (const it of items) {
    const cur = byStore.get(it.storeId) ?? { storeId: it.storeId, total: 0, unreviewed: 0, urgent: 0, lastAt: null };
    cur.total += 1;
    if (it.reviewFlag === REVIEW_FLAG.UNREVIEWED) cur.unreviewed += 1;
    if (it.urgent) cur.urgent += 1;
    if (!cur.lastAt || new Date(it.submittedAt) > new Date(cur.lastAt)) cur.lastAt = it.submittedAt;
    byStore.set(it.storeId, cur);
  }
  // 등록된 매장 중 응답 0건도 노출
  for (const st of stores) {
    if (!byStore.has(st.storeId)) byStore.set(st.storeId, { storeId: st.storeId, total: 0, unreviewed: 0, urgent: 0, lastAt: null });
  }
  const nameOf = new Map(stores.map((s) => [s.storeId, s.name]));
  return Array.from(byStore.values())
    .map((s) => ({ ...s, name: nameOf.get(s.storeId) ?? s.storeId }))
    .sort((a, b) => (b.urgent - a.urgent) || (b.unreviewed - a.unreviewed) || (b.total - a.total));
}

// 필터 (매장·상태·미검수만)
export function filterQueue(items, { storeId = null, status = null, unreviewedOnly = false, urgentOnly = false } = {}) {
  return items.filter((it) => {
    if (storeId && it.storeId !== storeId) return false;
    if (status && it.exposureStatus !== status) return false;
    if (unreviewedOnly && it.reviewFlag !== REVIEW_FLAG.UNREVIEWED) return false;
    if (urgentOnly && !it.urgent) return false;
    return true;
  });
}
