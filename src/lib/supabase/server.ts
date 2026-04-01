import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * ✅ 일반 서버 클라이언트 (로그인 세션 기반)
 * - 로그인된 사용자 정보 조회용
 * - /vendor, /mypage 등에서 사용
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
          /**
           * Server Component에서는 쿠키 쓰기가 제한될 수 있음
           * (auth callback route에서 처리하는 것이 안전)
           */
        }
      },
    },
  });
}

/**
 * ✅ 관리자용 클라이언트 (SERVICE ROLE)
 * - DB 강제 수정 / 승인 / 삭제 등
 * - 절대 클라이언트 코드로 보내면 안 됨
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseJsClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * ✅ 브라우저용 클라이언트 (필요 시)
 * - client component에서 사용
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseJsClient(url, anon);
}

/**
 * ✅ 관리자 이메일 판별
 */
export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  const raw = process.env.ADMIN_EMAILS ?? "";

  const adminEmails = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}