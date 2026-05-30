import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[supabase-admin] Missing env: ${name}`);
  }

  return value;
}

/**
 * 🔥 요청마다 새로 생성 (안정성 최우선)
 */
export function createSupabaseAdminClient(): SupabaseClient {
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
 * 디버그용 (실제 테이블로 바꿔서 쓰세요)
 */
export async function debugSupabaseConnection() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("live_sessions") // 🔥 여기 수정
      .select("*")
      .limit(1);

    if (error) {
      console.error("[supabase-admin] query error:", error);
      return;
    }

    console.log("[supabase-admin] ok:", data);
  } catch (err) {
    console.error("[supabase-admin] failed:", err);
  }
}