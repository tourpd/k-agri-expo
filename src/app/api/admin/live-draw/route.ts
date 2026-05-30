import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("expo_live_entries")
    .select("*");

  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, error: "참여자 없음" });
  }

  const winner = data[Math.floor(Math.random() * data.length)];

  return NextResponse.json({
    ok: true,
    winner,
  });
}