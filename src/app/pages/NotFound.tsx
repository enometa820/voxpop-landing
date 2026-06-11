import { Link } from "react-router";
import { TerminalWindow } from "../components/terminal/TerminalWindow";

export function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[640px] items-center px-4">
      <TerminalWindow title="voxpop — error" className="w-full">
        <p className="text-foreground">$ voxpop open --path “{location.pathname}”</p>
        <p className="text-destructive">→ 404: 그 페이지는 어디에도 없어요.</p>
        <p className="mt-3 text-muted-foreground">
          › 무기명 daemon은 잘 돌고 있습니다. 길을 잃었을 뿐이에요.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-lg border border-border bg-card px-3 py-1.5 text-primary transition-colors hover:bg-surface-raised"
        >
          [ cd / ] 홈으로
          <span className="vox-cursor ml-1">█</span>
        </Link>
      </TerminalWindow>
    </main>
  );
}
