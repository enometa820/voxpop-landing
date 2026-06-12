import { Link } from "react-router";
import { RetroWindow } from "../components/retro/RetroWindow";

export function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[640px] items-center px-4">
      <RetroWindow title="voxpop — 오류" className="w-full" bodyClassName="font-mono text-[13px] leading-relaxed text-foreground">
        <p className="text-foreground">찾는 페이지가 없어요 — {location.pathname}</p>
        <div className="mt-3 sticky-card sticky-card--urgent px-3.5 py-2.5">
          <p className="font-mono text-[13px] font-bold text-coral-foreground">→ 404: 그 페이지는 어디에도 없어요.</p>
        </div>
        <p className="mt-3 text-muted-foreground">
          › voxpop은 잘 돌고 있어요. 길을 잠깐 잃었을 뿐이에요.
        </p>
        <Link
          to="/"
          className="retro-btn retro-btn--primary mt-4 inline-block px-3.5 py-1.5 font-mono text-[13px]"
        >
          [ 홈으로 ]
          <span className="vox-cursor ml-1">█</span>
        </Link>
      </RetroWindow>
    </main>
  );
}
