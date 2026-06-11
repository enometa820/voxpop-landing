// src/trendAggregate.js의 배포용 스냅샷 — src 수정 시 여기도 복사
// voxpop Layer 2 — 사장 대시보드 트렌드 집계 (zero-dependency 순수 로직)
// owner/index.html이 카테고리 막대·시간축 추이를 순수 SVG/CSS로 그리는 데 쓰는 데이터만 만든다.
// 차트 라이브러리·외부 import 0. vocEngine src↔lib 정합 규약과 동일하게 lib/로 복사한다.

const WINDOWS = {
  '7d': { count: 7, stepMs: 24 * 60 * 60 * 1000, fmt: dayLabel },
  '24h': { count: 6, stepMs: 4 * 60 * 60 * 1000, fmt: hourLabel },
};

function dayLabel(start) {
  const d = new Date(start);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function hourLabel(start) {
  const d = new Date(start);
  return `${String(d.getHours()).padStart(2, '0')}시`;
}

// owner/index.html getCategories·primaryCategory와 동일 규칙
function primaryCategory(item) {
  if (Array.isArray(item.categories)) {
    const first = item.categories.filter(Boolean)[0];
    return first || '기타';
  }
  if (typeof item.categories === 'string' && item.categories.trim()) {
    return item.categories.trim();
  }
  return '기타';
}

function isUrgent(item) {
  return item.urgency === 'high';
}

function isNegative(item) {
  if (item.urgency === 'high') return true;
  return item.sentiment_score != null && item.sentiment_score <= -0.3;
}

export function aggregateByCategory(items = [], options = {}) {
  const window = WINDOWS[options.window] ? options.window : '7d';
  const spec = WINDOWS[window];
  const now = options.now ? new Date(options.now).getTime() : Date.now();

  // ── 카테고리 집계(윈도 무관 전체 분포) ──
  const catMap = new Map();
  for (const item of items) {
    const category = primaryCategory(item);
    const cur = catMap.get(category) || { category, count: 0, urgentCount: 0, negativeCount: 0 };
    cur.count += 1;
    if (isUrgent(item)) cur.urgentCount += 1;
    if (isNegative(item)) cur.negativeCount += 1;
    catMap.set(category, cur);
  }
  const categories = Array.from(catMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.urgentCount - a.urgentCount;
  });

  // ── 시간축 버킷(과거→현재) ──
  // 윈도 끝을 now+1ms로 두어 created_at=now인 row가 마지막 버킷에 포함되게 한다.
  // 각 버킷은 [start, end) 반열림 구간.
  const windowEnd = now + 1; // inclusive upper bound: t <= now → t < windowEnd
  const buckets = [];
  for (let i = spec.count - 1; i >= 0; i--) {
    const end = windowEnd - i * spec.stepMs;
    const start = end - spec.stepMs;
    buckets.push({
      label: spec.fmt(start + spec.stepMs / 2),
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      total: 0,
      byCategory: {},
      _start: start,
      _end: end,
    });
  }

  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    if (Number.isNaN(t)) continue;
    const bucket = buckets.find((b) => t >= b._start && t < b._end);
    if (!bucket) continue; // 윈도 밖
    const category = primaryCategory(item);
    bucket.total += 1;
    bucket.byCategory[category] = (bucket.byCategory[category] || 0) + 1;
  }

  let maxBucketTotal = 0;
  for (const b of buckets) {
    if (b.total > maxBucketTotal) maxBucketTotal = b.total;
    delete b._start;
    delete b._end;
  }

  const total = categories.reduce((s, c) => s + c.count, 0);
  return { categories, buckets, total, maxBucketTotal };
}
