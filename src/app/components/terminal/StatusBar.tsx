/**
 * Top status bar: ● voxpop daemon — running · 무기명 · 자동 가림 · 공개 리뷰 아님
 */
export function StatusBar() {
  return (
    <div className="w-full border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1200px] items-center gap-2 overflow-x-auto whitespace-nowrap px-4 py-1.5 font-mono text-[11px] text-muted-foreground">
        <span className="text-primary">●</span>
        <span className="text-foreground">voxpop</span>
        <span className="text-border">·</span>
        <span>무기명</span>
        <span className="text-border">·</span>
        <span>자동 가림</span>
        <span className="text-border">·</span>
        <span>공개 리뷰 아님</span>
      </div>
    </div>
  );
}
