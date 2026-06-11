import type { CatCostume } from "../components/mascots/PixelCat";

/** Weekly signal bars shown on landing demo + owner dashboard. */
export const weeklySignals: { label: string; value: number; max: number }[] = [
  { label: "맛", value: 8, max: 10 },
  { label: "친절", value: 9, max: 10 },
  { label: "청결", value: 5, max: 10 },
  { label: "대기", value: 4, max: 10 },
  { label: "가격", value: 7, max: 10 },
];

/** "오늘 할 일" — one-line actions derived from masked feedback. */
export const todayActions: {
  id: string;
  text: string;
  urgent: boolean;
  basis: string;
}[] = [
  {
    id: "a1",
    text: "화장실 청결 점검 — 비누·휴지 보충",
    urgent: true,
    basis: "청결 신호 2일 연속 하락",
  },
  {
    id: "a2",
    text: "피크타임 대기 안내 문구 입구에 부착",
    urgent: false,
    basis: "대기 관련 한마디 4건",
  },
  {
    id: "a3",
    text: "아메리카노 농도 확인 — 최근 연하다는 신호",
    urgent: false,
    basis: "맛 신호 미세 하락",
  },
];

export type FeedbackCard = {
  id: string;
  rating: number;
  /** Always the masked body — owner never sees the original. */
  masked: string;
  chips: string[];
  time: string; // relative only
  urgent: boolean;
  resolved: boolean;
};

export const feedbackCards: FeedbackCard[] = [
  {
    id: "f1",
    rating: 2,
    masked: "화장실에 ████ 없어서 좀 ████했어요. 그것만 빼면 커피는 좋아요.",
    chips: ["청결"],
    time: "방금 전",
    urgent: true,
    resolved: false,
  },
  {
    id: "f2",
    rating: 3,
    masked: "점심에 사람 많을 때 ████ 얼마나 기다려야 하는지 몰라서 ████.",
    chips: ["대기"],
    time: "1시간 전",
    urgent: false,
    resolved: false,
  },
  {
    id: "f3",
    rating: 5,
    masked: "사장님 ████ 너무 친절하세요. 단골 됩니다 :)",
    chips: ["친절"],
    time: "3시간 전",
    urgent: false,
    resolved: true,
  },
  {
    id: "f4",
    rating: 4,
    masked: "라떼 맛있어요. 다만 오늘 아메리카노는 살짝 ████했어요.",
    chips: ["맛"],
    time: "어제",
    urgent: false,
    resolved: false,
  },
];

export type ThreadMessage = {
  id: string;
  from: "customer" | "owner";
  rating?: number;
  body: string;
  note?: string;
  time: string;
};

export const threadMessages: ThreadMessage[] = [
  {
    id: "t1",
    from: "customer",
    rating: 2,
    body: "화장실에 ████ 없어서 좀 ████했어요. 그것만 빼면 커피는 좋아요.",
    note: "욕설·개인정보는 자동으로 가려져 전달됐어요.",
    time: "2일 전",
  },
  {
    id: "t2",
    from: "owner",
    body: "알려주셔서 감사해요. 바로 비품 채워 넣었고, 매일 오픈 전 점검하기로 했습니다. 덕분에 가게가 한 뼘 자랐어요.",
    time: "1일 전",
  },
];

export type ClosetItem = {
  id: CatCostume;
  name: string;
  owned: boolean;
  cost: number; // fish tokens
  locked?: boolean;
};

export const fishTokens = 12;

export const closet: ClosetItem[] = [
  { id: "none", name: "기본 고양이", owned: true, cost: 0 },
  { id: "ribbon", name: "리본", owned: true, cost: 3 },
  { id: "beret", name: "베레모", owned: false, cost: 6 },
  { id: "tuxedo", name: "턱시도", owned: false, cost: 8 },
  { id: "crown", name: "왕관 고양이", owned: false, cost: 20, locked: true },
];

/** Regret chips offered on low (1–3) ratings in the customer form. */
export const regretChips = [
  "대기 시간",
  "청결",
  "맛/온도",
  "친절도",
  "가격",
  "주차",
  "소음",
];
