import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const admin = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id, role, status")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  if (profile.role !== "admin") {
    throw new Error("관리자 권한이 없습니다.");
  }

  if (profile.status !== "active") {
    throw new Error("비활성 관리자입니다.");
  }

  return {
    userId: user.id,
    profile,
  };
}