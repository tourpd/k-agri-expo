import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const participantId = safe(body.participant_id);
    const callStatus = safe(body.call_status);

    if (!participantId) {
      return NextResponse.json(
        { ok: false, error: "participant_id가 없습니다." },
        { status: 400 }
      );
    }

    if (!["success", "failed"].includes(callStatus)) {
      return NextResponse.json(
        { ok: false, error: "call_status 값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: participant, error: participantError } = await supabase
      .from("live_participants")
      .select("*")
      .eq("id", participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { ok: false, error: "참여자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: updated, error } = await supabase
      .from("live_participants")
      .update({
        call_status: callStatus,
      })
      .eq("id", participantId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await supabase
      .from("live_draw_logs")
      .update({
        call_status: callStatus,
        draw_status: callStatus === "success" ? "winner" : "failed",
        note:
          callStatus === "success"
            ? "전화 성공 / 최종 당첨 확정"
            : "10번 벨 미응답 / 탈락",
      })
      .eq("participant_id", participantId)
      .eq("live_id", participant.live_id);

    if (callStatus === "success") {
      await supabase
        .from("live_sessions")
        .update({
          final_winner_participant_id: participantId,
          final_winner_at: new Date().toISOString(),
        })
        .eq("id", participant.live_id);
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "전화 상태 저장 실패",
      },
      { status: 500 }
    );
  }
}