import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function getEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createAdminClientInstance(): SupabaseClient {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

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
 * 서버 전용 관리자 클라이언트 (싱글톤)
 */
export function createSupabaseAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createAdminClientInstance();
  return adminClient;
}

/**
 * (선택) 기존 호환 alias — 필요 없으면 삭제해도 됨
 */
export const getSupabaseAdmin = createSupabaseAdminClient;

/**
 * 디버그용
 */
export async function debugSupabaseConnection() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("hall_booth_slots")
      .select("*")
      .limit(1);

    if (error) {
      console.error("[supabase-admin] test query error:", error);
      return;
    }

    console.log("[supabase-admin] test query result:", data);
  } catch (error) {
    console.error("[supabase-admin] connection failed:", error);
  }
}