import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: live } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!live) {
      return NextResponse.json(
        { ok: false, error: "진행 중인 라이브가 없습니다." },
        { status: 500 }
      );
    }

    if (live.is_locked) {
      return NextResponse.json({
        ok: true,
        live,
        locked_count: live.locked_count || 0,
        message: "이미 추첨 대상이 확정되었습니다.",
      });
    }

    const { data: candidates, error } = await supabase
      .from("live_participants")
      .select("id")
      .eq("live_id", live.id)
      .eq("is_eligible", true)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const list = candidates || [];

    for (let i = 0; i < list.length; i++) {
      await supabase
        .from("live_participants")
        .update({ locked_candidate_no: i + 1 })
        .eq("id", list[i].id);
    }

    const { data: updated, error: updateError } = await supabase
      .from("live_sessions")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_count: list.length,
      })
      .eq("id", live.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      live: updated,
      locked_count: list.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "추첨 대상 확정 실패" },
      { status: 500 }
    );
  }
}