import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: live, error: liveError } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (liveError || !live) {
      return NextResponse.json({ ok: false, error: "진행 중인 라이브가 없습니다." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("live_participants")
      .select(`
        *,
        live_farmers (
          name,
          phone,
          region,
          crop,
          farm_size
        )
      `)
      .eq("live_id", live.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, live, items: data || [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "참여자 조회 실패" },
      { status: 500 }
    );
  }
}