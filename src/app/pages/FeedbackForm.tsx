import { useState } from "react";
import { Link } from "react-router";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { PixelCat } from "../components/mascots/PixelCat";
import { regretChips } from "../data/mock";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const toggleChip = (c: string) =>
    setChips((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const submit = () => {
    if (rating === 0) return;
    setDone(true);
    confetti({
      particleCount: 36,
      spread: 55,
      startVelocity: 28,
      scalar: 0.7,
      origin: { y: 0.4 },
      colors: ["#1b6b42", "#3e8e63", "#6fae8a"],
    });
  };

  const display = hover || rating;

  if (done) {
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
            <p className="text-[15px] leading-relaxed text-foreground">
              읽고 진짜 바뀝니다. 고마워요.
            </p>
            <p className="font-mono text-[12px] text-muted-foreground">
              → 사장님은 누가 썼는지 끝까지 모릅니다.
            </p>
            <Link
              to="/thread"
              className="mt-2 w-full rounded-lg border border-primary bg-primary px-4 py-2.5 font-mono text-[13px] text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-95"
            >
              [ 영수증 링크로 사장님 답 보기 → ]
            </Link>
            <Link
              to="/"
              className="font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline"
            >
              홈으로
            </Link>
          </div>
        </TerminalWindow>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[440px] px-4 py-8">
      {/* trust label */}
      <div className="mb-4 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground shadow-sm">
        <span className="text-primary">●</span> 이름·번호 안 받아요 · 욕설·개인정보
        자동 가림
      </div>

      <TerminalWindow title="voxpop@우리카페 — 한마디">
        <div className="flex flex-col items-center gap-2 py-1 text-center">
          <div className="w-24">
            <PixelCat
              expression={display >= 4 ? "happy" : display > 0 ? "default" : "sleepy"}
              cell={8}
            />
          </div>
          <p className="text-[16px] text-foreground" style={{ fontWeight: 700 }}>
            오늘 어떠셨어요?
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            $ rate --stars
          </p>
        </div>

        {/* star rating */}
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
        <p className="mt-1 text-center font-mono text-[11px] text-muted-foreground">
          {display ? `[${"█".repeat(display)}${"░".repeat(5 - display)}] ${display}/5` : "탭해서 별점을 남겨주세요"}
        </p>

        {/* regret chips on low score */}
        {rating > 0 && rating <= 3 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5"
          >
            <MonoLabel>// 아쉬운 점이 있었나요?</MonoLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {regretChips.map((c) => {
                const on = chips.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChip(c)}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-surface-raised"
                    }`}
                  >
                    {on ? "› " : ""}
                    {c}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* optional note */}
        {rating > 0 && (
          <div className="mt-5">
            <MonoLabel>// 한마디 (선택)</MonoLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder={'$ echo "..."  — 위험한 말·개인정보는 자동으로 가려져요'}
              className="mt-2 w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
            />
            <p className="text-right font-mono text-[10px] text-muted-foreground/70">
              {note.length}/200
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={rating === 0}
          className="mt-4 w-full rounded-lg border border-primary bg-primary px-4 py-2.5 font-mono text-[13px] text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
        >
          [ 제출하기 ]
          {rating > 0 && <span className="vox-cursor ml-1">█</span>}
        </button>
      </TerminalWindow>

      <Link
        to="/"
        className="mt-4 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline"
      >
        ← voxpop 소개
      </Link>
    </main>
  );
}
