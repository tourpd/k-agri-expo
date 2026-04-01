// src/lib/expo/isExpoAdmin.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isExpoAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const userId = userRes?.user?.id ?? null;

  if (userErr || !userId) return false;

  const { data, error } = await supabase
    .from("expo_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}