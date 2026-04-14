import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentAuthUser = {
  id: string;
  email: string | null;
};

export async function getCurrentUser(): Promise<CurrentAuthUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}