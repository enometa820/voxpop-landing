import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { PixelCat } from "../components/mascots/PixelCat";
import { PixelTree, type TreeLevel } from "../components/mascots/PixelTree";
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
      // 스레드 모드 (영수증 토큰)
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
  const catExpr = display >= 4 ? "happy" : display > 0 ? "default" : "sleepy";

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
      <main className="mx-auto max-w-[440px] px-4 py-16">
        <TerminalWindow title="voxpop">
          <p className="text-muted-foreground">
            매장 정보를 불러오는 중<span className="vox-cursor ml-1 text-primary">█</span>
          </p>
        </TerminalWindow>
      </main>
    );
  }

  if (mode === "invalid") {
    return (
      <main className="mx-auto max-w-[440px] px-4 py-12">
        <TerminalWindow title="voxpop — 잘못된 링크">
          <div className="flex flex-col items-center gap-3 py-3 text-center">
            <div className="w-20 opacity-70">
              <PixelCat expression="sleepy" cell={6} />
            </div>
            <p className="text-[15px] text-foreground" style={{ fontWeight: 700 }}>
              매장 정보를 찾을 수 없어요
            </p>
            <p className="font-mono text-[12px] text-muted-foreground">
              QR 코드를 다시 확인해 주세요.
            </p>
            <Link to="/" className="mt-2 font-mono text-[12px] text-primary underline-offset-4 hover:underline">
              ← voxpop 소개
            </Link>
          </div>
        </TerminalWindow>
      </main>
    );
  }

  if (mode === "thread") {
    return (
      <main className="mx-auto max-w-[560px] px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <MonoLabel className="text-primary">$ voxpop thread --mine</MonoLabel>
          <span className="font-mono text-[11px] text-muted-foreground">영수증 링크 전용</span>
        </div>
        <TerminalWindow title={`${store?.display_name || "voxpop"} ── 내 한마디 + 사장님 답`}>
          {threadFailed ? (
            <div className="space-y-3 py-1 text-[14px] leading-relaxed text-muted-foreground">
              <p>
                이 링크로 한마디를 찾을 수 없어요. 다른 기기에서 저장된 링크이거나 링크 일부가
                잘렸을 수 있어요. voxpop은 무기명이라 링크 없이는 찾아드릴 수 없어요.
              </p>
              <Link
                to={`/s?store=${encodeURIComponent(slug)}`}
                className="inline-block rounded-lg border border-primary bg-primary px-4 py-2 font-mono text-[13px] text-primary-foreground"
              >
                [ 새 한마디 남기기 → ]
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 내 한마디 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 shrink-0">
                    <PixelCat expression="default" cell={4} />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">익명 고양이</span>
                </div>
                <div className="ml-0 rounded-2xl rounded-tl-sm border border-border bg-surface-raised px-3.5 py-3 text-[14px] leading-relaxed text-foreground shadow-sm">
                  {thread?.feedback?.content_clean || "한마디를 찾을 수 없어요."}
                </div>
              </div>
              {/* 사장님 답 */}
              {thread?.responses?.length ? (
                thread.responses.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 shrink-0">
                        <PixelTree level={treeLevel} cell={3} />
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">사장님</span>
                    </div>
                    <div className="ml-6 rounded-2xl rounded-tr-sm border border-primary/40 bg-card px-3.5 py-3 text-[14px] leading-relaxed text-foreground shadow-sm">
                      <span className="mr-1 font-mono text-primary">→</span>
                      {r.body}
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-mono text-[13px] text-muted-foreground">
                  아직 사장님 답이 없어요. 사장님이 답을 남기면 이 링크에서 볼 수 있어요.
                </p>
              )}
              <div className="border-t border-border-soft pt-3">
                <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                  › 이 대화는 영수증 링크로만 열려요. 사장님은 누가 썼는지 끝까지 모릅니다.
                  <span className="vox-cursor ml-1 text-primary">█</span>
                </p>
              </div>
            </div>
          )}
        </TerminalWindow>
        <Link
          to={`/s?store=${encodeURIComponent(slug)}`}
          className="mt-5 block rounded-lg border border-primary bg-primary px-4 py-2.5 text-center font-mono text-[13px] text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-95"
        >
          [ 한마디 더 남기기 → ]
        </Link>
        <Link to="/" className="mt-3 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">
          ← voxpop 소개
        </Link>
      </main>
    );
  }

  if (mode === "done") {
    return (
      <main className="mx-auto max-w-[440px] px-4 py-10">
        <TerminalWindow title="voxpop — 완료">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <motion.div
              initial={{ scale: 0.6, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
              className="w-28"
            >
              <PixelCat expression="happy" cell={8} />
            </motion.div>
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-mono text-[15px] text-primary"
            >
              {">＜>"} +1 적립!
            </motion.p>
            <p className="text-[15px] leading-relaxed text-foreground">읽고 진짜 바뀝니다. 고마워요.</p>
            <p className="font-mono text-[12px] text-muted-foreground">
              → 사장님은 누가 썼는지 끝까지 모릅니다.
            </p>

            {/* 매장 나무 */}
            <div className="my-1 w-24">
              <PixelTree level={treeLevel} cell={7} />
            </div>

            {/* 영수증 링크 */}
            {receiptUrl && (
              <div className="w-full rounded-lg border border-border bg-surface-raised p-3 text-left">
                <p className="font-mono text-[11px] text-muted-foreground">
                  사장님 답이 궁금하면 이 링크를 저장하세요
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    to={`/s?store=${encodeURIComponent(slug)}&token=${encodeURIComponent(receiptUrl.split("token=")[1] || "")}`}
                    className="flex-1 truncate font-mono text-[12px] text-primary underline-offset-2 hover:underline"
                  >
                    내 한마디에 사장님 답 보기
                  </Link>
                  <button
                    type="button"
                    onClick={copyReceipt}
                    className="shrink-0 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-surface-raised"
                  >
                    {copied ? "복사됨!" : "링크 복사"}
                  </button>
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                  이름·연락처 없이 이 링크로만 본인 한마디의 답을 볼 수 있어요.
                </p>
              </div>
            )}

            <Link to="/" className="mt-1 font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">
              홈으로
            </Link>
          </div>
        </TerminalWindow>
      </main>
    );
  }

  // mode === "form"
  return (
    <main className="mx-auto max-w-[440px] px-4 py-8">
      <div className="mb-4 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground shadow-sm">
        <span className="text-primary">●</span> 이름·번호 안 받아요 · 욕설·개인정보 자동 가림
      </div>

      {revisitToken && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-surface-raised px-3 py-2">
          <Link
            to={`/s?store=${encodeURIComponent(slug)}&token=${encodeURIComponent(revisitToken)}`}
            className="font-mono text-[12px] text-primary underline-offset-2 hover:underline"
          >
            › 지난 한마디에 사장님 답 보기
          </Link>
          <button
            type="button"
            onClick={() => setRevisitToken(null)}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
            aria-label="배지 닫기"
          >
            ✕
          </button>
        </div>
      )}

      <TerminalWindow title={`voxpop@${store?.display_name || "우리가게"} — 한마디`}>
        <div className="flex flex-col items-center gap-2 py-1 text-center">
          <div className="w-24">
            <PixelCat expression={catExpr} cell={8} />
          </div>
          <p className="text-[16px] text-foreground" style={{ fontWeight: 700 }}>오늘 어떠셨어요?</p>
          <p className="font-mono text-[11px] text-muted-foreground">$ rate --stars</p>
        </div>

        {/* 별점 */}
        <div className="mt-3 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n}점`}
              className="px-1 text-2xl leading-none transition-transform hover:scale-110"
            >
              <span className={n <= display ? "text-primary" : "text-border"}>
                {n <= display ? "★" : "☆"}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-center font-mono text-[11px]" style={{ color: error && rating < 1 ? "var(--destructive)" : undefined }}>
          <span className="text-muted-foreground">
            {rating ? RATING_HINTS[rating] : "별을 눌러 평가해 주세요"}
          </span>
        </p>

        {/* 후속 칩 (1~3점) */}
        {rating > 0 && shouldAskFollowUp({ rating }) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5">
            <MonoLabel>// 아쉬운 점이 있었나요?</MonoLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {FOLLOW_UP_CHIPS.map((c: { label: string; category: string }) => {
                const on = category === c.category;
                return (
                  <button
                    key={c.category}
                    type="button"
                    onClick={() => toggleChip(c.category)}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-surface-raised"
                    }`}
                  >
                    {on ? "› " : ""}{c.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 한마디 (선택) */}
        {rating > 0 && (
          <div className="mt-5">
            <MonoLabel>// 한마디 (선택)</MonoLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={'$ echo "..."  — 위험한 말·개인정보는 자동으로 가려져요'}
              className="mt-2 w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
            />
            <p className="text-right font-mono text-[10px] text-muted-foreground/70">{note.length} / 500</p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-[12px] text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={rating === 0 || submitting}
          className="mt-4 w-full rounded-lg border border-primary bg-primary px-4 py-2.5 font-mono text-[13px] text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
        >
          {submitting ? "전달 중..." : "[ 사장님에게 전달하기 ]"}
          {rating > 0 && !submitting && <span className="vox-cursor ml-1">█</span>}
        </button>
      </TerminalWindow>

      {/* 매장 나무 */}
      <div className="mt-5 flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-raised py-5">
        <div className="w-20">
          <PixelTree level={treeLevel} cell={6} />
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          이 가게의 나무 · 한마디가 쌓일수록 자랍니다
        </p>
      </div>

      <Link to="/" className="mt-4 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">
        ← voxpop 소개
      </Link>
    </main>
  );
}
