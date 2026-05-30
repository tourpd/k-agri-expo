import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { prize_id } = await req.json();

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("live_event_settings")
    .update({
      current_prize_id: prize_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "00000000-0000-0000-0000-000000000001");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}