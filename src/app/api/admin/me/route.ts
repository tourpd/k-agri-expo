// src/app/api/admin/me/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return NextResponse.json({ ok: true, isAdmin: false });

  const { data } = await supabase
    .from("expo_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, isAdmin: !!data });
}