// voxpop Supabase 클라이언트 설정
// 본 파일은 Supabase 프로젝트 생성 후 사용자가 직접 값 채워야 합니다.
// Supabase 대시보드 → Settings → API → Project URL과 anon public key 복사.
//
// 보안 안내:
// - anon key는 클라이언트 노출 전제. RLS 정책으로 권한 통제됩니다(scripts/supabase/schema.sql).
// - service_role key는 절대 클라이언트에 박지 마세요. 관리자 페이지도 anon으로 진행.

export const SUPABASE_URL = 'https://uqcquoxdurxiuzuspuvy.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxY3F1b3hkdXJ4aXV6dXNwdXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDM3NDQsImV4cCI6MjA5NTExOTc0NH0.VdCuqcO4ZD75zz5NeLIkAihJJptBrWMJ5V5J8htBWIg';

// 매장 등록 시 관리자 이메일 매칭 (RLS 정책의 관리자 목록과 일치해야 함)
export const ADMIN_EMAILS = [
  'tototal5542@gmail.com',
];

// 디바이스 키 (localStorage). 익명 유지하면서 중복 응답 완화용.
export const DEVICE_KEY = 'voxpop-device-v1';
