import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { TerminalWindow } from "../components/terminal/TerminalWindow";
import { MonoLabel } from "../components/terminal/MonoLabel";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { PixelTree } from "../components/mascots/PixelTree";
import {
  sendMagicLink,
  getCurrentSession,
  signOut,
  fetchOwnerStores,
  fetchOwnerFeedback,
  fetchStoreActions,
  insertStoreAction,
  fetchStoreSlime,
  fetchStoreMemory,
  upsertStoreSlime,
  insertOwnerResponse,
  fetchOwnerResponses,
  fetchFeedbackStatus,
  upsertFeedbackStatus,
} from "../../lib/supabase-client.js";
import { suggestResponses } from "../../lib/response-templates.js";
import { aggregateByCategory } from "../../lib/trend-aggregate.js";
import {
  buildSlimeState,
  slimeBubble,
  growthFromPoints,
  growthGateOpen,
  computeHealth,
  applyKAnon,
} from "../../lib/slime-engine.js";
import {
  OWNER_STATUSES,
  type OwnerStatus,
  type Feedback,
  getOwnerStatus,
  formatTime,
  sentimentBadge,
  urgencyBadge,
  getCategories,
  primaryCategory,
  isUrgentFeedback,
  isPositiveFeedback,
  isNegativeFeedback,
  isOpenFeedback,
  buildRepeatSignals,
  buildTodayAction,
  slimeItemsFor,
  moodLabel,
  treeLevelFromPoints,
} from "../lib/owner";

type Store = { id: string; slug?: string; display_name?: string };
type OwnerResponse = { id: string; feedback_id: string; body: string; seen_by_customer?: boolean };

const OWNER_STATUS_KEY = "voxpop-owner-status-v1";
function loadStatusMap(): Record<string, OwnerStatus> {
  try { return JSON.parse(localStorage.getItem(OWNER_STATUS_KEY) || "{}"); } catch { return {}; }
}
function saveStatusMap(map: Record<string, OwnerStatus>) {
  try { localStorage.setItem(OWNER_STATUS_KEY, JSON.stringify(map)); } catch { /* 무시 */ }
}

export function OwnerDashboard() {
  const [phase, setPhase] = useState<"loading" | "signin" | "dashboard">("loading");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [stores, setStores] = useState<Store[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [slimeActions, setSlimeActions] = useState<{ id: string }[]>([]);
  const [slimeRow, setSlimeRow] = useState<{ growth_points?: number; stage?: number } | null>(null);
  const [slimeMemory, setSlimeMemory] = useState<{ insights?: { content: string }[] } | null>(null);
  const [responses, setResponses] = useState<Record<string, OwnerResponse[]>>({});
  const [trendWindow, setTrendWindow] = useState<"7d" | "24h">("7d");

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const session = await getCurrentSession();
      if (!session) { setPhase("signin"); return; }
      setUserEmail(session.user.email);

      const [storeList, fbList, statusMap] = await Promise.all([
        fetchOwnerStores(),
        fetchOwnerFeedback(),
        fetchFeedbackStatus().catch(() => ({})),
      ]);
      const localMap = loadStatusMap();
      const merged: Feedback[] = (fbList as Feedback[]).map((f) => ({
        ...f,
        owner_status: (statusMap as Record<string, OwnerStatus>)[f.id] || localMap[f.id] || "new",
      }));

      const firstStore = (storeList as Store[])[0]?.id ?? null;
      const storeId = selectedStoreId ?? firstStore;

      if (storeId) {
        try {
          const [actions, row, memory] = await Promise.all([
            fetchStoreActions(storeId),
            fetchStoreSlime(storeId),
            fetchStoreMemory(storeId).catch(() => null),
          ]);
          setSlimeActions(actions || []);
          setSlimeRow(row || null);
          setSlimeMemory(memory || null);
        } catch {
          setSlimeActions([]); setSlimeRow(null); setSlimeMemory(null);
        }
      }

      try {
        const respList = await fetchOwnerResponses(merged.map((f) => f.id));
        const map: Record<string, OwnerResponse[]> = {};
        (respList as OwnerResponse[]).forEach((r) => {
          (map[r.feedback_id] ||= []).push(r);
        });
        setResponses(map);
      } catch { setResponses({}); }

      setStores(storeList as Store[]);
      setFeedback(merged);
      setSelectedStoreId(storeId);
      setPhase("dashboard");
    } catch {
      setPhase("signin");
      setNotice({ text: "대시보드를 불러오지 못했어요. 다시 로그인해주세요.", error: true });
    }
  }

  async function handleSignin() {
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setNotice({ text: "올바른 이메일 주소를 입력해주세요.", error: true });
      return;
    }
    try {
      await sendMagicLink(e, `${location.origin}/owner`);
      setNotice({ text: "로그인 링크를 보냈어요. 이메일을 확인해주세요.", error: false });
    } catch {
      setNotice({ text: "로그인 링크 발송 실패. 잠시 후 다시 시도해주세요.", error: true });
    }
  }

  async function handleSignout() {
    await signOut();
    location.reload();
  }

  // ── 파생 ──────────────────────────────────────────────
  const filtered = useMemo(
    () => (selectedStoreId ? feedback.filter((f) => f.stores?.id === selectedStoreId) : feedback),
    [feedback, selectedStoreId],
  );
  const openFeedback = useMemo(() => filtered.filter(isOpenFeedback), [filtered]);
  const urgentList = useMemo(() => openFeedback.filter(isUrgentFeedback), [openFeedback]);
  const positiveList = useMemo(() => filtered.filter(isPositiveFeedback).slice(0, 5), [filtered]);
  const historyList = useMemo(
    () => filtered.filter((f) => ["seen", "acted"].includes(getOwnerStatus(f))),
    [filtered],
  );
  const todayAction = useMemo(() => buildTodayAction(filtered), [filtered]);
  const repeats = useMemo(
    () => applyKAnon(buildRepeatSignals(filtered), 3, "count") as (ReturnType<typeof buildRepeatSignals>[number] & { hidden?: boolean })[],
    [filtered],
  );
  const trend = useMemo(() => aggregateByCategory(filtered, { window: trendWindow }), [filtered, trendWindow]);

  const slimeState = useMemo(() => {
    const items = slimeItemsFor(selectedStoreId, feedback);
    return buildSlimeState(items, slimeActions, slimeRow || {});
  }, [feedback, selectedStoreId, slimeActions, slimeRow]);

  const treeLevel = treeLevelFromPoints(slimeRow?.growth_points);
  const unresolvedRisk = slimeState?.unresolvedRisk ?? 0;
  const memoryLine = slimeMemory?.insights?.[0]?.content || "";
  const bubble = memoryLine || slimeBubble(
    { state: filtered.length ? "normal" : "empty", todayAction: todayAction.kind !== "empty" ? todayAction.title : "" },
    slimeState,
  );

  // ── 쓰기 ──────────────────────────────────────────────
  async function setStatus(id: string, status: OwnerStatus) {
    const map = loadStatusMap();
    map[id] = status;
    saveStatusMap(map);
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, owner_status: status } : f)));
    const item = feedback.find((f) => f.id === id);
    const storeId = item?.stores?.id ?? selectedStoreId;
    if (!storeId) return;
    try { await upsertFeedbackStatus(id, storeId, status); } catch { /* 로컬 캐시 유지 */ }
  }

  async function handleResolve(item: Feedback) {
    if (!selectedStoreId) return;
    try {
      const action = await insertStoreAction(selectedStoreId, item.id, "resolved");
      const nextActions = [action, ...slimeActions];
      setSlimeActions(nextActions);
      const items = slimeItemsFor(selectedStoreId, feedback);
      const health = computeHealth(items, nextActions);
      if (growthGateOpen(health.score)) {
        const nextPoints = (slimeRow?.growth_points ?? 0) + 1;
        const grown = growthFromPoints(nextPoints, slimeRow?.stage ?? 0);
        const updated = await upsertStoreSlime(selectedStoreId, nextPoints, grown.stage);
        setSlimeRow(updated);
      }
      await setStatus(item.id, "acted");
      toast.success("조치로 기록했어요. 가게가 건강하면 나무가 자랍니다.");
    } catch {
      toast.error("기록 중 오류가 났어요. 잠시 후 다시 시도해주세요.");
    }
  }

  async function handleReply(item: Feedback, body: string) {
    const text = body.trim();
    if (!text) return;
    const storeId = item.stores?.id || selectedStoreId;
    if (!storeId) return;
    try {
      const saved = await insertOwnerResponse(item.id, storeId, text, "comment");
      setResponses((prev) => ({ ...prev, [item.id]: [...(prev[item.id] || []), saved as OwnerResponse] }));
      toast.success("답을 보냈어요. 손님은 영수증 링크로 확인합니다.", {
        description: "사장님은 누가 썼는지 끝까지 모릅니다.",
      });
    } catch {
      toast.error("답 보내기에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  // ── 렌더 ──────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <main className="mx-auto max-w-[500px] px-4 py-16">
        <TerminalWindow title="voxpop@store ~ %">
          <p className="text-muted-foreground">
            대시보드를 불러오는 중<span className="vox-cursor ml-1 text-primary">█</span>
          </p>
        </TerminalWindow>
      </main>
    );
  }

  if (phase === "signin") {
    return (
      <main className="mx-auto max-w-[440px] px-4 py-12">
        <TerminalWindow title="voxpop — 사장 로그인">
          <div className="space-y-4 py-1">
            <MonoLabel className="text-primary">$ voxpop login --magic-link</MonoLabel>
            <p className="text-[14px] leading-relaxed text-foreground">
              이메일로 로그인 링크를 보내드려요. 비밀번호 없이 링크만 누르면 대시보드가 열려요.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignin()}
              placeholder="이메일 주소"
              className="w-full rounded-lg border border-border bg-input-background px-3 py-2.5 font-mono text-[14px] text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSignin}
              className="w-full rounded-lg border border-primary bg-primary px-4 py-2.5 font-mono text-[13px] text-primary-foreground shadow-sm transition-all hover:opacity-95"
            >
              [ 로그인 링크 받기 → ]
            </button>
            {notice && (
              <p className={`font-mono text-[12px] ${notice.error ? "text-destructive" : "text-primary"}`}>
                {notice.text}
              </p>
            )}
          </div>
        </TerminalWindow>
        <Link to="/" className="mt-4 block text-center font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">
          ← voxpop 소개
        </Link>
      </main>
    );
  }

  // dashboard
  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];
  const noFeedback = stores.length > 0 && filtered.length === 0;

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6">
      {/* 헤더 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="text-primary">●</span>
          <span className="font-mono text-foreground">voxpop@{selectedStore?.display_name || "내가게"}</span>
          <span className="font-mono text-[11px] text-muted-foreground">— 사장 대시보드</span>
        </div>
        <div className="flex items-center gap-3">
          {stores.length >= 2 && (
            <select
              value={selectedStoreId || ""}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
              className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[12px] text-foreground"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.display_name}</option>
              ))}
            </select>
          )}
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">{userEmail}</span>
          <button onClick={handleSignout} className="font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">
            로그아웃
          </button>
          <Link to="/" className="font-mono text-[12px] text-muted-foreground underline-offset-4 hover:underline">← 소개</Link>
        </div>
      </div>

      {/* 긴급 배너 */}
      {urgentList.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
          <span className="font-mono text-[12px] text-destructive">[긴급 {urgentList.length}]</span>
          <p className="font-mono text-[12px] text-foreground">
            아직 확인하지 않은 긴급 한마디가 있어요. 안전·위생 신호일 수 있으니 먼저 확인해주세요.
          </p>
        </div>
      )}

      {/* 온보딩 (첫 한마디 없음) */}
      {noFeedback && (
        <div className="mb-5 rounded-xl border border-border bg-card px-5 py-6">
          <MonoLabel className="text-primary">// 첫 한마디를 기다리는 중</MonoLabel>
          <p className="mt-2 text-[14px] text-muted-foreground">
            QR 포스터를 붙여 손님의 첫 목소리를 받아보세요.
          </p>
          {selectedStore?.slug && (
            <a
              href={`/s?store=${encodeURIComponent(selectedStore.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-lg border border-primary bg-primary px-3 py-1.5 font-mono text-[12px] text-primary-foreground"
            >
              [ 직접 폼 열어보기 → ]
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 왼쪽: 매장 나무 + 신호 */}
        <div className="space-y-5 lg:col-span-1">
          {/* 매장 나무 */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="border-b border-border px-4 py-2.5"><MonoLabel>// 매장 나무</MonoLabel></div>
            <div className="flex flex-col items-center gap-3 px-4 py-6">
              <div className="w-28">
                <PixelTree level={treeLevel} health={unresolvedRisk > 0 ? "wilting" : "healthy"} cell={8} />
              </div>
              <AsciiProgress value={Math.round((slimeState?.growthProgress ?? 0) * 10)} max={10} label={slimeState?.stageName || "새싹"} />
              <p className="rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-center font-mono text-[12px] text-foreground">
                {bubble}
              </p>
              <div className="flex gap-3 font-mono text-[11px] text-muted-foreground">
                <span>기분 {moodLabel(slimeState?.mood)}</span>
                <span>건강 {slimeState?.health ?? "-"}점</span>
                {unresolvedRisk > 0 && <span className="text-destructive">미조치 위험 {unresolvedRisk}</span>}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/70">
                건강은 사장님만 봅니다 · 손님에겐 성장만
              </p>
            </div>
          </div>

          {/* 신호 (카테고리) */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <MonoLabel>// 신호 (카테고리)</MonoLabel>
              <div className="flex gap-1 font-mono text-[10px]">
                {(["7d", "24h"] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setTrendWindow(w)}
                    className={`rounded px-1.5 py-0.5 ${trendWindow === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-raised"}`}
                  >
                    {w === "7d" ? "7일" : "24시간"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2.5 px-4 py-4">
              {trend.categories.length === 0 ? (
                <p className="font-mono text-[12px] text-muted-foreground">아직 분류된 한마디가 없어요.</p>
              ) : (
                trend.categories.map((c: { category: string; count: number; urgentCount: number }) => {
                  const max = trend.categories[0].count || 1;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-mono text-[12px] text-muted-foreground">{c.category}</span>
                      <AsciiProgress
                        value={c.count}
                        max={max}
                        segments={10}
                        tone={c.urgentCount > 0 ? "destructive" : "primary"}
                        label={`${c.count}${c.urgentCount ? ` · 긴급 ${c.urgentCount}` : ""}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 반복 신호 */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
            <div className="border-b border-border px-4 py-2.5"><MonoLabel>// 반복 신호</MonoLabel></div>
            <div className="space-y-2 px-4 py-4">
              {repeats.length === 0 ? (
                <p className="font-mono text-[12px] text-muted-foreground">아직 반복 신호는 없어요.</p>
              ) : (
                repeats.map((s) => {
                  const strong = !s.hidden && (s.count >= 3 || s.lowCount >= 2);
                  return (
                    <div key={s.category} className="rounded-md border border-border-soft px-3 py-2">
                      <p className="font-mono text-[12px] text-foreground">
                        <b>{s.category}</b>{" "}
                        <span className={strong ? "text-destructive" : "text-muted-foreground"}>
                          {s.hidden ? "소수 신호" : strong ? "강한 반복" : "반복"}
                        </span>
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {s.hidden
                          ? "아직 소수라 정확한 수치는 가립니다(소표본 보호)."
                          : `같은 주제 ${s.count}건${s.lowCount ? ` · 낮은 신호 ${s.lowCount}건` : ""}.`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 오늘 볼 것 + 한마디 섹션 */}
        <div className="space-y-5 lg:col-span-2">
          <div className={`overflow-hidden rounded-xl border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)] ${todayAction.kind === "urgent" ? "border-destructive/40" : "border-border"}`}>
            <div className="border-b border-border px-4 py-2.5"><MonoLabel className="text-primary">[ 오늘 볼 것 ]</MonoLabel></div>
            <div className="space-y-1.5 px-4 py-4 text-[14px] leading-relaxed">
              <p className="text-foreground"><b className="mr-1 font-mono text-[12px] text-primary">오늘</b>{todayAction.title}</p>
              <p className="text-muted-foreground"><b className="mr-1 font-mono text-[12px]">근거</b>{todayAction.reason}</p>
              <p className="text-muted-foreground"><b className="mr-1 font-mono text-[12px]">다음</b>{todayAction.next}</p>
            </div>
          </div>

          <FeedbackSection title="긴급" items={urgentList} count={urgentList.length} empty="긴급한 한마디는 없어요."
            responses={responses} selectedStoreId={selectedStoreId} onStatus={setStatus} onResolve={handleResolve} onReply={handleReply} />
          <FeedbackSection title="새 한마디" items={openFeedback} count={openFeedback.length} empty="새로 볼 한마디는 없어요."
            responses={responses} selectedStoreId={selectedStoreId} onStatus={setStatus} onResolve={handleResolve} onReply={handleReply} />
          <FeedbackSection title="좋은 한마디" items={positiveList} count={positiveList.length} empty="아직 좋은 한마디는 없어요."
            responses={responses} selectedStoreId={selectedStoreId} onStatus={setStatus} onResolve={handleResolve} onReply={handleReply} />
          <FeedbackSection title="처리 기록" items={historyList} count={historyList.length} empty="아직 처리한 기록은 없어요."
            responses={responses} selectedStoreId={selectedStoreId} onStatus={setStatus} onResolve={handleResolve} onReply={handleReply} />
        </div>
      </div>
    </main>
  );
}

// ── 한마디 섹션 ─────────────────────────────────────────
function FeedbackSection({
  title, items, count, empty, responses, selectedStoreId, onStatus, onResolve, onReply,
}: {
  title: string; items: Feedback[]; count: number; empty: string;
  responses: Record<string, OwnerResponse[]>;
  selectedStoreId: string | null;
  onStatus: (id: string, s: OwnerStatus) => void;
  onResolve: (item: Feedback) => void;
  onReply: (item: Feedback, body: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(12,36,23,0.35)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <MonoLabel>// {title} {count ? `(${count})` : ""}</MonoLabel>
      </div>
      <ul>
        {items.length === 0 ? (
          <li className="px-4 py-4 font-mono text-[12px] text-muted-foreground">{empty}</li>
        ) : (
          items.map((item, i) => (
            <li key={item.id} className={`px-4 py-4 ${i < items.length - 1 ? "border-b border-border-soft" : ""} ${isUrgentFeedback(item) && isOpenFeedback(item) ? "bg-destructive/5" : ""}`}>
              <FeedbackCard item={item} responses={responses[item.id] || []} selectedStoreId={selectedStoreId} onStatus={onStatus} onResolve={onResolve} onReply={onReply} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function FeedbackCard({
  item, responses, selectedStoreId, onStatus, onResolve, onReply,
}: {
  item: Feedback; responses: OwnerResponse[]; selectedStoreId: string | null;
  onStatus: (id: string, s: OwnerStatus) => void;
  onResolve: (item: Feedback) => void;
  onReply: (item: Feedback, body: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const sb = sentimentBadge(item.sentiment_score);
  const ub = urgencyBadge(item.urgency);
  const cats = getCategories(item);
  const status = getOwnerStatus(item);
  const showResolve = selectedStoreId && item.stores?.id === selectedStoreId && (isUrgentFeedback(item) || isNegativeFeedback(item));
  const alreadyResolved = status === "acted";
  const templates = suggestResponses(primaryCategory(item), item.urgency) as string[];
  const masked = item.pii_removed || item.profanity_removed;

  const toneCls: Record<string, string> = {
    high: "text-destructive", mid: "text-[#9c6a2e]", low: "text-muted-foreground",
    pos: "text-primary", neg: "text-destructive", neu: "text-muted-foreground",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-mono text-[10px] ${toneCls[ub.tone]}`}>[{ub.label}]</span>
        <span className={`font-mono text-[10px] ${toneCls[sb.tone]}`}>{sb.label}</span>
        {cats.map((c) => (
          <span key={c} className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{c}</span>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">{formatTime(item.created_at)}</span>
      </div>

      <p className="mt-2 text-[14px] leading-relaxed text-foreground">{item.content_polished || item.content_clean}</p>
      {masked && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
          device=null · ip=hashed · {item.pii_removed ? "개인정보" : ""}{item.pii_removed && item.profanity_removed ? "·" : ""}{item.profanity_removed ? "욕설" : ""} 자동 가림 · 원본은 사장님 화면에 노출 안 함
        </p>
      )}

      {/* 상태 컨트롤 */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(Object.keys(OWNER_STATUSES) as OwnerStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onStatus(item.id, key)}
            className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
              status === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-surface-raised"
            }`}
          >
            {OWNER_STATUSES[key]}
          </button>
        ))}
      </div>

      {/* 조치 버튼 */}
      {showResolve && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={alreadyResolved}
            onClick={() => onResolve(item)}
            className="rounded-md border border-primary bg-card px-2.5 py-1 font-mono text-[11px] text-primary transition-colors hover:bg-surface-raised disabled:opacity-50"
          >
            {alreadyResolved ? "조치 완료" : "조치함 (성장)"}
          </button>
          <span className="font-mono text-[10px] text-muted-foreground">
            {alreadyResolved ? "나무 성장에 반영됐어요." : "다뤘다면 눌러주세요. 가게가 건강하면 나무가 자랍니다."}
          </span>
        </div>
      )}

      {/* 보낸 답 */}
      {responses.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {responses.map((r) => (
            <div key={r.id} className="rounded-md border border-primary/30 bg-surface-raised px-3 py-2">
              <p className="text-[13px] text-foreground"><span className="mr-1 font-mono text-primary">→</span>{r.body}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {r.seen_by_customer ? "손님 확인함" : "손님 미확인"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 답하기 */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="font-mono text-[11px] text-primary underline-offset-2 hover:underline"
        >
          › 답하기
        </button>
        {replyOpen && (
          <div className="mt-2 space-y-2 rounded-md border border-border-soft bg-surface-raised p-3">
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDraft(t)}
                  className="rounded border border-border bg-card px-2 py-1 text-left font-mono text-[10px] text-muted-foreground hover:bg-surface-raised"
                >
                  {t.length > 28 ? t.slice(0, 28) + "…" : t}
                </button>
              ))}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="손님에게 전할 답을 적어주세요. 위 초안을 눌러 채운 뒤 다듬어도 좋아요."
              className="w-full resize-none rounded border border-border bg-input-background px-2.5 py-2 font-mono text-[12px] text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => { onReply(item, draft); setDraft(""); setReplyOpen(false); }}
              className="rounded-md border border-primary bg-primary px-3 py-1.5 font-mono text-[11px] text-primary-foreground"
            >
              손님에게 답 보내기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
