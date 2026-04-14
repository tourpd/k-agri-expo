import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function getEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }

  return value;
}

function createAdminClientInstance(): SupabaseClient {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log("[supabase-admin] creating admin client");

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "k-agri-expo-admin",
      },
    },
  });
}

/**
 * ✅ 싱글톤 관리자 클라이언트
 * - 서버에서만 사용
 * - RLS 완전 우회
 * - 모든 hall / booth / slot 조회 안정 보장
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createAdminClientInstance();

  return adminClient;
}

/**
 * 🔁 기존 코드 호환용 alias
 */
export function createSupabaseAdminClient(): SupabaseClient {
  return getSupabaseAdmin();
}

/**
 * 🔍 디버깅용 헬퍼 (필요할 때만 사용)
 */
export async function debugSupabaseConnection() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("hall_booth_slots")
      .select("*")
      .limit(1);

    console.log("[supabase-admin] test query result:", data);

    if (error) {
      console.error("[supabase-admin] test query error:", error);
    }
  } catch (err) {
    console.error("[supabase-admin] connection failed:", err);
  }
}