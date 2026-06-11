import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { TerminalLog, type LogLine } from "../components/terminal/TerminalLog";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { PixelTree } from "../components/mascots/PixelTree";
import {
  feedbackCards as seedCards,
  todayActions,
  weeklySignals,
} from "../data/mock";

const todayLog: LogLine[] = [
  { kind: "cmd", text: "voxpop today" },
  { kind: "progress", text: "한마디 4건 · 자동 가림 완료 · 신원 0" },
  { kind: "bullet", text: "긴급 1건 (청결) · 일반 3건" },
  { kind: "success", text: "처리하면 매장 나무가 자랍니다" },
];

export function OwnerDashboard() {
  const [cards, setCards] = useState(seedCards);
  const [doneActions, setDoneActions] = useState<string[]>([]);

  const unresolvedUrgent = useMemo(
    () => cards.some((c) => c.urgent && !c.resolved),
    [cards],
  );

  const resolvedCount = cards.filter((c) => c.resolved).length;

  const toggle = (id: string) => {
    // optimistic UI — flip immediately
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)),
    );
  };

  const reply = (id: string) => {
    toast.success("답을 보냈어요. 손님은 영수증 링크로 확인합니다.", {
      description: "사장님은 누가 썼는지 끝까지 모릅니다.",
    });
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
    );
  };

  const toggleAction = (id: string) =>
    setDoneActions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="text-primary">●</span>
          <span className="font-mono text-foreground">voxpop@우리카페</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            — 사장 대시보드
          </span>
        </div>
        <Link
          to="/"
          className="font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline"
        >
          ← 소개
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT: today terminal + tree */}
        <div className="space-y-5 lg:col-span-1">
          <TerminalWindow title="voxpop@store ~ %">
            <TerminalLog lines={todayLog} />
          </TerminalWindow>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="border-b border-border px-4 py-2.5">
              <MonoLabel>// 매장 나무</MonoLabel>
            </div>
            <div className="flex flex-col items-center gap-3 px-4 py-6">
              <div className="w-28">
                <PixelTree
                  level={4}
                  health={unresolvedUrgent ? "wilting" : "healthy"}
                  cell={8}
                />
              </div>
              <AsciiProgress value={8} max={10} label="LV.4 · 나무" />
              <p
                className={`font-mono text-[12px] ${
                  unresolvedUrgent ? "text-destructive" : "text-primary"
                }`}
              >
                {unresolvedUrgent
                  ? "잎이 살짝 시들었어요 — 긴급 한마디 미조치"
                  : "건강해요 — 오늘 신호를 잘 챙겼어요"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/70">
                건강은 사장님만 봅니다 · 손님에겐 성장만
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: actions + signals + cards */}
        <div className="space-y-5 lg:col-span-2">
          {/* hero: 오늘 할 일 */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <MonoLabel className="text-primary">[ 오늘 할 일 ]</MonoLabel>
              <span className="font-mono text-[11px] text-muted-foreground">
                {doneActions.length}/{todayActions.length} 완료
              </span>
            </div>
            <ul>
              {todayActions.map((a, i) => {
                const done = doneActions.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-raised ${
                      i < todayActions.length - 1 ? "border-b border-border-soft" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAction(a.id)}
                      aria-label="완료 토글"
                      className={`mt-0.5 size-5 shrink-0 rounded-md border font-mono text-[12px] leading-none transition-colors ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-transparent"
                      }`}
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[15px] leading-snug ${
                          done
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {a.urgent && (
                          <span className="mr-1.5 font-mono text-[11px] text-destructive">
                            [긴급]
                          </span>
                        )}
                        {a.text}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        // {a.basis}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* weekly signals */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="border-b border-border px-4 py-2.5">
              <MonoLabel>// 주간 신호</MonoLabel>
            </div>
            <div className="grid grid-cols-1 gap-2.5 px-4 py-4 sm:grid-cols-2">
              {weeklySignals.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 font-mono text-[12px] text-muted-foreground">
                    {s.label}
                  </span>
                  <AsciiProgress
                    value={s.value}
                    max={s.max}
                    tone={s.value <= 5 ? "destructive" : "primary"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* feedback cards */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <MonoLabel>// 한마디 ({cards.length})</MonoLabel>
              <span className="font-mono text-[11px] text-muted-foreground">
                처리 {resolvedCount}/{cards.length}
              </span>
            </div>
            <ul>
              {cards.map((c, i) => (
                <li
                  key={c.id}
                  className={`px-4 py-4 transition-colors ${
                    i < cards.length - 1 ? "border-b border-border-soft" : ""
                  } ${c.urgent && !c.resolved ? "bg-destructive/5" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] text-primary">
                      {"★".repeat(c.rating)}
                      <span className="text-border">
                        {"☆".repeat(5 - c.rating)}
                      </span>
                    </span>
                    {c.chips.map((chip) => (
                      <span
                        key={chip}
                        className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                    {c.urgent && (
                      <span className="font-mono text-[10px] text-destructive">
                        [긴급]
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                      {c.time}
                    </span>
                  </div>

                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                    {c.masked}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                    device=null · ip=hashed · 욕설·개인정보 자동 가림
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                        c.resolved
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-surface-raised"
                      }`}
                    >
                      [{c.resolved ? "x" : " "}] {c.resolved ? "처리됨" : "처리하기"}
                    </button>
                    <button
                      type="button"
                      onClick={() => reply(c.id)}
                      className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-primary transition-colors hover:bg-surface-raised"
                    >
                      › 답하기
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
