import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createSupabaseAdminClient();

  await supabase.from("live_sessions").upsert({
    id: "00000000-0000-0000-0000-000000000001",
    is_active: true,
    phase: "idle",
    verify_open: false,
  });

  return NextResponse.json({ ok: true });
}