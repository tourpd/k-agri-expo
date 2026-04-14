import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export async function isExpoAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return false;
  }

  return isAdminEmail(user.email);
}