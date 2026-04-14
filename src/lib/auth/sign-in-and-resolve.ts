"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getDashboardPath } from "@/lib/auth/get-dashboard-path";

export async function signInAndResolve(params: {
  email: string;
  password: string;
  expectedRole: "admin" | "vendor" | "buyer" | "farmer";
}) {
  const email = params.email.trim();
  const password = params.password;
  const expectedRole = params.expectedRole;

  if (!email || !password) {
    return {
      ok: false,
      error: "이메일과 비밀번호를 입력해 주세요.",
      role: "unknown" as const,
      redirectTo: null,
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message ?? "로그인에 실패했습니다.",
      role: "unknown" as const,
      redirectTo: null,
    };
  }

  const role = await getUserRole({
    userId: data.user.id,
    email: data.user.email,
  });

  if (role !== expectedRole) {
    return {
      ok: false,
      error: `이 계정은 ${expectedRole} 권한이 아닙니다. 현재 권한: ${role}`,
      role,
      redirectTo: null,
    };
  }

  return {
    ok: true,
    error: null,
    role,
    redirectTo: getDashboardPath(role),
  };
}