import { Link } from "react-router";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { PixelCat } from "../components/mascots/PixelCat";
import { PixelTree } from "../components/mascots/PixelTree";
import { threadMessages } from "../data/mock";

export function CustomerThread() {
  return (
    <main className="mx-auto max-w-[560px] px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <MonoLabel className="text-primary">$ voxpop thread --mine</MonoLabel>
        <span className="font-mono text-[11px] text-muted-foreground">
          영수증 링크 전용
        </span>
      </div>

      <TerminalWindow title="우리카페 ── 내 한마디 + 사장님 답">
        <div className="space-y-5">
          {threadMessages.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 shrink-0">
                  {m.from === "customer" ? (
                    <PixelCat expression="default" cell={4} />
                  ) : (
                    <PixelTree level={4} cell={3} />
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {m.from === "customer" ? "익명 고양이" : "사장님"} · {m.time}
                </span>
                {m.rating != null && (
                  <span className="font-mono text-[11px] text-primary">
                    {"★".repeat(m.rating)}
                    {"☆".repeat(5 - m.rating)}
                  </span>
                )}
              </div>

              <div
                className={`rounded-2xl border px-3.5 py-3 text-[14px] leading-relaxed shadow-sm ${
                  m.from === "customer"
                    ? "ml-0 rounded-tl-sm border-border bg-surface-raised text-foreground"
                    : "ml-6 rounded-tr-sm border-primary/40 bg-card text-foreground"
                }`}
              >
                {m.from === "owner" && (
                  <span className="mr-1 font-mono text-primary">→</span>
                )}
                {m.body}
                {m.note && (
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    // {m.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-border-soft pt-3">
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            › 이 대화는 영수증 링크로만 열려요. 사장님은 누가 썼는지 끝까지
            모릅니다.
            <span className="vox-cursor ml-1 text-primary">█</span>
          </p>
        </div>
      </TerminalWindow>

      <Link
        to="/feedback"
        className="mt-5 block rounded-lg border border-primary bg-primary px-4 py-2.5 text-center font-mono text-[13px] text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-95"
      >
        [ 한마디 더 남기기 → ]
      </Link>
      <Link
        to="/"
        className="mt-3 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline"
      >
        ← voxpop 소개
      </Link>
    </main>
  );
}
