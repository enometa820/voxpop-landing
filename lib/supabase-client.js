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

// 응답 익명 INSERT (anon 가능, RLS가 active 매장만 허용)
export async function insertFeedback(payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
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

// 사장 본인 매장 응답 조회
export async function fetchOwnerFeedback() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      id, content_clean, content_raw, sentiment_score, urgency, categories,
      pii_removed, profanity_removed, created_at,
      stores ( id, slug, display_name )
    `)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
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
