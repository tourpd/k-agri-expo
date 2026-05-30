import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function onlyDigits(v: string | null | undefined) {
  return String(v || "").replace(/\D/g, "");
}

function candidateNoFromPhone(phone: string | null | undefined) {
  const d = onlyDigits(phone);
  if (d.length >= 4) return Number(d.slice(-4));
  return Math.floor(1000 + Math.random() * 9000);
}

export async function POST() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: candidates, error } = await supabase
      .from("live_participants")
      .select(`
        id,
        name,
        phone,
        region,
        crop,
        farm_size,
        is_eligible,
        is_drawn,
        call_status,
        locked_candidate_no,
        created_at
      `)
      .eq("is_eligible", true)
      .eq("is_drawn", false);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "추첨 가능한 인증 완료자가 없습니다." },
        { status: 400 }
      );
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];

    const candidateNo =
      selected.locked_candidate_no || candidateNoFromPhone(selected.phone);

    const { data: updated, error: updateError } = await supabase
      .from("live_participants")
      .update({
        is_drawn: true,
        call_status: "calling",
        locked_candidate_no: candidateNo,
      })
      .eq("id", selected.id)
      .eq("is_drawn", false)
      .select(`
        id,
        name,
        phone,
        region,
        crop,
        farm_size,
        is_eligible,
        is_drawn,
        call_status,
        locked_candidate_no,
        created_at
      `)
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          ok: false,
          error: updateError?.message || "당첨자 처리 실패",
        },
        { status: 500 }
      );
    }

    let drawRound = 1;

    const { count } = await supabase
      .from("live_draw_logs")
      .select("id", { count: "exact", head: true });

    drawRound = (count || 0) + 1;

    await supabase.from("live_draw_logs").insert({
      participant_id: updated.id,
      draw_round: drawRound,
      locked_candidate_no: candidateNo,
      draw_status: "drawn",
      call_status: "calling",
      note: "K-Agri 라이브 추첨 후보 선정",
    });

    return NextResponse.json({
      ok: true,
      winner: updated,
      candidate_no: candidateNo,
      draw_round: drawRound,
      total_candidates: candidates.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "추첨 실패",
      },
      { status: 500 }
    );
  }
}