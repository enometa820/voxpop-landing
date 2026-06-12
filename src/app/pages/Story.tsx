import { Link } from "react-router";
import { MonoLabel } from "../components/terminal/MonoLabel";

export function Story() {
  return (
    <main className="mx-auto max-w-[860px] px-4 py-10 sm:px-6">
      {/* 히어로 */}
      <section className="text-center">
        <p className="font-mono text-[13px] leading-relaxed text-primary" style={{ fontWeight: 700 }}>
          AI는 거대 자본만이 아니라 골목 사장님도 공평하게 누려야 할 기술입니다
        </p>
        <h1 className="mt-4 text-foreground" style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.2 }}>
          막막한 AI, 어렵지 않게.
          <br />
          가장 쉬운 첫걸음부터.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
          동네 사장님이 AI를 사업에 어떻게 써야 할지 막막한 것, 그걸 풀어주는 게 voxpop이 있는 이유입니다. 그 첫걸음이
          손님의 솔직한 한마디를 무기명으로 받아 AI가 “오늘 할 일” 한 줄로 바꿔주는 것입니다. 사장님이 가장 부담 없이
          만나는 첫 AI 경험에서 시작해, 거기서부터 가게 운영 전반으로 넓혀가려 합니다.
        </p>
      </section>

      <Block cmd="// 우리가 푸는 문제" title="막막함이 핵심 페인입니다">
        <p>
          소상공인은 AI가 중요하다는 걸 압니다. 그런데 실제로 시작한 사장님은 손에 꼽습니다. 인식은 높은데 실행이
          따라오지 않는 이유는 하나입니다. 생계로 바쁘고, 무엇을 어떻게 해야 할지조차 몰라 막막한 것입니다. 이 막막함이
          voxpop이 풀려는 핵심 페인입니다. 회피할 리스크가 아니라, 우리가 정면으로 답해야 할 출발점입니다.
        </p>
        <p>
          막막함의 첫 조각은 손님 피드백에서 드러납니다. 공개 리뷰판에서는 솔직한 말이 사라집니다. 업주 요청만으로 부정
          리뷰가 가려지고, 보상 이벤트로 칭찬 별점이 쌓입니다. 손님은 솔직하게 말하기 어렵고, 사장은 진짜 문제를 못
          듣습니다. 사장이 “공개되기 전에 먼저 듣고 싶다”고 느끼는 그 지점이 voxpop의 시작점입니다.
        </p>
      </Block>

      <Block cmd="// 우리의 해법" title="공개 리뷰의 반대편을 만듭니다">
        <p>
          voxpop은 공개 리뷰의 반대편을 만듭니다. 이름도 로그인도 없이 QR로 손님이 익명 한마디를 남기고, 위험한 표현은
          가리되 감정 강도와 긴급도는 살려 사장에게 “오늘 해볼 행동” 한 줄로 전합니다. 지금 작동하는 엔진은 규칙
          기반입니다. 욕설·전화번호·직원 지칭·명예훼손 위험을 잡아내고, 맛·응대·청결·대기·가격 갈래로 분류해 사장이 상처
          대신 할 일을 받게 합니다.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "손님", body: "QR 하나로 익명 접속. 별점과 솔직한 한마디를 남깁니다. 이름도, 로그인도, 보복 걱정도 없습니다." },
            { label: "시스템", body: "위험 표현은 가리고, 감정 강도와 긴급도 신호는 보존. 맛·응대·청결 등 갈래로 분류합니다." },
            { label: "사장", body: "날 선 문장이 아니라 ‘오늘 해볼 행동’ 한 줄로 받습니다. 상처 없이 할 일을 얻습니다." },
          ].map((c) => (
            <div key={c.label} className="border-bold bg-card p-4 shadow-hard-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary">{c.label}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block cmd="// 왜 우리가 이걸 하는가" title="진짜 목소리가 사라지는 건 구조입니다">
        <p>
          공개 리뷰판에서 솔직한 한마디가 사라지는 건 개인의 불운이 아니라 구조적인 일입니다. 데이터가 그것을 말합니다.
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "업주가 요청하면 내용 검증 없이 부정 리뷰가 가려집니다. 배달앱은 업주 요청만으로 최대 30일까지 리뷰를 블라인드 처리합니다.",
            "후기 작성자의 65.2%가 보상 이벤트 때문에 후기를 썼고, 그 참여자의 98.3%가 실제 만족보다 높게 평가했습니다(한국소비자원 2024).",
            "소비자 불만 1위(58.6%)가 “후기·계정을 차단하는 약관”이었습니다(한국소비자원).",
          ].map((t, i) => (
            <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-muted-foreground">
              <span className="mt-0.5 font-mono text-primary">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          리뷰판에 칭찬만 쌓이는 건 우연이 아닙니다. 그래서 voxpop을 만듭니다. 공개 리뷰가 손님과 사장을 정면으로
          부딪치게 한다면, voxpop은 그 사이에 익명이라는 안전장치를 둡니다. 직접 부딪칠 일이 없으니 감정이 가라앉고, 그
          자리에 진짜 대화가 들어설 틈이 생깁니다. 익명이 막는 벽이 아니라 잇는 다리가 되게 하는 것이 voxpop의
          방향입니다.
        </p>
      </Block>

      <Block cmd="// 어디로 가는가" title="단계를 잇는 사다리">
        <p className="mb-1">전략은 단계를 잇는 사다리입니다. 한 단을 실제로 증명해야 다음 단으로 나아갑니다.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { when: "지금", body: "카페·소형 외식 매장에서 무기명 피드백 채널을 베타로 검증합니다. 손님이 진짜 한마디를 남기는지, 사장이 그 가치에 돈을 낼 만큼 아파하는지 직접 확인합니다." },
            { when: "다음", body: "첫 단계가 자리잡으면 같은 사장님에게 두 번째 운영 가치를 더하거나, 같은 무기명 가림·분류 엔진을 옆 시장(공공 민원·조직 내부 건의·시설 이용자·환자 경험)으로 넓힙니다." },
            { when: "지향", body: "소상공인과 작은 조직이 처음 만나는 AI 운영 전환(AX)의 입구가 되려 합니다. AI 시대의 혜택이 거대 자본만이 아니라 동네 골목까지 닿을 때까지." },
          ].map((s) => (
            <div key={s.when} className="border-bold bg-card p-4 shadow-hard-sm">
              <p className="font-mono text-[12px] text-primary" style={{ fontWeight: 700 }}>{s.when}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Block>

      <section className="mt-10 border-bold bg-card px-5 py-8 text-center shadow-hard">
        <h2 className="text-foreground" style={{ fontWeight: 800, fontSize: "clamp(1.4rem,3vw,2rem)" }}>직접 보시겠어요?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          손님 입장으로 익명 한마디를 남기고, 사장 대시보드에서 “오늘 할 일”이 어떻게 나오는지 확인해 보세요.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="/s?store=u61zh7b2" className="retro-btn retro-btn--primary px-4 py-2 font-mono text-[13px]">[ 손님 화면 체험 → ]</a>
          <Link to="/owner" className="retro-btn px-4 py-2 font-mono text-[13px] text-foreground">[ 사장 대시보드 ]</Link>
        </div>
      </section>

      <Link to="/" className="mt-8 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">← voxpop 소개</Link>
    </main>
  );
}

function Block({ cmd, title, children }: { cmd: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <MonoLabel>{cmd}</MonoLabel>
      <h2 className="mt-3 text-foreground" style={{ fontSize: "clamp(1.3rem, 3vw, 1.9rem)", fontWeight: 800 }}>{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
