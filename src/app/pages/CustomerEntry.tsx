import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { RetroWindow } from "../components/retro/RetroWindow";
import { RetroButton } from "../components/retro/RetroButton";
import { RetroTextarea } from "../components/retro/RetroField";
import { RetroProgress } from "../components/retro/RetroProgress";
import { PixelCat, type CatExpression } from "../components/mascots/PixelCat";
import { PixelTree } from "../components/mascots/PixelTree";
import { PixelGarden } from "../components/mascots/PixelGarden";
import { type TreeLevel } from "../lib/tree";
import {
  fetchStoreBySlug,
  fetchStoreSlime,
  insertFeedback,
  getDeviceKey,
  hashDeviceKey,
  fetchThreadByToken,
} from "../../lib/supabase-client.js";
import { processFeedback } from "../../lib/voc-engine.js";
import { FOLLOW_UP_CHIPS, shouldAskFollowUp } from "../../lib/guest-form-flow.js";
import {
  genClaimToken,
  getSafeCleanContent,
  getDbUrgency,
  estimateSentimentScore,
  resolveTree,
  saveReceipt,
  getSavedReceipt,
  tooSoonToResubmit,
  markSubmitted,
  getRateLimitMessage,
} from "../lib/customer";

type Store = { id: string; slug: string; display_name: string };
type Mode = "loading" | "invalid" | "form" | "done" | "thread";
type ThreadData = {
  feedback?: { content_clean?: string } | null;
  responses?: { id: string; body: string }[];
};

const RATING_HINTS: Record<number, string> = {
  1: "많이 아쉬우셨군요. 어떤 점인지 알려주시면 큰 도움이 돼요.",
  2: "아쉬운 점이 있으셨네요. 한마디 남겨주시면 좋아요.",
  3: "평가 감사합니다.",
  4: "좋게 봐주셔서 감사합니다.",
  5: "최고로 봐주셔서 감사합니다.",
};

// 별점 → 고양이 표정 (15표정 안에서 풍부하게 매핑)
// 하트(love)는 최고점에만 — 4·5 하트 겹침 해소, 3은 심심한 default 대신 wink로 생기.
const STAR_EXPR: Record<number, CatExpression> = {
  0: "sleepy",
  1: "sad",
  2: "surprised",
  3: "wink",
  4: "wave",
  5: "love",
};

// 후속 칩 팝색 순환 (grape·sky·aqua·pink·coral·sun)
// Tailwind v4 소스 스캔용 — 클래스 문자열은 반드시 리터럴로 둔다(동적 보간 금지).
const CHIP_POP_ON = [
  "bg-grape text-grape-foreground",
  "bg-sky text-sky-foreground",
  "bg-aqua text-aqua-foreground",
  "bg-pink text-pink-foreground",
  "bg-coral text-coral-foreground",
  "bg-sun text-sun-foreground",
] as const;

// 무기명 마퀴 배너 한 묶음 (루프 이음매를 위해 2회 반복해서 렌더)
function MarqueeUnit() {
  return (
    <span className="font-mono text-caption font-bold tracking-wide">
      <span className="text-sun">★ ANONYMOUS</span>
      <span className="text-card"> ▚ </span>
      <span className="text-coral">NO NAME</span>
      <span className="text-card"> ▚ </span>
      <span className="text-lime">NO NUMBER</span>
      <span className="text-card"> ▚ </span>
      <span className="text-sky">JUST HONEST</span>
      <span className="text-card"> ▚ </span>
    </span>
  );
}

export function CustomerEntry() {
  const [params] = useSearchParams();
  const slug = params.get("store") || "";
  const token = params.get("token") || "";

  const [mode, setMode] = useState<Mode>("loading");
  const [store, setStore] = useState<Store | null>(null);
  const [treeLevel, setTreeLevel] = useState<TreeLevel>(1);
  const [revisitToken, setRevisitToken] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [threadFailed, setThreadFailed] = useState(false);

  // 폼 상태
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 완료 상태
  const [receiptUrl, setReceiptUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      if (!slug) {
        setMode("invalid");
        return;
      }
      // 스레드 모드 (스레드 토큰)
      if (token) {
        let s: Store | null = null;
        try { s = await fetchStoreBySlug(slug); } catch { /* 이름만 — 실패 무시 */ }
        setStore(s);
        try {
          const payload = await fetchThreadByToken(token);
          setThread(payload as ThreadData);
        } catch {
          setThreadFailed(true);
        }
        setMode("thread");
        return;
      }
      // 폼 모드
      let s: Store | null = null;
      try { s = await fetchStoreBySlug(slug); } catch { s = null; }
      if (!s) {
        setMode("invalid");
        return;
      }
      setStore(s);
      setMode("form");
      // 재방문 배지
      const saved = getSavedReceipt(slug);
      if (saved?.token) setRevisitToken(saved.token);
      // 매장 나무 단계 (부가 — 실패해도 폼 동작)
      try {
        const slimeRow = await fetchStoreSlime(s.id);
        setTreeLevel(resolveTree(slimeRow).level);
      } catch { /* 나무는 부가 표면 */ }
    })();
  }, [slug, token]);

  const display = hover || rating;
  const catExpr: CatExpression = STAR_EXPR[display] ?? "default";

  const toggleChip = (c: string) => setCategory((prev) => (prev === c ? "" : c));

  async function submit() {
    setError("");
    if (rating < 1) {
      setError("별을 눌러 평가해 주세요.");
      return;
    }
    if (note.length > 500) {
      setError("한마디는 500자까지 남길 수 있어요.");
      return;
    }
    if (tooSoonToResubmit()) {
      setError("조금 빠르게 다시 누르셨어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!store) return;

    setSubmitting(true);
    try {
      const raw = note.trim();
      const deviceKey = getDeviceKey();
      const result = processFeedback({
        comment: raw,
        rating,
        category: category || undefined,
        deviceKey,
      });
      const hash = await hashDeviceKey(deviceKey);
      const claimToken = genClaimToken();

      const inserted = await insertFeedback({
        store_id: store.id,
        content_clean: getSafeCleanContent(result, raw, rating),
        content_raw: raw,
        sentiment_score: result.insight?.sentimentScore ?? estimateSentimentScore(rating, raw),
        urgency: getDbUrgency(result),
        categories: [result.submission?.category || "기타"],
        claim_token: claimToken,
        pii_removed: !!result.moderation?.hasPii,
        profanity_removed: Number(result.moderation?.profanityScore || 0) > 0,
        device_hash: hash,
      });

      markSubmitted();
      const usableToken = inserted?.claim_token || claimToken;
      if (usableToken) {
        const url = `${location.origin}/s?store=${encodeURIComponent(slug)}&token=${encodeURIComponent(usableToken)}`;
        setReceiptUrl(url);
        saveReceipt(slug, usableToken);
      }
      confetti({
        particleCount: 36,
        spread: 55,
        startVelocity: 28,
        scalar: 0.7,
        origin: { y: 0.4 },
        colors: ["#1b6b42", "#3e8e63", "#6fae8a"],
      });
      setMode("done");
    } catch (err) {
      const rateMsg = getRateLimitMessage(err);
      setError(rateMsg || "전달 중 오류가 났어요. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 클립보드 불가 — 사용자가 직접 선택 복사 */ }
  }

  // ── 렌더 ────────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="retro-desktop retro-desktop-dots min-h-screen">
        <main className="mx-auto max-w-[440px] px-4 py-16">
          <RetroWindow title="voxpop.exe">
            <p className="text-display-mono text-body-lg text-foreground">
              <span className="text-primary">&gt;_ </span>매장 정보를 불러오는 중<span className="vox-cursor ml-1 text-coral">█</span>
            </p>
          </RetroWindow>
        </main>
      </div>
    );
  }

  if (mode === "invalid") {
    return (
      <div className="retro-desktop retro-desktop-dots min-h-screen">
        <main className="mx-auto max-w-[440px] px-4 py-12">
          <RetroWindow title="voxpop.exe — 잘못된 링크">
            <div className="flex flex-col items-center gap-3 py-3 text-center">
              <div className="w-24">
                <PixelCat expression="sad" anim="sway" />
              </div>
              <span className="sticky-card sticky-card--urgent vox-sticker px-3 py-1 font-mono text-caption font-bold">
                LINK_NOT_FOUND
              </span>
              <p className="text-display-mono text-body-lg text-foreground">
                매장 정보를 찾을 수 없어요
              </p>
              <p className="font-mono text-body text-muted-foreground">
                QR 코드를 다시 확인해 주세요.
              </p>
              <Link to="/" className="mt-2 font-mono text-body text-primary underline-offset-4 hover:underline">
                ← voxpop 소개
              </Link>
            </div>
          </RetroWindow>
        </main>
      </div>
    );
  }

  if (mode === "thread") {
    const replyCount = thread?.responses?.length ?? 0;
    return (
      <div className="retro-desktop retro-desktop-dots min-h-screen">
        <main className="mx-auto max-w-[560px] px-4 py-8">
        <RetroWindow
          title={`voxpop.exe — ${store?.display_name || "우리가게"} 내 한마디`}
          status={["스레드 링크 전용 · 무기명", threadFailed ? "조회 실패" : `사장님 답 ${replyCount}개`]}
        >
          {threadFailed ? (
            <div className="space-y-4 py-1 text-body-lg leading-relaxed text-muted-foreground">
              <p>
                이 링크로 한마디를 찾을 수 없어요. 다른 기기에서 저장된 링크이거나 링크 일부가
                잘렸을 수 있어요. voxpop은 무기명이라 링크 없이는 찾아드릴 수 없어요.
              </p>
              <Link
                to={`/s?store=${encodeURIComponent(slug)}`}
                className="retro-btn retro-btn--primary retro-btn--cta inline-block px-4 py-2.5 font-mono text-body-lg font-bold"
              >
                <span className="inline-flex items-center gap-1.5">새 한마디 남기기 →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 내 한마디 — 손님(pink·익명 고양이) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 shrink-0">
                    <PixelCat expression="write" anim="breathe" />
                  </div>
                  <span className="sticky-card sticky-card--pink vox-sticker px-2.5 py-0.5 font-mono text-caption font-bold">
                    익명 고양이 (나)
                  </span>
                </div>
                <div className="border-bold shadow-hard-sm bg-pink px-3.5 py-3 text-body-lg leading-relaxed text-pink-foreground">
                  {thread?.feedback?.content_clean || "한마디를 찾을 수 없어요."}
                </div>
              </div>
              {/* 사장님 답 — 매장(green·나무) */}
              {thread?.responses?.length ? (
                thread.responses.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="ml-6 flex items-center gap-2">
                      <div className="w-9 shrink-0">
                        <PixelTree level={treeLevel} />
                      </div>
                      <span className="sticky-card sticky-card--good vox-sticker--r px-2.5 py-0.5 font-mono text-caption font-bold">
                        사장님
                      </span>
                    </div>
                    <div className="border-bold shadow-hard-sm ml-6 bg-card px-3.5 py-3 text-body-lg leading-relaxed text-foreground">
                      <span className="mr-1 font-mono font-bold text-primary">→</span>
                      {r.body}
                    </div>
                  </div>
                ))
              ) : (
                <div className="sticky-card sticky-card--info px-3.5 py-3 font-mono text-body leading-relaxed">
                  아직 사장님 답이 없어요. 사장님이 답을 남기면 이 링크에서 볼 수 있어요.
                </div>
              )}
              <p className="text-display-mono text-caption leading-relaxed text-muted-foreground">
                <span className="text-primary">›</span> 이 대화는 스레드 링크로만 열려요. 사장님은 누가 썼는지 끝까지 모릅니다.
                <span className="vox-cursor ml-1 text-coral">█</span>
              </p>
            </div>
          )}
        </RetroWindow>
        <Link
          to={`/s?store=${encodeURIComponent(slug)}`}
          className="retro-btn retro-btn--primary retro-btn--cta mt-5 block px-4 py-3 text-center font-mono text-body-lg font-bold"
        >
          <span className="inline-flex w-full items-center justify-center gap-1.5">한마디 더 남기기 →</span>
        </Link>
        <Link to="/" className="mt-3 block text-center font-mono text-body text-muted-foreground underline-offset-4 hover:underline">
          ← voxpop 소개
        </Link>
        </main>
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="retro-desktop retro-desktop-dots min-h-screen">
        <main className="mx-auto max-w-[440px] px-4 py-10">
        <RetroWindow
          title="voxpop.exe — 전달 완료"
          status={["무기명으로 전달됨", "사장님에게만 보여요"]}
        >
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            {/* 축하 폭발 — 고양이 celebrate + bounce + 스파클 + 적립 스티커 */}
            <div className="relative">
              <span className="vox-sparkle absolute -left-3 -top-2 text-2xl text-sun" aria-hidden>✦</span>
              <span className="vox-sparkle absolute -right-2 top-2 text-xl text-coral" style={{ animationDelay: "0.4s" }} aria-hidden>✧</span>
              <span className="vox-sparkle absolute -bottom-1 left-4 text-lg text-grape" style={{ animationDelay: "0.8s" }} aria-hidden>◆</span>
              <span className="vox-sparkle absolute -right-4 bottom-3 text-xl text-aqua" style={{ animationDelay: "0.2s" }} aria-hidden>✶</span>
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 12 }}
                className="w-28"
              >
                <PixelCat expression="celebrate" anim="bounce" />
              </motion.div>
              <motion.span
                initial={{ y: 8, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 13 }}
                className="sticky-card sticky-card--reward vox-sticker--r absolute -right-6 -top-3 px-3 py-1 font-mono text-body font-bold"
              >
                🌱 +1 적립!
              </motion.span>
            </div>

            <p className="text-display-mono text-title-sm text-foreground">
              <span className="text-primary">&gt;_ </span>고마워요!<span className="vox-cursor ml-1 text-coral">█</span>
            </p>
            <p className="text-body-lg leading-relaxed text-foreground">읽고 진짜 바뀝니다.</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="bg-ink text-card vox-sticker border-bold shadow-hard-sm px-2.5 py-1 font-mono text-caption font-bold">device=null</span>
              <span className="sticky-card sticky-card--good vox-sticker--r px-2.5 py-1 font-mono text-caption font-bold">익명 100%</span>
            </div>

            {/* 매장 나무 — 한 단계 더 자란 보상감 */}
            <div className="my-1 w-24">
              <PixelTree level={treeLevel} />
            </div>

            {/* 스레드 링크 — sky/info 톤 */}
            {receiptUrl && (
              <div className="sticky-card sticky-card--info w-full p-3 text-left">
                <p className="text-display-mono text-caption font-bold">
                  // 사장님 답이 궁금하면 이 링크를 저장하세요
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    to={`/s?store=${encodeURIComponent(slug)}&token=${encodeURIComponent(receiptUrl.split("token=")[1] || "")}`}
                    className="flex-1 truncate font-mono text-body font-bold text-sky-foreground underline-offset-2 hover:underline"
                  >
                    › 내 한마디에 사장님 답 보기 →
                  </Link>
                  <RetroButton variant="primary" onClick={copyReceipt} className="shrink-0 px-2 py-1 text-caption">
                    {copied ? "복사됨!" : "링크 복사"}
                  </RetroButton>
                </div>
                <p className="mt-2 font-mono text-caption leading-relaxed text-sky-foreground/80">
                  이름·연락처 없이 이 링크로만 본인 한마디의 답을 볼 수 있어요.
                </p>
              </div>
            )}

            <Link to="/" className="mt-1 font-mono text-body text-muted-foreground underline-offset-4 hover:underline">
              홈으로
            </Link>
          </div>
        </RetroWindow>
        </main>
      </div>
    );
  }

  // mode === "form"
  return (
    <div className="retro-desktop retro-desktop-dots min-h-screen">
      <main className="mx-auto max-w-[440px] px-4 py-8">
      {/* 무기명 보안 스티커 — coral 팝색, 자랑스럽게 */}
      <div className="mb-4 flex justify-center">
        <span className="sticky-card sticky-card--urgent vox-sticker px-3 py-1.5 font-mono text-caption font-bold">
          🔒 이름·번호 안 받아요 · 자동 가림 ON
        </span>
      </div>

      {revisitToken && (
        <div className="sticky-card sticky-card--info mb-4 flex items-center justify-between gap-2 px-3 py-2">
          <Link
            to={`/s?store=${encodeURIComponent(slug)}&token=${encodeURIComponent(revisitToken)}`}
            className="font-mono text-body font-bold text-sky-foreground underline-offset-2 hover:underline"
          >
            › 지난 한마디에 사장님 답 보기
          </Link>
          <button
            type="button"
            onClick={() => setRevisitToken(null)}
            className="retro-focus font-mono text-caption text-sky-foreground/70 hover:text-sky-foreground"
            aria-label="배지 닫기"
          >
            ✕
          </button>
        </div>
      )}

      <RetroWindow
        title={`voxpop.exe — ${store?.display_name || "우리가게"}`}
        status={["🔒 무기명 전송", "👁 자동 가림 ON"]}
      >
        {/* 별점↔표정 고양이 — 베벨 박스 안에서 즉각 반응 */}
        <div className="flex flex-col items-center gap-3 py-1 text-center">
          <div className="bevel-in-thin bg-sky px-4 py-3">
            <div className="w-20">
              <PixelCat expression={catExpr} anim={display >= 4 ? "bounce" : "breathe"} />
            </div>
          </div>
          <p className="text-display-mono text-title-sm text-foreground">
            <span className="text-primary">&gt;_ </span>오늘 어떠셨어요?
          </p>
        </div>

        {/* 무기명 마퀴 배너 (잉크 바 · 2회 반복으로 이음매 없음) */}
        <div className="bg-ink mt-3 overflow-hidden py-1.5 vox-marquee">
          <div className="vox-marquee__track">
            <MarqueeUnit />
            <MarqueeUnit />
          </div>
        </div>

        {/* 별점 — 크고 통통하게, 선택 시 통 튀어오름 */}
        <div className="mt-4 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = n <= display;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n}점`}
                className="retro-focus flex min-h-[44px] min-w-[44px] items-center justify-center px-2 py-1.5 text-4xl leading-none transition-transform"
                style={{
                  color: on ? "var(--sun)" : "var(--card)",
                  textShadow: "1.5px 1.5px 0 var(--ink), -1.5px -1.5px 0 var(--ink), 1.5px -1.5px 0 var(--ink), -1.5px 1.5px 0 var(--ink)",
                  transform: on ? "translateY(-2px) scale(1.1)" : "none",
                }}
              >
                ★
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center font-mono text-caption" style={{ color: error && rating < 1 ? "var(--destructive)" : undefined }}>
          <span className="text-muted-foreground">
            {rating ? RATING_HINTS[rating] : "별을 눌러 평가해 주세요"}
          </span>
        </p>

        {/* 후속 칩 (1~3점) — 팝색 순환 */}
        {rating > 0 && shouldAskFollowUp({ rating }) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5">
            <p className="font-mono text-body font-bold text-foreground">⚙ 어떤 점이 아쉬우셨어요? (선택)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FOLLOW_UP_CHIPS.map((c: { label: string; category: string }, i: number) => {
                const on = category === c.category;
                const popOn = CHIP_POP_ON[i % CHIP_POP_ON.length];
                return (
                  <button
                    key={c.category}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleChip(c.category)}
                    className={`pop-btn pop-btn--sm retro-focus border-bold whitespace-nowrap px-3 py-1.5 font-mono text-caption font-bold ${
                      on ? `${popOn} translate-x-[2px] translate-y-[2px]` : "shadow-hard-sm bg-card text-muted-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 한마디 (선택) — 별점 전에도 항상 열림 */}
        {(
          <div className="mt-5">
            <p className="font-mono text-body font-bold text-foreground">💬 한마디 (선택)</p>
            <RetroTextarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="남기고 싶은 한마디가 있다면 적어 주세요. 위험한 말·개인정보는 자동으로 가려져요."
              className="mt-2"
            />
            <p className="text-right font-mono text-caption text-muted-foreground/70">{note.length} / 500</p>
          </div>
        )}

        {error && (
          <p className="bevel-in-thin mt-3 bg-secondary px-3 py-2 font-mono text-body text-destructive">
            {error}
          </p>
        )}

        <RetroButton
          variant="primary"
          cta
          onClick={submit}
          disabled={rating === 0 || submitting}
          className="mt-4 w-full"
        >
          {rating === 0 ? "먼저 별점을 매겨주세요" : submitting ? "보내는 중…" : "사장님에게 전달하기 →"}
        </RetroButton>
      </RetroWindow>

      {/* 매장 나무 — 잉크 타이틀바 + 고양이가 가꾸는 합성 씬 */}
      <div className="border-bold shadow-hard-sm mt-5 overflow-hidden bg-card">
        <div className="retro-titlebar--ink flex items-center justify-between px-3 py-1.5">
          <span className="font-mono text-caption font-bold tracking-wide">🌳 MY_TREE.EXE</span>
          <span className="sticky-card sticky-card--reward vox-sticker--r px-2 py-0.5 font-mono text-[11px] font-bold">
            LV.{treeLevel}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 px-4 py-5">
          <div className="w-24">
            <PixelGarden level={treeLevel} />
          </div>
          <RetroProgress value={treeLevel} max={6} label="나무 성장 단계" className="retro-progress--growth w-full max-w-[220px]" />
          <p className="font-mono text-caption text-muted-foreground">
            이 가게의 나무 · 한마디가 쌓일수록 자랍니다
          </p>
        </div>
      </div>

      <Link to="/" className="mt-4 block text-center font-mono text-body text-muted-foreground underline-offset-4 hover:underline">
        ← voxpop 소개
      </Link>
      </main>
    </div>
  );
}
