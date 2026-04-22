import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

function getEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[supabase/server] Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseUrl(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function getSupabaseAnonKey(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * 사용자 세션 기반 SSR 클라이언트
 * - anon key 사용
 * - RLS 적용
 * - App Router 서버 환경 전용
 *
 * 사용처
 * 1) Route Handler
 *    - signInWithPassword / signOut 등 auth 쿠키 쓰기 가능
 * 2) Server Component
 *    - 세션 읽기 가능
 *    - 쿠키 쓰기는 막힐 수 있으므로 실패해도 전체 흐름은 유지
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        for (const cookie of cookiesToSet) {
          try {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          } catch (error) {
            /**
             * Server Component에서는 쿠키 쓰기가 막힐 수 있음
             * - Route Handler / Server Action에서는 정상 set 기대
             * - Server Component에서는 조용히 넘기되 디버깅 로그는 남김
             */
            console.warn("[supabase/server] cookie set skipped:", {
              name: cookie.name,
              reason:
                error instanceof Error ? error.message : "unknown error",
            });
          }
        }
      },
    },
  });
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const raw = process.env.ADMIN_EMAILS ?? "";

  const adminEmails = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(normalizedEmail);
}