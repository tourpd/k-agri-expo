import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("live_sessions")
    .update({
      phase: "drawing",
    })
    .eq("id", "00000000-0000-0000-0000-000000000001");

  return NextResponse.json({ ok: true });
}