import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "vendor" | "buyer" | "farmer";

export type ProfileRow = {
  user_id: string;
  role: AppRole;
  name: string | null;
  email: string | null;
  phone: string | null;
  region: string | null;
  crop: string | null;
  company_name: string | null;
  country: string | null;
  is_approved: boolean;
};

export async function getCurrentUserAndProfile() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    return {
      user: null,
      profile: null as ProfileRow | null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id,role,name,email,phone,region,crop,company_name,country,is_approved"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    user,
    profile: (profile as ProfileRow | null) ?? null,
  };
}

export function getRoleHome(role: AppRole | null | undefined) {
  switch (role) {
    case "admin":
      return "/expo/admin";
    case "vendor":
      return "/vendor";
    case "buyer":
      return "/buyer";
    case "farmer":
      return "/farmer";
    default:
      return "/login";
  }
}