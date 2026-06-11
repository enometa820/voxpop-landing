import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { MonoLabel } from "../components/terminal/MonoLabel";
import {
  sendMagicLink,
  getCurrentSession,
  signOut,
  fetchOwnerStores,
  insertStore,
  toggleStoreActive,
  fetchOwnerFeedback,
  fetchFeedbackRaw,
} from "../../lib/supabase-client.js";
import { ADMIN_EMAILS } from "../../lib/config.js";
import { REVIEW_FLAG, REVIEW_FLAG_LABEL, triageSort } from "../../lib/review-engine.js";
import { downloadStoreQR, storeFormUrl } from "../lib/qr";

type Store = { id: string; slug: string; display_name: string; owner_email?: string; owner_label?: string; active?: boolean };
type ReviewItem = {
  id: string; store_id?: string; created_at?: string;
  content_clean?: string; urgency?: string; categories?: string[];
  pii_removed?: boolean; profanity_removed?: boolean;
};

function genSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export function Admin() {
  const [phase, setPhase] = useState<"loading" | "signin" | "dashboard">("loading");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  // 매장 등록 폼
  const [slug, setSlug] = useState(genSlug());
  const [displayName, setDisplayName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerLabel, setOwnerLabel] = useState("");

  // 검수
  const [reviewStoreId, setReviewStoreId] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[] | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => { void init(); }, []);

  async function init() {
    const session = await getCurrentSession();
    if (!session) { setPhase("signin"); return; }
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      setPhase("signin");
      setNotice({ text: "등록된 관리자가 아닙니다.", error: true });
      return;
    }
    setPhase("dashboard");
    await loadStores();
  }

  async function loadStores() {
    try {
      const list = await fetchOwnerStores();
      setStores(list as Store[]);
    } catch (e) {
      toast.error("매장 목록을 불러오지 못했어요: " + (e as Error).message);
    }
  }

  async function handleSignin() {
    const e = email.trim();
    if (!e.includes("@")) { setNotice({ text: "이메일을 정확히 입력해주세요.", error: true }); return; }
    if (!ADMIN_EMAILS.includes(e)) { setNotice({ text: "등록된 관리자 이메일이 아닙니다.", error: true }); return; }
    try {
      await sendMagicLink(e, `${location.origin}/admin`);
      setNotice({ text: "로그인 링크를 보냈어요. 이메일을 확인해주세요.", error: false });
    } catch (err) {
      setNotice({ text: "발송 실패: " + (err as Error).message, error: true });
    }
  }

  async function handleAddStore() {
    if (!displayName.trim()) { toast.error("매장 표시명을 입력하세요."); return; }
    if (!ownerEmail.includes("@")) { toast.error("사장님 이메일을 입력하세요."); return; }
    try {
      const stored = await insertStore({ slug, display_name: displayName.trim(), owner_email: ownerEmail.trim(), owner_label: ownerLabel.trim() || null });
      const storedSlug = (stored as Store)?.slug ?? slug;
      toast.success(`${displayName} 등록 완료. QR을 내려받았어요.`);
      try { await downloadStoreQR(storedSlug); } catch { /* 목록 버튼으로 재시도 가능 */ }
      setDisplayName(""); setOwnerEmail(""); setOwnerLabel(""); setSlug(genSlug());
      await loadStores();
    } catch (err) {
      toast.error("등록 실패: " + (err as Error).message);
    }
  }

  async function handleToggle(s: Store) {
    try {
      await toggleStoreActive(s.id, !s.active);
      toast.success(`${s.display_name} ${!s.active ? "활성화" : "비활성화"} 완료`);
      await loadStores();
    } catch (err) {
      toast.error("상태 변경 실패: " + (err as Error).message);
    }
  }

  async function loadReview() {
    if (!reviewStoreId) { toast.error("매장을 선택해주세요."); return; }
    setReviewLoading(true);
    setReviewItems(null);
    try {
      const all = await fetchOwnerFeedback();
      const items = (all as ReviewItem[]).filter((f) => f.store_id === reviewStoreId);
      const sorted = triageSort(
        items.map((f) => ({
          id: f.id, storeId: f.store_id, submittedAt: f.created_at,
          content_clean: f.content_clean,
          urgent: f.urgency === "high",
          categories: f.categories ?? [],
          pii_removed: f.pii_removed, profanity_removed: f.profanity_removed,
          reviewFlag: REVIEW_FLAG.UNREVIEWED,
        })),
      );
      setReviewItems(sorted as ReviewItem[]);
    } catch (e) {
      toast.error("불러오기 실패: " + (e as Error).message);
    } finally {
      setReviewLoading(false);
    }
  }

  // ── 렌더 ──
  if (phase === "loading") {
    return (
      <main className="mx-auto max-w-[500px] px-4 py-16">
        <TerminalWindow title="voxpop@admin ~ %">
          <p className="text-muted-foreground">관리자 인증 확인 중<span className="vox-cursor ml-1 text-primary">█</span></p>
        </TerminalWindow>
      </main>
    );
  }

  if (phase === "signin") {
    return (
      <main className="mx-auto max-w-[440px] px-4 py-12">
        <TerminalWindow title="voxpop — 운영자 로그인">
          <div className="space-y-4 py-1">
            <MonoLabel className="text-primary">$ voxpop admin --login</MonoLabel>
            <p className="text-[14px] text-foreground">운영자 전용 화면입니다. 등록된 관리자 이메일로만 접근됩니다.</p>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignin()}
              placeholder="관리자 이메일"
              className="w-full rounded-lg border border-border bg-input-background px-3 py-2.5 font-mono text-[14px] text-foreground outline-none focus:border-primary"
            />
            <button onClick={handleSignin} className="w-full rounded-lg border border-primary bg-primary px-4 py-2.5 font-mono text-[13px] text-primary-foreground hover:opacity-95">
              [ 로그인 링크 받기 → ]
            </button>
            {notice && <p className={`font-mono text-[12px] ${notice.error ? "text-destructive" : "text-primary"}`}>{notice.text}</p>}
          </div>
        </TerminalWindow>
        <Link to="/" className="mt-4 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">← voxpop 소개</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="text-primary">●</span>
          <span className="font-mono text-foreground">voxpop@admin</span>
          <span className="font-mono text-[11px] text-muted-foreground">— 운영자</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={async () => { await signOut(); location.reload(); }} className="font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">로그아웃</button>
          <Link to="/" className="font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">← 소개</Link>
        </div>
      </div>

      {/* 매장 등록 */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-2.5"><MonoLabel className="text-primary">// 매장 등록</MonoLabel></div>
        <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[11px] text-muted-foreground">매장 표시명</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="우리 카페"
              className="mt-1 w-full rounded-md border border-border bg-input-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] text-muted-foreground">사장님 이메일</span>
            <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@example.com"
              className="mt-1 w-full rounded-md border border-border bg-input-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] text-muted-foreground">사장님 라벨 (선택)</span>
            <input value={ownerLabel} onChange={(e) => setOwnerLabel(e.target.value)} placeholder="사장 A"
              className="mt-1 w-full rounded-md border border-border bg-input-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:border-primary" />
          </label>
          <div className="block">
            <span className="font-mono text-[11px] text-muted-foreground">slug (자동 생성 · 실명 금지)</span>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-[13px] text-foreground">{slug}</code>
              <button onClick={() => setSlug(genSlug())} className="rounded-md border border-border bg-card px-2 py-2 font-mono text-[11px] text-muted-foreground hover:bg-surface-raised">새로</button>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-4 py-3">
          <button onClick={handleAddStore} className="rounded-lg border border-primary bg-primary px-4 py-2 font-mono text-[13px] text-primary-foreground hover:opacity-95">
            [ 등록 + QR 다운로드 → ]
          </button>
        </div>
      </div>

      {/* 매장 목록 */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-2.5"><MonoLabel>// 매장 목록 {stores.length ? `(${stores.length})` : ""}</MonoLabel></div>
        <ul>
          {stores.length === 0 ? (
            <li className="px-4 py-4 font-mono text-[12px] text-muted-foreground">아직 등록된 매장이 없습니다.</li>
          ) : (
            stores.map((s, i) => (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${i < stores.length - 1 ? "border-b border-border-soft" : ""} ${s.active ? "" : "opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[12px] text-primary">{s.slug}</p>
                  <p className="text-[14px] text-foreground">{s.display_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{s.owner_label || ""} {s.owner_email ? `· ${s.owner_email}` : ""}</p>
                </div>
                <a href={storeFormUrl(s.slug)} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-primary underline-offset-2 hover:underline">URL 열기</a>
                <button onClick={() => downloadStoreQR(s.slug)} className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-surface-raised">QR PNG</button>
                <button onClick={() => handleToggle(s)} className={`rounded-md border px-2 py-1 font-mono text-[11px] ${s.active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
                  {s.active ? "활성" : "비활성"}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 검수 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <MonoLabel>// 가림 검수 (운영자 전용)</MonoLabel>
          <div className="flex items-center gap-2">
            <select value={reviewStoreId} onChange={(e) => setReviewStoreId(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[12px] text-foreground">
              <option value="">매장 선택…</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.display_name} ({s.slug})</option>)}
            </select>
            <button onClick={loadReview} className="rounded-md border border-primary bg-primary px-3 py-1 font-mono text-[11px] text-primary-foreground">불러오기</button>
          </div>
        </div>
        <div className="px-4 py-4">
          {reviewLoading ? (
            <p className="font-mono text-[12px] text-muted-foreground">불러오는 중…</p>
          ) : reviewItems == null ? (
            <p className="font-mono text-[12px] text-muted-foreground">매장을 선택하고 불러오기를 누르세요. 가림본과 원본(운영자 전용)을 대조해 가림 정확도를 점검합니다.</p>
          ) : reviewItems.length === 0 ? (
            <p className="font-mono text-[12px] text-muted-foreground">이 매장에 아직 한마디가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                전체 {reviewItems.length}건 · 긴급 {reviewItems.filter((i) => i.urgency === "high").length}건
              </p>
              {reviewItems.map((item) => <ReviewCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const [flag, setFlag] = useState<string>(REVIEW_FLAG.UNREVIEWED);
  const [raw, setRaw] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const masked = item.pii_removed || item.profanity_removed;
  const exposure = item.urgency === "high" ? "민감 보류" : masked ? "가림 후 표시" : "정상 노출";

  async function toggleRaw() {
    if (rawOpen) { setRawOpen(false); return; }
    setRawOpen(true);
    if (raw == null) {
      try { setRaw((await fetchFeedbackRaw(item.id)) ?? "(원본 없음)"); }
      catch (e) { setRaw("원본 로드 실패: " + (e as Error).message); }
    }
  }

  return (
    <div className={`rounded-lg border p-3 ${item.urgency === "high" ? "border-destructive/40 bg-destructive/5" : "border-border-soft"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {item.urgency === "high" && <span className="font-mono text-[10px] text-destructive">[긴급]</span>}
        <span className="font-mono text-[10px] text-muted-foreground">{exposure}</span>
        <span className="font-mono text-[10px] text-primary">{REVIEW_FLAG_LABEL[flag] ?? "미검수"}</span>
        {item.categories?.length ? <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{item.categories.join("·")}</span> : null}
      </div>
      <p className="mt-2 text-[14px] text-foreground"><b className="font-mono text-[11px] text-muted-foreground">가림본</b> {item.content_clean ?? "(없음)"}</p>
      {rawOpen && (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
          <p className="font-mono text-[10px] text-destructive">운영자 전용 — 외부 공유 금지</p>
          <p className="mt-1 text-[13px] text-foreground">{raw ?? "불러오는 중…"}</p>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={toggleRaw} className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-surface-raised">
          {rawOpen ? "원본 숨기기" : "원본 보기"}
        </button>
        <span className="font-mono text-[10px] text-muted-foreground">오탐:</span>
        {[
          { f: REVIEW_FLAG.ACCURATE, label: "가림 정확" },
          { f: REVIEW_FLAG.OVER, label: "과가림" },
          { f: REVIEW_FLAG.UNDER, label: "미가림" },
        ].map(({ f, label }) => (
          <button key={f} onClick={() => setFlag(f)} className={`rounded-md border px-2 py-1 font-mono text-[10px] ${flag === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-surface-raised"}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
