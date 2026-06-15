import { Link } from "react-router";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { TerminalLog, type LogLine } from "../components/terminal/TerminalLog";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { PixelTree } from "../components/mascots/PixelTree";
import { type TreeLevel } from "../lib/tree";
import { PixelCat } from "../components/mascots/PixelCat";
import { weeklySignals, closet, fishTokens } from "../data/mock";

const installCmds = ["1. 매장 이름 등록", "2. QR 출력해 테이블에 붙이기"];

const demoLog: LogLine[] = [
  { kind: "plain", text: "── 오늘 한눈에 ──" },
  { kind: "progress", text: "어제 한마디 6건 수집 · 자동 가림 완료" },
  { kind: "bullet", text: "오늘 할 일: 화장실 청결 점검 · 대기 안내 개선" },
  { kind: "plain", text: "주간 신호 ─────────────────" },
  { kind: "bar", text: "맛   ████████░░   친절 █████████░" },
  { kind: "bar", text: "청결 █████░░░░░   대기 ████░░░░░░" },
  { kind: "success", text: "매장 나무가 한 뼘 자랐어요 (LV.4)" },
];

const features: {
  n: string;
  title: string;
  body: string;
  meta: string;
  variant: "" | "info" | "good";
}[] = [
  {
    n: "01",
    title: "무기명",
    body: "누가 썼는지 영원히 모릅니다. 신원·기기·위치는 어느 화면에도 남지 않아요.",
    meta: "device=null · ip=hashed",
    variant: "info",
  },
  {
    n: "02",
    title: "자동 가림",
    body: "욕설·개인정보는 가리고, 가게가 고칠 수 있는 신호만 또렷하게 살립니다.",
    meta: "mask=on · pii=stripped",
    variant: "",
  },
  {
    n: "03",
    title: "오늘 할 일",
    body: "쌓인 한마디를 오늘 바로 실행할 수 있는 한 줄 액션으로 정리해 드려요.",
    meta: "actions=daily · noise=0",
    variant: "good",
  },
];

const treeStages: { level: TreeLevel; count: number }[] = [
  { level: 1, count: 1 },
  { level: 2, count: 5 },
  { level: 3, count: 18 },
  { level: 4, count: 42 },
  { level: 5, count: 120 },
];

function SectionLabel({
  cmd,
  children,
  onDark = false,
}: {
  cmd: string;
  children: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-3 border-b-2 px-4 py-3 sm:px-6 ${
        onDark ? "border-ink bg-primary" : "border-border"
      }`}
    >
      <span
        className={`font-mono text-[12px] ${
          onDark ? "text-primary-foreground" : "text-primary"
        }`}
      >
        {cmd}
      </span>
      <span
        className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
          onDark ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

export function Landing() {
  return (
    <main className="mx-4 my-5 max-w-[1200px] overflow-hidden rounded-2xl border border-border shadow-[0_24px_70px_-34px_rgba(12,36,23,0.45)] sm:mx-6 sm:my-7 lg:mx-auto">
      {/* NAV */}
      <nav className="grid grid-cols-2 border-b border-border md:grid-cols-4">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4 md:border-b-0 md:border-r">
          <span className="text-primary">●</span>
          <span className="font-mono tracking-tight text-foreground">voxpop</span>
        </div>
        <a
          href="#about"
          className="hidden items-center px-4 py-4 font-mono text-[13px] text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground md:flex md:border-r border-border"
        >
          // 소개
        </a>
        <a
          href="#how"
          className="hidden items-center px-4 py-4 font-mono text-[13px] text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground md:flex md:border-r border-border"
        >
          // 작동 방식
        </a>
        <Link
          to="/owner"
          className="flex items-center justify-between gap-2 px-4 py-4 font-mono text-[13px] text-primary transition-colors hover:bg-surface-raised"
        >
          시작하기 <span aria-hidden>→</span>
        </Link>
      </nav>

      {/* HERO */}
      <section id="about" className="grid grid-cols-1 lg:grid-cols-2">
        <div className="border-b border-border px-4 py-10 sm:px-6 sm:py-14 lg:border-b-0 lg:border-r">
          <MonoLabel className="text-primary">
            OPEN FEEDBACK · 사장님만 보는 비공개 채널
          </MonoLabel>
          <h1
            className="mt-5 leading-[1.12] tracking-[-0.01em] text-foreground"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800 }}
          >
            손님의 한마디로,
            <br />
            가게가 자랍니다.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            공개 리뷰엔 못 남기는 솔직한 한마디를, 손님이 매장 QR로 무기명 남깁니다.
            욕설·개인정보·위험 표현은 한국어 엔진이 자동으로 가리고, 사장님은
            ‘오늘 할 일’ 한 줄을 받습니다. 사장이 답하면 손님에게 닿고, 매장
            나무가 한 뼘 자랍니다.
          </p>

          <div className="mt-7 overflow-hidden border-bold bg-surface-raised shadow-hard-sm">
            <div className="flex items-center gap-2 border-b-2 border-ink bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="flex gap-2">
                <span className="size-3 border border-ink bg-[#ff5f57]" />
                <span className="size-3 border border-ink bg-[#febc2e]" />
                <span className="size-3 border border-ink bg-[#28c840]" />
              </span>
              <span className="ml-1 font-mono text-[11px]">
                voxpop — 매장 시작 2단계
              </span>
            </div>
            <div className="space-y-2 p-4 font-mono text-[13px]">
              {installCmds.map((cmd) => (
                <div key={cmd} className="text-foreground">{cmd}</div>
              ))}
              <div className="text-muted-foreground">
                → 손님은 이름·전화번호·위치 없이 익명으로 남겨요
                <span className="vox-cursor ml-1 text-primary">█</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/s?store=u61zh7b2"
              className="border-bold bg-primary px-4 py-2 font-mono text-[13px] text-primary-foreground shadow-hard-sm transition-all hover:-translate-y-0.5 hover:translate-x-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              [ 손님 화면 체험 ]
            </Link>
            <Link
              to="/owner?demo=1"
              className="border-bold bg-card px-4 py-2 font-mono text-[13px] text-foreground shadow-hard-sm transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              [ 사장 대시보드 체험 ]
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center bg-desktop px-4 py-12 sm:px-6">
          <div className="sticky-card sticky-card--good flex w-full max-w-xs flex-col items-center gap-5 p-6">
            <div className="w-40 sm:w-52">
              <PixelTree level={4} cell={10} />
            </div>
            <AsciiProgress value={8} max={10} label="LV.4" />
            <p className="text-center font-mono text-[12px]">
              매장 나무 · 한마디 +6 → 한 뼘 자람
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM (honest, verified numbers) */}
      <section className="border-t border-border bg-card px-4 py-10 sm:px-6">
        <MonoLabel>// 왜 voxpop 인가</MonoLabel>
        <p
          className="mt-4 max-w-3xl text-[17px] leading-relaxed text-foreground"
          style={{ fontWeight: 500 }}
        >
          공개 리뷰는 가게를 키워주지 않습니다. 부정 리뷰는 업주 요청만으로
          내용 검증 없이 가려지고(배민 최대 30일 블라인드), 후기 작성자의{" "}
          <span className="text-primary">65.2%</span>는 보상 이벤트 때문에
          썼으며, 그중 <span className="text-primary">98.3%</span>가 실제보다
          높게 평가했습니다.
        </p>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          출처 · 한국소비자원 2024(1,000명 설문) · voxpop은 매출 과장 대신 ‘오늘
          고칠 한 줄’만 약속합니다.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="retro-desktop border-t-2 border-ink px-4 py-10 sm:px-6">
        <MonoLabel className="text-primary-foreground">// 어떻게 작동하나</MonoLabel>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "QR 스캔", d: "손님이 테이블 QR을 찍고 익명 폼에 들어옵니다. 이름·번호·위치는 받지 않아요." },
            { n: "02", t: "솔직한 한마디", d: "공개 리뷰엔 못 쓰는 진짜 속마음을 무기명으로 남깁니다. 욕설·개인정보·위험 표현은 한국어 엔진이 자동으로 가립니다." },
            { n: "03", t: "오늘 할 일", d: "쌓인 한마디가 사장님에겐 오늘 바로 고칠 한 줄 액션으로 정리됩니다. 매출 과장 대신 실행만." },
            { n: "04", t: "자라고, 닿고", d: "사장이 조치하면 매장 나무가 자라고, 스레드 링크로 손님은 사장의 답을 받습니다 — 누가 썼는지는 끝까지 비공개." },
          ].map((s) => (
            <div key={s.n} className="sticky-card flex flex-col px-5 py-6">
              <span className="flex h-8 w-9 items-center justify-center border-2 border-ink bg-sun font-mono text-[12px] font-bold text-sun-foreground shadow-hard-sm">
                {s.n}
              </span>
              <h3 className="mt-4 text-foreground" style={{ fontWeight: 700 }}>{s.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 max-w-3xl sticky-card px-5 py-4">
          <p className="text-[15px] leading-relaxed text-foreground" style={{ fontWeight: 500 }}>
            voxpop은 <span className="text-primary">동네 사장님이 AI를 사업에 처음 접목하는 가장 낮은 문턱</span>입니다.
            가장 부담 없는 무기명 피드백으로 시작해, 매장에 쌓인 목소리를 모아 운영 전반을 돕는 쪽으로 넓혀갑니다.
          </p>
        </div>
      </section>

      {/* DEMO */}
      <section id="how" className="border-t border-border">
        <SectionLabel cmd="// 미리보기">사장님 화면</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <TerminalWindow title="voxpop — 사장님 화면">
              <TerminalLog lines={demoLog} loop />
            </TerminalWindow>
          </div>
          <div className="space-y-4 bg-surface-raised p-4 sm:p-6">
            <MonoLabel>// 주간 신호</MonoLabel>
            <div className="space-y-2.5">
              {weeklySignals.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 font-mono text-[12px] text-muted-foreground">
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
            <p className="font-mono text-[12px] text-primary">
              ▲ 신호가 또렷해지면 나무가 자랍니다.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid grid-cols-1 gap-4 border-t-2 border-ink bg-surface-raised px-4 py-8 sm:px-6 md:grid-cols-3">
        {features.map((f) => {
          const onAccent = f.variant === "info";
          return (
            <div
              key={f.n}
              className={`sticky-card px-5 py-8 transition-transform hover:-translate-y-0.5 ${
                f.variant === "info"
                  ? "sticky-card--info"
                  : f.variant === "good"
                    ? "sticky-card--good"
                    : ""
              }`}
            >
              <span
                className={`inline-flex border-2 border-ink px-2 py-0.5 font-mono text-[12px] font-bold ${
                  onAccent ? "bg-card text-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                [{f.n}]
              </span>
              <h3 className="mt-4" style={{ fontWeight: 700 }}>
                {f.title}
              </h3>
              <p
                className={`mt-2 text-[14px] leading-relaxed ${
                  onAccent ? "text-coral-foreground/90" : "text-muted-foreground"
                }`}
              >
                {f.body}
              </p>
              <p
                className={`mt-5 border-t-2 border-ink/30 pt-3 font-mono text-[11px] ${
                  onAccent ? "text-coral-foreground/80" : "text-muted-foreground/80"
                }`}
              >
                {f.meta}
              </p>
            </div>
          );
        })}
      </section>

      {/* TREE GROWTH STRIP */}
      <section className="border-t-2 border-ink retro-desktop">
        <SectionLabel cmd="// 매장 나무" onDark>매장 나무 성장</SectionLabel>
        <div className="grid grid-cols-2 gap-4 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:grid-cols-5">
          {treeStages.map(({ level, count }) => (
            <div
              key={level}
              className={`sticky-card flex flex-col items-center gap-3 px-3 py-7 transition-transform hover:-translate-y-0.5 ${
                level === 5 ? "sticky-card--good" : ""
              }`}
            >
              <div className="flex h-28 w-20 items-end justify-center">
                <PixelTree level={level} cell={6} />
              </div>
              <span className="font-mono text-[11px] font-bold">
                LV.{level}
              </span>
              <div className="w-full">
                <div className="retro-progress h-[12px] w-full p-[2px]">
                  <div
                    className="retro-progress__fill--growth"
                    style={{ width: `${(level / 5) * 100}%` }}
                  />
                </div>
                <span className="mt-1.5 block text-center font-mono text-[10px]">
                  한마디 {count}개
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="border-t-2 border-ink bg-primary px-4 py-3 text-center font-mono text-[12px] text-primary-foreground">
          한마디가 쌓일수록 — 새싹에서 금전수까지.
        </p>
      </section>

      {/* CAT CLOSET */}
      <section className="border-t border-border">
        <SectionLabel cmd="// 옷장">손님 고양이 꾸미기</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-4 border-b border-border bg-surface-raised px-4 py-10 lg:border-b-0 lg:border-r">
            <div className="w-32">
              <PixelCat expression="happy" costume="ribbon" cell={9} />
            </div>
            <p className="text-center font-mono text-[12px] text-muted-foreground">
              QR을 찍으면 익명 고양이가 됩니다.
              <br />
              한마디 남길 때마다 <span className="text-primary">{"><>"}</span> +1
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <TerminalWindow title="CLOSET ── 내 옷장">
              <div className="mb-3 flex items-center justify-between text-muted-foreground">
                <span>내 옷장</span>
                <span className="text-primary">{"><>"} x {fishTokens}</span>
              </div>
              <div className="space-y-1.5">
                {closet.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className={item.owned ? "text-foreground" : "text-muted-foreground"}>
                      [{item.owned ? "x" : " "}] {item.name}
                    </span>
                    <span className="text-muted-foreground">
                      {item.owned
                        ? "보유"
                        : item.locked
                          ? `${"><>"} ${item.cost} · 잠김`
                          : `${"><>"} ${item.cost}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-border-soft pt-2 text-muted-foreground">
                › 코스튬은 손님 기기에만 저장 — 어느 가게를 다니는지 가게는
                모릅니다.
              </p>
            </TerminalWindow>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-2 border-ink bg-desktop px-4 py-14 text-center sm:px-6">
        <div className="sticky-card mx-auto max-w-2xl px-6 py-10">
          <h2 className="text-foreground" style={{ fontWeight: 800, fontSize: "clamp(1.5rem,3.5vw,2.25rem)" }}>
            오늘부터, 솔직한 한마디를 받아보세요.
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/s?store=u61zh7b2"
              className="border-bold bg-coral px-5 py-2.5 font-mono text-[13px] font-bold text-coral-foreground shadow-hard-sm transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              [ 손님 화면 체험 → ]
            </Link>
            <Link
              to="/story"
              className="border-bold bg-card px-5 py-2.5 font-mono text-[13px] text-foreground shadow-hard-sm transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              [ 우리 이야기 보기 ]
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <div className="border-b border-r border-border px-4 py-5 md:border-b-0">
            <span className="font-mono text-[12px] text-foreground">voxpop</span>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">v0.1.0 — beta</p>
          </div>
          <div className="border-b border-border px-4 py-5 md:border-b-0 md:border-r">
            <p className="font-mono text-[11px] text-muted-foreground">EST 2026</p>
            <p className="font-mono text-[11px] text-muted-foreground">Seoul, KR</p>
          </div>
          <div className="border-r border-border px-4 py-5">
            <p className="font-mono text-[11px] text-muted-foreground">ANONYMOUS</p>
            <p className="font-mono text-[11px] text-muted-foreground">BY DESIGN</p>
          </div>
          <div className="px-4 py-5">
            <p className="font-mono text-[11px] text-muted-foreground">device=null</p>
            <p className="font-mono text-[11px] text-muted-foreground">ip=hashed</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-4">
          <Link to="/story" className="font-mono text-[11px] text-muted-foreground hover:text-primary">우리 이야기</Link>
          <Link to="/owner-guide" className="font-mono text-[11px] text-muted-foreground hover:text-primary">사장님 가이드</Link>
          <Link to="/privacy" className="font-mono text-[11px] text-muted-foreground hover:text-primary">개인정보처리방침</Link>
          <a href="mailto:tototal5542@gmail.com" className="font-mono text-[11px] text-muted-foreground hover:text-primary">문의</a>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/60">© 2026 Voxpop</span>
        </div>
      </footer>
    </main>
  );
}
