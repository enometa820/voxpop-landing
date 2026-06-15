import { Link } from "react-router";
import { MonoLabel } from "../components/terminal/MonoLabel";

export function Privacy() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <MonoLabel className="text-primary">// 개인정보 처리방침</MonoLabel>
      <h1 className="mt-4 text-foreground" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800 }}>
        개인정보처리방침
      </h1>
      <p className="mt-2 font-mono text-[12px] text-muted-foreground">시행일: 2026년 6월 10일 · 베타 운영본</p>

      <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
        Voxpop(이하 “서비스”)은 손님의 익명성을 보호하는 것을 최우선으로 설계되었습니다. 본 방침은 서비스가 어떤 정보를
        어떻게 다루는지를 투명하게 안내합니다.
      </p>

      <Section n="1" title="수집하는 정보와 목적">
        <p>서비스는 손님의 이름·전화번호·이메일 등 직접 식별 정보를 받지 않습니다. 수집 항목은 다음과 같습니다.</p>
        <div className="mt-3 overflow-hidden border-bold shadow-hard-sm">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-raised">
                <th className="border-b border-border px-3 py-2 text-left font-mono text-[12px]">대상</th>
                <th className="border-b border-border px-3 py-2 text-left font-mono text-[12px]">항목</th>
                <th className="border-b border-border px-3 py-2 text-left font-mono text-[12px]">목적</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr>
                <td className="border-b border-border-soft px-3 py-2 align-top">손님(피드백 작성자)</td>
                <td className="border-b border-border-soft px-3 py-2 align-top">별점, 피드백 내용, 기기 식별 해시(device hash), 접속 IP 해시(ip hash)</td>
                <td className="border-b border-border-soft px-3 py-2 align-top">피드백 전달, 중복·악용 방지(같은 기기 과다 제출 차단). 이름·연락처는 받지 않음</td>
              </tr>
              <tr>
                <td className="border-b border-border-soft px-3 py-2 align-top">사장님·운영자</td>
                <td className="border-b border-border-soft px-3 py-2 align-top">이메일 주소</td>
                <td className="border-b border-border-soft px-3 py-2 align-top">로그인 링크(Magic Link) 발송, 대시보드 접근 권한 확인</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">방문자</td>
                <td className="px-3 py-2 align-top">쿠키·접속 로그(Google Tag Manager·Analytics)</td>
                <td className="px-3 py-2 align-top">방문 통계 분석, 서비스 개선</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          손님이 입력한 원문에 욕설·전화번호·계좌·직원 지칭 등이 포함되면, 서비스는 이를 자동으로 가린 문장만 사장님에게
          보여줍니다. 원문은 운영자만 접근할 수 있도록 분리 저장·보호됩니다.
        </p>
      </Section>

      <Section n="2" title="기기·IP 해시 처리">
        <p>
          기기 식별값과 접속 IP는 원래 값을 저장하지 않고 복원 불가능한 해시(SHA-256)로만 저장합니다. 이는 같은 기기의
          과다 제출을 막기 위한 것이며, 특정 개인을 식별하거나 사장님에게 제공하는 데 사용하지 않습니다.
        </p>
      </Section>

      <Section n="3" title="보유 및 이용 기간">
        <p>
          수집한 정보는 서비스 제공 목적이 달성되거나 이용자가 삭제를 요청하면 지체 없이 파기합니다. 베타 운영 기간에
          수집한 정보는 베타 종료 후 30일 이내에 파기하며, 이용자가 그 전에 삭제를 요청하면 즉시 파기합니다.
        </p>
      </Section>

      <Section n="4" title="제3자 처리 위탁">
        <p>서비스 운영을 위해 다음 사업자에 데이터 처리를 위탁합니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><b className="text-foreground">Supabase</b> — 데이터베이스·인증(피드백·이메일 저장)</li>
          <li><b className="text-foreground">Resend</b> — 긴급 알림 이메일 발송(사장님 대상)</li>
          <li><b className="text-foreground">Google</b> — 방문 통계(Tag Manager·Analytics)</li>
        </ul>
      </Section>

      <Section n="5" title="쿠키">
        <p>
          서비스는 방문 통계를 위해 Google Tag Manager·Analytics 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수
          있으며, 거부해도 손님의 피드백 작성에는 지장이 없습니다.
        </p>
      </Section>

      <Section n="6" title="이용자의 권리">
        <p>
          이용자는 자신의 정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있습니다. 다만 손님의 피드백은 무기명으로
          저장되어 작성자 본인조차 시스템상 특정되지 않으므로, 스레드 링크를 보유한 경우에 한해 해당 피드백을 식별·요청할
          수 있습니다.
        </p>
      </Section>

      <Section n="7" title="개인정보 보호책임자·문의">
        <p>개인정보 관련 문의는 아래로 연락해 주세요.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>운영 주체: Voxpop (1인 운영)</li>
          <li>이메일: <a className="text-primary underline-offset-2 hover:underline" href="mailto:tototal5542@gmail.com">tototal5542@gmail.com</a></li>
        </ul>
        <p className="mt-2">본 방침은 베타 운영 기준이며, 정식 서비스 전환 시 보완·갱신됩니다.</p>
      </Section>

      <Section n="8" title="방침 변경">
        <p>본 방침이 변경될 경우 시행일과 변경 내용을 이 페이지에 공지합니다.</p>
      </Section>

      <footer className="mt-12 border-t border-border pt-6 font-mono text-[12px] text-muted-foreground">
        © 2026 Voxpop · <Link to="/" className="text-primary underline-offset-2 hover:underline">홈으로</Link>
      </footer>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-baseline gap-2 text-foreground" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
        <span className="font-mono text-[13px] text-primary">{n}.</span> {title}
      </h2>
      <div className="mt-2 space-y-1 text-[14px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
