// voxpop Supabase 클라이언트 래퍼
// 손님 폼(익명), 사장 대시보드, 관리자 페이지에서 공통 사용.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { SUPABASE_URL, SUPABASE_ANON_KEY, DEVICE_KEY } from './config.js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  if (!SUPABASE_URL || SUPABASE_URL.startsWith('https://YOUR-PROJECT')) {
    throw new Error('Supabase URL이 설정되지 않았습니다. lib/config.js를 갱신하세요.');
  }
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return _client;
}

// 디바이스 키 (익명 유지, 중복 응답 완화)
export function getDeviceKey() {
  let key = localStorage.getItem(DEVICE_KEY);
  if (!key) {
    key = `voxpop-device-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_KEY, key);
  }
  return key;
}

// 단방향 해시 (SHA-256). 디바이스 키 원본 노출 없이 식별만.
export async function hashDeviceKey(deviceKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(deviceKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 매장 slug로 stores 조회 (anon 가능)
export async function fetchStoreBySlug(slug) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stores')
    .select('id, slug, display_name, owner_label, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 응답 익명 제출 (anon). submit_feedback RPC가 feedback(가림본)+feedback_raw(원본)를
// 원자적으로 INSERT한다. content_raw는 feedback_raw에만 들어가 운영자 전용으로 격리된다.
// 영수증 토큰(claim_token)은 호출자가 payload에 넣어(불투명 난수) 그대로 돌려받는다.
export async function insertFeedback(payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('submit_feedback', {
    p_store_id: payload.store_id,
    p_content_clean: payload.content_clean,
    p_content_raw: payload.content_raw ?? '',
    p_sentiment_score: payload.sentiment_score ?? null,
    p_urgency: payload.urgency ?? null,
    p_categories: payload.categories ?? [],
    p_pii_removed: !!payload.pii_removed,
    p_profanity_removed: !!payload.profanity_removed,
    p_device_hash: payload.device_hash ?? null,
    p_claim_token: payload.claim_token,
  });
  if (error) throw error;
  return { ...payload, ...(data || {}) };
}

// Magic Link 발송 (사장 또는 관리자 로그인)
export async function sendMagicLink(email, redirectTo) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
}

// 현재 세션 (인증된 사용자)
export async function getCurrentSession() {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// 로그아웃
export async function signOut() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

// 사장 본인 매장 응답 조회 — feedback_owner_view 사용.
// 뷰는 content_raw·device_hash·ip_hash·claim_token을 제외해 사장이 어떤 경로로도
// 원본·기기 식별자에 닿지 못한다(무기명 절대선). store 정보는 뷰 join으로 가져와 매핑.
export async function fetchOwnerFeedback() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback_owner_view')
    .select(`
      id, store_id, content_clean, content_polished, sentiment_score, urgency, categories,
      pii_removed, profanity_removed, claimed, created_at,
      store_slug, store_display_name
    `)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map((r) => ({
    ...r,
    stores: { id: r.store_id, slug: r.store_slug, display_name: r.store_display_name },
  }));
}

// 운영자(ADMIN_EMAILS) 전용: 한마디 원본 조회 (검수용). feedback_raw RLS가 admin만 허용.
export async function fetchFeedbackRaw(feedbackId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback_raw')
    .select('content_raw')
    .eq('feedback_id', feedbackId)
    .maybeSingle();
  if (error) throw error;
  return data?.content_raw ?? null;
}

// 사장 본인 매장 정보 조회
export async function fetchOwnerStores() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stores')
    .select('id, slug, display_name, owner_label, active, created_at, qr_url')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// 관리자: 매장 신규 등록
export async function insertStore(payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stores')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 관리자: 매장 활성/비활성 토글
export async function toggleStoreActive(storeId, active) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('stores')
    .update({ active })
    .eq('id', storeId);
  if (error) throw error;
}

// ── 슬라임 (voxpop-store-slime) ──────────────────────────────

// 사장: 자기 매장 조치 기록 조회 (슬라임 건강·성장 계산 입력)
export async function fetchStoreActions(storeId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('store_actions')
    .select('id, store_id, feedback_id, action_type, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data || [];
}

// 사장: "조치함" 기록 추가
export async function insertStoreAction(storeId, feedbackId, actionType = 'resolved') {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('store_actions')
    .insert({ store_id: storeId, feedback_id: feedbackId ?? null, action_type: actionType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 매장 슬라임 성장값 조회 (사장 + 손님 anon 가능, 성장단계만)
export async function fetchStoreSlime(storeId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('store_slime')
    .select('store_id, growth_points, stage, updated_at')
    .eq('store_id', storeId)
    .maybeSingle();
  if (error) throw error;
  return data; // 없으면 null (아직 성장 0)
}

// 사장: 슬라임 성장 upsert (조치로 성장 누적, 건강 게이트 통과 시)
export async function upsertStoreSlime(storeId, growthPoints, stage) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('store_slime')
    .upsert(
      { store_id: storeId, growth_points: growthPoints, stage, updated_at: new Date().toISOString() },
      { onConflict: 'store_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── 사장 응답 스레드 (Plan B) ────────────────────────────────

// 사장: 한마디(feedback_id)에 답신 INSERT. RLS가 자기 매장 store_id만 허용.
export async function insertOwnerResponse(feedbackId, storeId, body, kind = 'comment') {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('owner_response')
    .insert({ feedback_id: feedbackId, store_id: storeId, body, kind })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 사장: 자기 매장 한마디들에 달린 답신 조회(seen_by_customer 포함).
export async function fetchOwnerResponses(feedbackIds = null) {
  const supabase = getSupabase();
  let query = supabase
    .from('owner_response')
    .select('id, feedback_id, store_id, kind, body, seen_by_customer, created_at')
    .order('created_at', { ascending: true });
  if (Array.isArray(feedbackIds) && feedbackIds.length) {
    query = query.in('feedback_id', feedbackIds);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 인증 손님(개인 슬라임 계정): 사장 답을 확인함으로 표시. body·kind 변조 불가(RPC 방어).
export async function markResponseSeen(responseId) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('mark_response_seen', { p_response_id: responseId });
  if (error) throw error;
}

// 무인증 손님: 영수증 토큰으로 본인 한마디 + 사장 답 열람(+ 미확인 답 seen 처리).
// 반환: { feedback: { content_clean, created_at }, responses: [{ id, kind, body, created_at }] }
export async function fetchThreadByToken(token) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('fetch_thread_by_token', { p_token: token });
  if (error) throw error;
  return data;
}

// ── 처리 상태 (feedback_status, Plan C) ──────────────────────
// 사장이 한마디에 매긴 new/seen/acted/later 상태. 기기·세션 무관 일관.

// 사장: 자기 매장 한마디 상태 일괄 조회 → { [feedbackId]: status } 맵
export async function fetchFeedbackStatus() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback_status')
    .select('feedback_id, status')
    .limit(1000);
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => { map[row.feedback_id] = row.status; });
  return map;
}

// 사장: 한마디 처리 상태 upsert (feedback_id 충돌 시 status·updated_at 갱신)
export async function upsertFeedbackStatus(feedbackId, storeId, status) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback_status')
    .upsert(
      { feedback_id: feedbackId, store_id: storeId, status, updated_at: new Date().toISOString() },
      { onConflict: 'feedback_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
