import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { fetchStoreBySlug } from "../../lib/supabase-client.js";
import { downloadStoreQR, storeFormUrl } from "../lib/qr";

export function OwnerGuide() {
  const [params] = useSearchParams();
  const rawStore = (params.get("store") || "").trim();
  const slug = rawStore.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const nameFromUrl = (params.get("name") || "").trim();

  const [storeName, setStoreName] = useState(nameFromUrl || (slug ? slug : "공통 가이드"));
  const [copied, setCopied] = useState("");

  const customerUrl = slug ? storeFormUrl(slug) : `${location.origin}/s?store=demo`;
  const ownerUrl = `${location.origin}/owner`;

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const store = await fetchStoreBySlug(slug);
        if (store?.display_name) setStoreName(store.display_name);
      } catch { /* 조회 실패 무시 */ }
    })();
  }, [slug]);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1400);
    } catch { /* 클립보드 불가 */ }
  }

  return (
    <main className="mx-auto max-w-[920px] px-4 py-10 sm:px-6">
      <MonoLabel className="text-primary">// 사장님 가이드</MonoLabel>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-primary">사장님 가이드</p>
          <h1 className="mt-2 text-foreground" style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.6rem)", fontWeight: 800, lineHeight: 1.2 }}>
            사장님이 7일 동안
            <br />
            Voxpop을 써보는 법
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Voxpop은 공개 리뷰를 늘리는 도구가 아닙니다. 손님이 공개 악평으로 쓰기 전, 사장님에게만 안전하게 남긴
            한마디를 운영 신호로 보여주는 서비스입니다.
          </p>
        </div>

        {/* 매장 카드 */}
        <aside className="border-bold bg-card p-4 shadow-hard">
          <p className="font-mono text-[11px] text-muted-foreground">현재 매장</p>
          <p className="mt-1 text-[16px] text-foreground" style={{ fontWeight: 700 }}>{storeName}</p>
          <div className="mt-4 space-y-1">
            <p className="font-mono text-[11px] text-muted-foreground">손님용 한마디 링크</p>
            <a href={customerUrl} target="_blank" rel="noreferrer" className="block truncate font-mono text-[12px] text-primary underline-offset-2 hover:underline">
              {slug ? customerUrl : "데모로 손님 화면 미리보기"}
            </a>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => copy("cust", customerUrl)} className="retro-btn px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                {copied === "cust" ? "복사됨" : "손님 링크 복사"}
              </button>
              {slug && (
                <button onClick={() => downloadStoreQR(slug)} className="retro-btn retro-btn--primary px-2.5 py-1 font-mono text-[11px]">
                  매장 QR 받기
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="font-mono text-[11px] text-muted-foreground">사장님 대시보드</p>
            <a href={ownerUrl} className="block truncate font-mono text-[12px] text-primary underline-offset-2 hover:underline">{ownerUrl}</a>
            <button onClick={() => copy("own", ownerUrl)} className="retro-btn mt-1 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              {copied === "own" ? "복사됨" : "대시보드 링크 복사"}
            </button>
          </div>
        </aside>
      </div>

      <Block cmd="// 서비스 한 줄 설명" title="이름 없이 말하고, 신호로 받습니다">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { t: "손님에게 안전", b: "이름과 연락처를 받지 않습니다. 공개 리뷰로 올라가지 않고 사장님에게만 전달됩니다." },
            { t: "사장님에게 실용", b: "칭찬, 불편, 긴급 확인, 반복 신호를 나눠서 보여줍니다. 읽고 끝나는 설문이 아닙니다." },
            { t: "공개 평판 전 단계", b: "별점이 떨어진 뒤가 아니라, 고칠 수 있을 때 작은 신호를 먼저 받는 데 목적이 있습니다." },
          ].map((c) => (
            <Card key={c.t} title={c.t}>{c.b}</Card>
          ))}
        </div>
      </Block>

      <Block cmd="// 7일 베타 사용 흐름" title="결제가 아니라 ‘한 번 굴러가는지’">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "10분 본인 테스트", b: "손님용 링크로 사장님이 직접 한마디를 남기고, 대시보드에서 정리본이 보이는지 확인합니다." },
            { n: "2", t: "QR 한 곳에 비치", b: "계산대, 픽업대, 테이블 중 손님이 자연스럽게 볼 수 있는 한 곳에 둡니다." },
            { n: "3", t: "7일 동안 확인", b: "응답 수보다 중요한 건 사장님이 대시보드를 보고 계속 둘 이유가 생기는지입니다." },
          ].map((s) => (
            <Card key={s.n} title={`${s.n}. ${s.t}`}>{s.b}</Card>
          ))}
        </div>
      </Block>

      <Block cmd="// 사장님 화면에서 보는 것" title="여섯 가지 신호">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "가림 처리된 한마디", b: "개인정보, 직원 지칭, 욕설 위험은 사장님 화면에 바로 노출하지 않습니다." },
            { t: "긴급 확인", b: "안전, 위생, 알레르기, 이물질처럼 먼저 확인할 신호를 따로 보여줍니다.", alert: true },
            { t: "오늘 볼 것", b: "오늘 볼 것, 근거, 다음 확인을 3줄로. 근거가 약하면 억지 액션을 만들지 않습니다." },
            { t: "반복 신호", b: "같은 주제 한마디가 2건 이상이면 반복 신호로 보여줍니다." },
            { t: "좋은 한마디", b: "칭찬도 따로 모아 보여줍니다. 다만 공개 리뷰 전환 버튼은 만들지 않습니다." },
            { t: "처리 상태", b: "새 한마디, 확인함, 조치함, 나중에 볼 것 상태로 가볍게 정리합니다." },
          ].map((f) => (
            <Card key={f.t} title={f.t} alert={f.alert}>{f.b}</Card>
          ))}
        </div>
      </Block>

      <Block cmd="// 매장 설치 순서" title="여섯 단계 체크리스트">
        <ul className="space-y-0">
          {[
            "손님용 QR 또는 링크를 받습니다.",
            "사장님이 먼저 직접 테스트 한마디를 남깁니다.",
            "사장님 화면에서 그 한마디가 보이는지 확인합니다.",
            "QR을 계산대, 픽업대, 테이블 중 한 곳에 둡니다.",
            "손님에게 억지로 부탁하지 않고 자연 응답을 봅니다.",
            "7일 뒤 계속 둘 이유가 있는지 함께 확인합니다.",
          ].map((t, i) => (
            <li key={i} className="flex gap-2 border-b border-border-soft py-3 text-[14px] text-muted-foreground last:border-b-0">
              <span className="font-mono text-primary">✓</span> {t}
            </li>
          ))}
        </ul>
        <div className="mt-5 border-bold bg-surface-raised p-4 shadow-hard-sm">
          <p className="font-mono text-[12px] text-foreground" style={{ fontWeight: 700 }}>손님에게 말할 때는 이렇게 짧게</p>
          <p className="mt-2 text-[14px] leading-relaxed text-foreground">
            “혹시 오늘 불편했거나 좋았던 점 있으면 QR로 한마디만 남겨주세요. 이름은 안 받고, 공개 리뷰로 올라가지 않고,
            사장님에게만 전달됩니다.”
          </p>
          <button
            onClick={() => copy("phrase", "혹시 오늘 불편했거나 좋았던 점 있으면 QR로 한마디만 남겨주세요. 이름은 안 받고, 공개 리뷰로 올라가지 않고, 사장님에게만 전달됩니다.")}
            className="retro-btn mt-3 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
          >
            {copied === "phrase" ? "복사됨" : "안내 문구 복사"}
          </button>
        </div>
      </Block>

      <Block cmd="// 자주 묻는 질문" title="궁금한 점">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { q: "손님 개인정보를 받나요?", a: "아니요. 이름, 전화번호, 이메일을 받지 않는 것이 기본 원칙입니다." },
            { q: "공개 리뷰로 올라가나요?", a: "아니요. Voxpop 한마디는 사장님에게만 전달됩니다." },
            { q: "가리기 전 원문을 볼 수 있나요?", a: "베타에서는 안전을 위해 가리기 전 원문을 바로 열어보지 않습니다. 필요한 신호만 가려서 보여드립니다." },
            { q: "응답이 0건이면 실패인가요?", a: "아니요. QR 위치, 문구, 손님 동선, 사장님 설명 부담 중 어디가 막혔는지 보는 신호입니다." },
            { q: "돈은 언제 내나요?", a: "7일 베타에서는 결제가 목적이 아닙니다. 계속 둘 이유가 있는지 먼저 확인합니다." },
            { q: "여러 기기에서 상태가 같나요?", a: "처리 상태는 매장 로그인 계정 기준으로 저장돼 기기·세션과 무관하게 일관됩니다." },
          ].map((f) => (
            <div key={f.q} className="border-bold bg-card p-4 shadow-hard-sm">
              <p className="text-[14px] text-foreground" style={{ fontWeight: 700 }}>{f.q}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </Block>

      <footer className="mt-12 border-t border-border pt-6 text-center font-mono text-[12px] text-muted-foreground">
        Voxpop 사장님 가이드 · 문의 <a href="mailto:tototal5542@gmail.com" className="text-primary underline-offset-2 hover:underline">tototal5542@gmail.com</a>
        <div className="mt-2">
          <Link to="/" className="underline-offset-4 hover:underline">← voxpop 소개</Link>
        </div>
      </footer>
    </main>
  );
}

function Block({ cmd, title, children }: { cmd: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <MonoLabel>{cmd}</MonoLabel>
      <h2 className="mt-3 text-foreground" style={{ fontSize: "clamp(1.2rem, 2.6vw, 1.7rem)", fontWeight: 800 }}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Card({ title, children, alert }: { title: string; children: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`p-4 ${alert ? "sticky-card sticky-card--urgent" : "border-bold bg-card shadow-hard-sm"}`}>
      <p className={`text-[14px] ${alert ? "text-coral-foreground" : "text-foreground"}`} style={{ fontWeight: 700 }}>{title}</p>
      <p className={`mt-2 text-[13px] leading-relaxed ${alert ? "text-coral-foreground/90" : "text-muted-foreground"}`}>{children}</p>
    </div>
  );
}
