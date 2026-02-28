// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * ✅ 일반 서버 클라이언트 (쿠키 세션 기반)
 * - Next 16+에서는 cookies()가 Promise라 await 필요
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 set 시도하면 에러날 수 있는데 무시(Next 권장 패턴)
        }
      },
    },
  });
}

/**
 * ✅ 관리자용(서비스 롤) Supabase 클라이언트
 * - 승인/반려 같은 "관리자 업데이트"는 이걸로 처리하는 게 가장 안정적
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * ✅ 간단 Admin 판별 (환경변수 기반)
 * - DB에 admins 테이블이 아직 없으니, 우선 이 방식이 가장 빠르고 확실합니다.
 * - .env.local 예: ADMIN_EMAILS=tourpd@naver.com,tourpd@gmail.com
 */
export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}