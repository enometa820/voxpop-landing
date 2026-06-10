export const EXPOSURE_STATUS = {
  VISIBLE: '정상 노출',
  SANITIZED: '가림 후 표시',
  HELD: '민감 보류',
  SPAM: '스팸 제외',
};

const DEFAULT_STORE_NAME = '모닝브루 성수점';
const COMMENT_LIMIT = 300;
// 활성 응답이 이 수 이하면 '소수(sparse)' 상태로 보고 추세 대신 개별 신호로 보여준다.
const SPARSE_THRESHOLD = 4;
// abuseScore가 이 값 이상이면 같은 기기의 단시간 반복(도배)으로 보고 통계·신호에서 자동 제외한다.
const ABUSE_SCORE_THRESHOLD = 75;
const DIGEST_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
});

const CATEGORIES = ['맛', '응대', '청결', '대기', '가격', '소음', '기타'];

const PROFANITY_PATTERN =
  /(시발|씨발|ㅅㅂ|개새끼|개새|병신|좆|지랄|fuck|shit|bitch|꺼져)/gi;
const PHONE_PATTERN = /\b01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
// 끝 묶음 3자리 이상으로 제한해 날짜(YYYY-MM-DD, 끝 '일'은 2자리)를 계좌로 오탐하지 않는다.
const BANK_ACCOUNT_PATTERN = /\b\d{2,6}[-\s]\d{2,6}[-\s]\d{3,8}\b/g;
const CAR_PLATE_PATTERN = /\b\d{2,3}\s?[가-힣]\s?\d{4}\b/g;
const STAFF_REFERENCE_PATTERN =
  /([가-힣]{2,4})\s*(직원|알바|매니저|점장|사장님|사장)|직원\s*([가-힣]{2,4})/g;
const PERSONAL_ATTACK_PATTERN =
  /(못생|외모|뚱뚱|마른|대머리|냄새나는 사람|미친 사람|정신병)/;
const DEFAMATION_RISK_PATTERN =
  /(사기꾼|도둑|횡령|전과|범죄자|마약|불륜|성범죄|절도|폭행범)/;
const URGENT_PATTERN =
  /(식중독|배탈|설사|토했|알레르기|이물질|벌레|곰팡이|위생|상했|상한|폭행|다쳤|화상|미끄러|유리조각|(?<!커)피가|응급)/;
const OPERATIONAL_SIGNAL_PATTERN =
  /(대기|기다|직원|응대|불친절|친절|맛|짜다|짜요|짰|짠맛|싱겁|차갑|뜨겁|청결|더럽|위생|화장실|테이블|가격|비싸|양이|소음|시끄|주문|누락|메뉴|재방문|냄새|포장|결제|환불|예약|줄|늦)/;
const SPREADSHEET_FORMULA_PREFIX_PATTERN = /^(?:[\t\r\n]|\s*[=+\-@])/;
const FEEDBACK_CSV_HEADERS = [
  'submittedAt',
  'rating',
  'category',
  'status',
  'risk',
  'comment',
  'action',
];

const CATEGORY_ACTIONS = {
  맛: {
    action: '오늘 대표 메뉴의 간, 온도, 제공 상태를 피크 전 1회 점검하세요.',
    root: '맛/품질 경험이 기대와 다르게 느껴졌을 가능성이 있습니다.',
    staff: '오늘은 첫 제공 온도와 메뉴 설명을 한 번 더 확인해 주세요.',
    metric: '맛 카테고리 3점 이하 비율',
  },
  응대: {
    action: '근무 시작 전 첫 응대 문장과 사과 문장을 직원에게 30초 공유하세요.',
    root: '응대 톤, 설명 부족, 주문 과정의 마찰이 불만으로 남았을 가능성이 있습니다.',
    staff: '오늘은 주문 받을 때 눈맞춤, 확인 멘트, 짧은 사과 문장을 챙겨 주세요.',
    metric: '응대 카테고리 3점 이하 비율',
  },
  청결: {
    action: '오픈 전과 피크 직후 테이블, 화장실, 쇼케이스 체크 시간을 고정하세요.',
    root: '청결 신호는 공개 리뷰로 번지기 쉬워 즉시 현장 확인이 필요합니다.',
    staff: '오늘은 테이블 회전 후 1분 청결 체크를 놓치지 말아 주세요.',
    metric: '청결/위생 위험 신호 수',
  },
  대기: {
    action: '피크 시간 예상 대기 안내 문구와 주문 누락 확인 루틴을 세우세요.',
    root: '기다림 자체보다 안내 부족과 예측 불가능성이 불만을 키웠을 가능성이 있습니다.',
    staff: '오늘은 10분 이상 대기 고객에게 먼저 예상 시간을 알려 주세요.',
    metric: '대기 카테고리 3점 이하 비율',
  },
  가격: {
    action: '가격 불만이 반복되면 양, 구성, 원재료, 세트 혜택 설명 문구를 보강하세요.',
    root: '고객이 가격 대비 가치를 충분히 인식하지 못했을 가능성이 있습니다.',
    staff: '오늘은 추천 메뉴를 말할 때 구성과 양을 함께 설명해 주세요.',
    metric: '가격 카테고리 언급 수',
  },
  소음: {
    action: '혼잡 시간 음악 볼륨과 좌석 간 소음 원인을 1회 점검하세요.',
    root: '공간 체류 경험이 방해받아 재방문 의향이 낮아졌을 가능성이 있습니다.',
    staff: '오늘은 피크 시간 음악 볼륨과 단체석 소음을 한 번 확인해 주세요.',
    metric: '소음 카테고리 언급 수',
  },
  기타: {
    action: '오늘 들어온 낮은 평점 코멘트 1건을 읽고 반복 가능한 운영 태그로 바꾸세요.',
    root: '기타 불만은 아직 고정 카테고리로 분류되지 않은 운영 신호일 수 있습니다.',
    staff: '오늘은 고객이 헷갈릴 만한 안내 문구를 먼저 확인해 주세요.',
    metric: '기타 낮은 평점 수',
  },
};

function clampComment(comment) {
  return String(comment ?? '').trim().slice(0, COMMENT_LIMIT);
}

function hasPattern(pattern, value) {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

function countPattern(pattern, value) {
  pattern.lastIndex = 0;
  return Array.from(value.matchAll(pattern)).length;
}

function inferCategory(inputCategory, comment) {
  if (CATEGORIES.includes(inputCategory)) {
    return inputCategory;
  }

  if (/대기|기다|줄|늦/.test(comment)) return '대기';
  if (/직원|응대|불친절|친절|말투|설명/.test(comment)) return '응대';
  if (/청결|더럽|위생|화장실|테이블|벌레|곰팡이|머리카락|이물질|이물|먼지|쓰레기|냄새나/.test(comment)) return '청결';
  if (/맛|짜다|짜요|짰|짠맛|싱겁|차갑|뜨겁|메뉴|음식|커피|케이크/.test(comment)) return '맛';
  if (/가격|비싸|양이|가성비/.test(comment)) return '가격';
  if (/소음|시끄|음악|소리/.test(comment)) return '소음';

  return '기타';
}

function sanitizeComment(rawComment) {
  return clampComment(rawComment)
    .replace(PHONE_PATTERN, '[연락처 마스킹]')
    .replace(EMAIL_PATTERN, '[이메일 마스킹]')
    .replace(BANK_ACCOUNT_PATTERN, '[계좌 마스킹]')
    .replace(CAR_PLATE_PATTERN, '[차량번호 마스킹]')
    .replace(STAFF_REFERENCE_PATTERN, (match, leadingName, role, trailingName) => {
      const name = leadingName ?? trailingName ?? '';
      return isLikelyPersonName(name) ? '[직원 지칭 마스킹]' : match;
    })
    .replace(PROFANITY_PATTERN, '[표현 가림]');
}

// 사장 표시 본문용 — sanitizeComment가 만든 가림 토큰([연락처 마스킹]·[표현 가림] 등)을 제거한다.
const MASK_TOKEN_PATTERN = /\s*\[[^\]]*(?:마스킹|가림)\]\s*/g;

function isLikelyPersonName(name) {
  // 끝글자가 조사/형용사 관형형 어미(한·인·운·던 = 친절한·이상한·바쁜 등)면 사람 이름이 아니라고 본다.
  // 운영 신호(친절한/불친절한 직원)를 직원 지칭으로 오탐해 가리지 않기 위함.
  return Boolean(name) && !/[고서요도은는이가을를한인운던]$/.test(name);
}

function detectStaffReference(comment) {
  STAFF_REFERENCE_PATTERN.lastIndex = 0;
  for (const match of comment.matchAll(STAFF_REFERENCE_PATTERN)) {
    const name = match[1] ?? match[3] ?? '';
    if (isLikelyPersonName(name)) return true;
  }
  return false;
}

function countStaffReferences(comment) {
  STAFF_REFERENCE_PATTERN.lastIndex = 0;
  let count = 0;
  for (const match of comment.matchAll(STAFF_REFERENCE_PATTERN)) {
    const name = match[1] ?? match[3] ?? '';
    if (isLikelyPersonName(name)) count += 1;
  }
  return count;
}

function calculateAbuseScore(input, previousSubmissions = []) {
  if (!input.deviceKey || !input.submittedAt) return 0;

  const submittedAt = new Date(input.submittedAt).getTime();
  if (Number.isNaN(submittedAt)) return 0;

  let score = 0;

  for (const previous of previousSubmissions) {
    const previousSubmission = previous.submission ?? previous;
    if (previousSubmission.deviceKey !== input.deviceKey) continue;

    const previousAt = new Date(previousSubmission.submittedAt).getTime();
    if (Number.isNaN(previousAt)) continue;

    const minutes = Math.abs(submittedAt - previousAt) / 60000;
    if (minutes <= 2) score += 25;
    else if (minutes <= 10) score += 10;

    if (previousSubmission.qrLocation && previousSubmission.qrLocation === input.qrLocation) {
      score += 5;
    }
  }

  return Math.min(100, score);
}

function buildModeration(input, comment, category, sanitizedComment, abuseScore) {
  const hasProfanity = hasPattern(PROFANITY_PATTERN, comment);
  const hasPii =
    hasPattern(PHONE_PATTERN, comment) ||
    hasPattern(EMAIL_PATTERN, comment) ||
    hasPattern(BANK_ACCOUNT_PATTERN, comment) ||
    hasPattern(CAR_PLATE_PATTERN, comment);
  const hasStaffReference = detectStaffReference(comment);
  const hasDefamationRisk = hasPattern(DEFAMATION_RISK_PATTERN, comment);
  const hasPersonalAttack = hasPattern(PERSONAL_ATTACK_PATTERN, comment);
  const urgentAlert = hasPattern(URGENT_PATTERN, comment);
  const hasOperationalSignal =
    category !== '기타' || hasPattern(OPERATIONAL_SIGNAL_PATTERN, comment) || urgentAlert;

  let exposureStatus = EXPOSURE_STATUS.VISIBLE;
  let includeInStats = true;
  let holdReason = '';

  if (abuseScore >= ABUSE_SCORE_THRESHOLD && !urgentAlert) {
    // 도배는 통계에서 제외하되, 안전·위생 긴급 신호(urgentAlert)는 도배여도 사장이 봐야 하므로 제외하지 않는다.
    // 도배의 통계 왜곡은 기기 기준 카운트(getCategoryRanking)가 이미 무력화한다(차단 아닌 영향 무력화).
    exposureStatus = EXPOSURE_STATUS.SPAM;
    includeInStats = false;
    holdReason = '같은 기기의 단시간 반복 입력(도배 의심)이라 통계와 신호에서 제외';
  } else if (hasProfanity && !hasOperationalSignal && !urgentAlert) {
    exposureStatus = EXPOSURE_STATUS.SPAM;
    includeInStats = false;
    holdReason = '욕설만 있고 운영 신호가 없어 통계에서 제외';
  } else if (hasPii || hasStaffReference || hasDefamationRisk || hasPersonalAttack) {
    exposureStatus = EXPOSURE_STATUS.HELD;
    holdReason = '개인정보, 직원 지칭, 명예훼손 또는 인신공격 위험';
  } else if (hasProfanity || sanitizedComment !== comment) {
    exposureStatus = EXPOSURE_STATUS.SANITIZED;
    holdReason = '운영 신호는 유지하고 표현만 가림';
  }

  return {
    profanityScore: Math.min(100, countPattern(PROFANITY_PATTERN, comment) * 30),
    hasPii,
    hasStaffReference,
    hasDefamationRisk,
    hasPersonalAttack,
    hasOperationalSignal,
    urgentAlert,
    abuseScore,
    exposureStatus,
    includeInStats,
    holdReason,
  };
}

// 가림 내역(사장 화면 하단 메타) — 유형별 건수.
const MASK_META_TYPES = [
  { type: '전화번호', pattern: PHONE_PATTERN },
  { type: '이메일', pattern: EMAIL_PATTERN },
  { type: '계좌번호', pattern: BANK_ACCOUNT_PATTERN },
  { type: '차량번호', pattern: CAR_PLATE_PATTERN },
];

function buildMaskedMeta(comment, moderation) {
  const meta = [];
  for (const { type, pattern } of MASK_META_TYPES) {
    const count = countPattern(pattern, comment);
    if (count > 0) meta.push({ type, count });
  }
  if (moderation.hasStaffReference) {
    const count = countStaffReferences(comment);
    if (count > 0) meta.push({ type: '직원 이름', count });
  }
  const profanityCount = countPattern(PROFANITY_PATTERN, comment);
  if (profanityCount > 0) meta.push({ type: '거친 표현', count: profanityCount });
  return meta;
}

// 사장 화면 본문 — 가림 토큰을 없앤 완결 문장. 운영 신호는 보존하되,
// 명예훼손·인신공격·스팸은 위험 표현 노출을 막기 위해 카테고리 요약으로 닫는다.
function buildCleanSentence(category, sanitizedComment, moderation) {
  if (
    moderation.exposureStatus === EXPOSURE_STATUS.SPAM ||
    moderation.hasDefamationRisk ||
    moderation.hasPersonalAttack
  ) {
    return `${category} 관련 피드백`;
  }
  const cleaned = sanitizedComment
    .replace(MASK_TOKEN_PATTERN, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned.length >= 2 ? cleaned : `${category} 관련 피드백`;
}

function buildInsight(input, category, moderation) {
  const categoryGuide = CATEGORY_ACTIONS[category] ?? CATEGORY_ACTIONS.기타;

  if (moderation.exposureStatus === EXPOSURE_STATUS.SPAM) {
    return {
      primaryComplaint: '운영 신호 없는 장난/욕설 입력',
      rootCauseHypothesis: '운영 개선에 쓸 수 있는 구체 신호가 없어 제외했습니다.',
      reviewRiskLevel: 'excluded',
      recommendedAction: '대응하지 말고 스팸 제외 로그로만 남기세요.',
      staffShareLine: '',
      trackedMetric: '스팸 제외율',
    };
  }

  const rating = Number(input.rating);
  let reviewRiskLevel = 'low';
  if (moderation.urgentAlert || rating <= 2) reviewRiskLevel = 'high';
  else if (rating === 3 || moderation.exposureStatus === EXPOSURE_STATUS.HELD) {
    reviewRiskLevel = 'medium';
  }

  const urgentPrefix = moderation.urgentAlert
    ? '고객 주장 기반 안전/위생 위험 신호입니다. 원문 단정 없이 사실 확인이 먼저 필요합니다. '
    : '';

  return {
    primaryComplaint: category,
    rootCauseHypothesis: `${urgentPrefix}${categoryGuide.root}`,
    reviewRiskLevel,
    recommendedAction: categoryGuide.action,
    staffShareLine: categoryGuide.staff,
    trackedMetric: categoryGuide.metric,
  };
}

export function processFeedback(input, options = {}) {
  const comment = clampComment(input.comment);
  const category = inferCategory(input.category, comment);
  const sanitizedComment = sanitizeComment(comment);
  const submittedAt = input.submittedAt ?? new Date().toISOString();
  const abuseScore = calculateAbuseScore(
    { ...input, submittedAt },
    options.previousSubmissions ?? [],
  );
  const moderation = buildModeration(input, comment, category, sanitizedComment, abuseScore);
  const insight = buildInsight(input, category, moderation);
  const maskedMeta = buildMaskedMeta(comment, moderation);
  const cleanSentence = buildCleanSentence(category, sanitizedComment, moderation);

  return {
    submission: {
      ...input,
      id:
        input.id ??
        // 밀리초(17자)·qrLocation 포함 — 같은 기기가 같은 초에 두 건 남겨도 id 충돌 방지(검수 플래그 오토글 방지).
        `fb-${submittedAt.replace(/[^0-9]/g, '').slice(0, 17)}-${String(input.qrLocation ?? 'q')}-${String(input.deviceKey ?? 'anon')}`,
      category,
      comment,
      sanitizedComment,
      cleanSentence,
      maskedMeta,
      submittedAt,
      abuseScore,
    },
    moderation,
    insight,
  };
}

function getActiveItems(items) {
  return items.filter((item) => item.moderation.includeInStats);
}

function getCategoryRanking(items) {
  const map = new Map();

  items.forEach((item, index) => {
    const category = item.submission.category;
    // 반복 신호는 사람(기기) 기준으로 센다. 한 기기가 같은 카테고리를 여러 번 남겨도 1로 본다.
    // deviceKey 없는 익명 입력은 같은 사람으로 단정할 수 없어 각각 다른 사람으로 센다(과소집계 방지).
    const deviceKey = item.submission.deviceKey ?? `anon-${index}`;
    const rating = Number(item.submission.rating || 3);
    const current = map.get(category) ?? {
      category,
      devices: new Set(),
      urgentDevices: new Set(),
      lowRatingDevices: new Set(),
      totalSeverity: 0,
      severitySamples: 0,
    };
    current.devices.add(deviceKey);
    current.totalSeverity += Math.max(1, 6 - rating);
    current.severitySamples += 1;
    if (item.moderation.urgentAlert) current.urgentDevices.add(deviceKey);
    if (rating <= 2) current.lowRatingDevices.add(deviceKey);
    map.set(category, current);
  });

  return Array.from(map.values())
    .map((entry) => ({
      category: entry.category,
      count: entry.devices.size,
      urgentCount: entry.urgentDevices.size,
      lowRatingCount: entry.lowRatingDevices.size,
      averageSeverity: Math.round((entry.totalSeverity / entry.severitySamples) * 10) / 10,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.urgentCount !== a.urgentCount) return b.urgentCount - a.urgentCount;
      return b.averageSeverity - a.averageSeverity;
    });
}

function buildSafeComment(item) {
  const text =
    item.moderation.exposureStatus === EXPOSURE_STATUS.HELD
      ? `${item.submission.category} 관련 민감 표현 포함 피드백 1건`
      : item.submission.sanitizedComment || `${item.submission.category} 선택 피드백`;

  return {
    id: item.submission.id,
    rating: item.submission.rating,
    category: item.submission.category,
    qrLocation: item.submission.qrLocation,
    submittedAt: item.submission.submittedAt,
    exposureStatus: item.moderation.exposureStatus,
    reviewRiskLevel: item.insight.reviewRiskLevel,
    urgentAlert: item.moderation.urgentAlert,
    text,
    recommendedAction: item.insight.recommendedAction,
  };
}

// 콜드스타트 분기에서 신호가 없는 상태(loading·error·empty)가 공유하는 기본 골격.
// 0건에 '기타' 기본 액션이 새어 나오지 않도록 todayAction·staffShareLine은 빈 문자열로 둔다.
function buildDashboardShell(state, storeName, now, overrides = {}) {
  return {
    storeName,
    generatedAt: now,
    state,
    responseCount: 0,
    filteredCount: 0,
    riskSignalCount: 0,
    urgentCount: 0,
    highRiskCount: 0,
    topPainPoints: [],
    todayAction: '',
    staffShareLine: '',
    trackedMetric: '',
    notice: '',
    emptyState: null,
    riskAlerts: [],
    safeComments: [],
    weeklyReport: {
      categoryRanking: [],
      filteredCount: 0,
      repeatedPainPoint: '아직 없음',
    },
    ...overrides,
  };
}

export function buildOwnerDashboard(items = [], options = {}) {
  const now = options.now ?? new Date().toISOString();
  const storeName = options.storeName ?? DEFAULT_STORE_NAME;

  if (options.loading) {
    return buildDashboardShell('loading', storeName, now, {
      notice: '피드백을 불러오는 중이에요.',
    });
  }
  if (options.error) {
    return buildDashboardShell('error', storeName, now, {
      notice: '피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
      error: String(options.error),
    });
  }

  const activeItems = getActiveItems(items);
  const filteredItems = items.filter((item) => !item.moderation.includeInStats);

  if (activeItems.length === 0) {
    return buildDashboardShell('empty', storeName, now, {
      filteredCount: filteredItems.length,
      emptyState: {
        reason: '아직 도착한 손님 목소리가 없어요.',
        nextAction: '테이블과 계산대에 QR 포스터를 붙여 손님이 한마디 남기게 해보세요.',
      },
      weeklyReport: {
        categoryRanking: [],
        filteredCount: filteredItems.length,
        repeatedPainPoint: '아직 없음',
      },
    });
  }

  const state = activeItems.length <= SPARSE_THRESHOLD ? 'sparse' : 'normal';
  const topPainPoints = getCategoryRanking(activeItems);
  const primaryCategory = topPainPoints[0]?.category ?? '기타';
  const primaryGuide = CATEGORY_ACTIONS[primaryCategory] ?? CATEGORY_ACTIONS.기타;
  const highRiskItems = activeItems.filter((item) => item.insight.reviewRiskLevel === 'high');
  const urgentItems = activeItems.filter((item) => item.moderation.urgentAlert);

  return {
    storeName,
    generatedAt: now,
    state,
    responseCount: activeItems.length,
    filteredCount: filteredItems.length,
    riskSignalCount: highRiskItems.length,
    urgentCount: urgentItems.length,
    highRiskCount: highRiskItems.length,
    topPainPoints,
    todayAction: primaryGuide.action,
    staffShareLine: primaryGuide.staff,
    trackedMetric: primaryGuide.metric,
    notice:
      state === 'sparse'
        ? '첫 목소리가 도착했어요. 아직 수가 적어 추세 대신 개별 신호로 보여드려요.'
        : '',
    emptyState: null,
    riskAlerts: highRiskItems.map((item) => ({
      id: item.submission.id,
      category: item.submission.category,
      rating: item.submission.rating,
      message: item.moderation.urgentAlert
        ? '고객 주장 기반 안전/위생 위험 신호'
        : '공개 리뷰로 번질 수 있는 낮은 평점 신호',
      action: item.insight.recommendedAction,
    })),
    safeComments: activeItems
      .slice()
      .sort((a, b) => new Date(b.submission.submittedAt) - new Date(a.submission.submittedAt))
      .map(buildSafeComment),
    weeklyReport: {
      categoryRanking: topPainPoints,
      filteredCount: filteredItems.length,
      repeatedPainPoint: primaryCategory,
    },
  };
}

export function buildDailyDigest(items = [], options = {}) {
  const dashboard = buildOwnerDashboard(items, options);
  const date = DIGEST_DATE_FORMATTER.format(new Date(dashboard.generatedAt));
  const riskLine = dashboard.highRiskCount
    ? `공개 리뷰 위험 신호: ${dashboard.highRiskCount}건`
    : '공개 리뷰 위험 신호: 없음';
  const urgentLine = dashboard.urgentCount
    ? `긴급 확인: 고객 주장 기반 안전/위생 신호 ${dashboard.urgentCount}건`
    : '긴급 확인: 없음';

  // 신호가 없는 상태(0건·로딩·오류)에서는 빈 액션 라벨을 노출하지 않고 상태 안내로 닫는다.
  if (dashboard.state !== 'normal' && dashboard.state !== 'sparse') {
    const stateMessage =
      {
        empty: '아직 도착한 손님 목소리가 없어요. 테이블과 계산대에 QR 포스터를 붙여 첫 한마디를 받아보세요.',
        loading: '피드백을 불러오는 중이에요.',
        error: '피드백을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.',
      }[dashboard.state] ?? '표시할 피드백이 없어요.';
    return {
      subject: `[${dashboard.storeName}] ${date} VOC 아침 요약`,
      body: [
        `${dashboard.storeName} 어제/오늘 VOC 요약`,
        `유효 응답: ${dashboard.responseCount}건, 제외 입력: ${dashboard.filteredCount}건`,
        stateMessage,
      ].join('\n'),
    };
  }

  return {
    subject: `[${dashboard.storeName}] ${date} VOC 아침 요약`,
    body: [
      `${dashboard.storeName} 어제/오늘 VOC 요약`,
      `유효 응답: ${dashboard.responseCount}건, 제외 입력: ${dashboard.filteredCount}건`,
      riskLine,
      urgentLine,
      `반복 불만: ${dashboard.topPainPoints[0]?.category ?? '아직 없음'}`,
      `오늘 액션: ${dashboard.todayAction}`,
      `직원 공유: ${dashboard.staffShareLine}`,
      `추적 지표: ${dashboard.trackedMetric}`,
    ].join('\n'),
  };
}

function escapeCsvCell(cell) {
  const value = String(cell ?? '');
  const guardedValue = SPREADSHEET_FORMULA_PREFIX_PATTERN.test(value) ? `'${value}` : value;
  return `"${guardedValue.replaceAll('"', '""')}"`;
}

export function buildFeedbackCsv(items = []) {
  const rows = [
    FEEDBACK_CSV_HEADERS,
    ...items.map((item) => [
      item.submission.submittedAt,
      item.submission.rating,
      item.submission.category,
      item.moderation.exposureStatus,
      item.insight.reviewRiskLevel,
      item.submission.sanitizedComment,
      item.insight.recommendedAction,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function getSeedFeedback() {
  return [
    processFeedback({
      storeId: 'demo-cafe',
      qrLocation: 'table-4',
      rating: 1,
      category: '대기',
      comment: '대기 25분 넘었고 안내가 없어서 답답했어요',
      submittedAt: '2026-05-06T03:10:00.000Z',
      deviceKey: 'seed-a',
    }),
    processFeedback({
      storeId: 'demo-cafe',
      qrLocation: 'counter',
      rating: 2,
      category: '응대',
      comment: '주문할 때 설명이 너무 빨라서 메뉴 선택이 어려웠습니다',
      submittedAt: '2026-05-06T04:35:00.000Z',
      deviceKey: 'seed-b',
    }),
    processFeedback({
      storeId: 'demo-cafe',
      qrLocation: 'table-1',
      rating: 4,
      category: '맛',
      comment: '라떼 맛은 좋았고 다음에도 올 것 같아요',
      submittedAt: '2026-05-06T05:20:00.000Z',
      deviceKey: 'seed-c',
    }),
    processFeedback({
      storeId: 'demo-cafe',
      qrLocation: 'table-2',
      rating: 1,
      category: '청결',
      comment: '화장실 위생이 아쉬웠고 테이블도 끈적했어요',
      submittedAt: '2026-05-06T06:00:00.000Z',
      deviceKey: 'seed-d',
    }),
  ];
}
