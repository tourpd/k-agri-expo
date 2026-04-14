import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

/**
 * 사용자 세션 기반 SSR 클라이언트
 * - 로그인 상태 / 쿠키 기반 페이지에서 사용
 * - anon key 사용
 * - RLS 영향을 받음
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // SSR/server component에서는 refresh token 재기록 금지
        },
      },
    }
  );
}

/**
 * 운영/관리용 서버 클라이언트
 * - service role 사용
 * - RLS를 우회해서 안정적으로 조회/수정 가능
 * - hall_booth_slots, booths, admin 데이터 조회에 사용
 */
export function createSupabaseAdminClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  const raw = process.env.ADMIN_EMAILS ?? "";

  const adminEmails = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}