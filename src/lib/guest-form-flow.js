// 이 파일은 src/guestFormFlow.js의 배포용 스냅샷입니다. src 수정 시 여기도 복사하세요(vocEngine과 동일 규칙).
// 손님 폼의 순수 결정 로직 — DOM·네트워크 의존 없음(zero-dependency, 테스트 가능).
// (1) 별점·칩으로 후속 질문을 보일지 판정
// (2) 후속 칩 라벨을 엔진 category 힌트로 매핑
// 엔진 카테고리(lib/voc-engine.js CATEGORIES): 맛·응대·청결·대기·가격·소음·기타

export const FOLLOW_UP_CHIPS = [
  { label: '맛', category: '맛' },
  { label: '응대', category: '응대' },
  { label: '청결', category: '청결' },
  { label: '대기', category: '대기' },
  { label: '가격', category: '가격' },
  { label: '소음', category: '소음' },
];

export function shouldAskFollowUp(input = {}) {
  const rating = Number(input.rating) || 0;
  return rating >= 1 && rating <= 3;
}

export function mapFollowUpToCategory(label) {
  const found = FOLLOW_UP_CHIPS.find((chip) => chip.label === label);
  return found ? found.category : null;
}
