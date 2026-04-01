// src/lib/expo/requireExpoAccess.ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpoRole = "farmer" | "buyer" | "vendor" | "admin";

type RequireExpoAccessOptions = {
  next?: string;
  allowedRoles?: ExpoRole[];
  allowAdmin?: boolean;
};

export async function requireExpoAccess(
  options: RequireExpoAccessOptions = {}
) {
  const {
    next = "/expo",
    allowedRoles,
    allowAdmin = true,
  } = options;

  const supabase = await createSupabaseServerClient();

  // 1) 로그인 체크
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/expo/auth?next=${encodeURIComponent(next)}`);
  }

  // 2) profiles.role 체크
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      role,
      display_name,
      phone,
      email,
      region,
      crop_one,
      vendor_company_name,
      vendor_status
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  // profiles가 아직 없거나 role이 없으면 온보딩으로
  if (profileError || !profile || !profile.role) {
    redirect("/expo/onboarding/role");
  }

  const role = profile.role as ExpoRole;

  // 3) allowedRoles가 있으면 권한 체크
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed =
      allowedRoles.includes(role) || (allowAdmin && role === "admin");

    if (!isAllowed) {
      redirect("/expo");
    }
  }

  return {
    supabase,
    user,
    profile,
    role,
  };
}