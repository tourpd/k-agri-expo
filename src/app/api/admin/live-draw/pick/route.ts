import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskPhone(phone: string) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length !== 11) return phone || "";
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export async function POST() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: candidates, error } = await supabase
      .from("live_participants")
      .select("id, name, phone, region, crop, is_drawn, confirmed_winner")
      .eq("confirmed_winner", false)
      .eq("is_drawn", false);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "추첨 가능한 참여자가 없습니다.",
      });
    }

    const picked =
      candidates[Math.floor(Math.random() * candidates.length)];

    const { data: updated, error: updateError } = await supabase
      .from("live_participants")
      .update({
        is_drawn: true,
        call_status: "calling",
        drawn_at: new Date().toISOString(),
      })
      .eq("id", picked.id)
      .select("id, name, phone, region, crop, call_status, confirmed_winner")
      .single();

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message });
    }

    const { count } = await supabase
      .from("live_draw_logs")
      .select("id", { count: "exact", head: true });

    const drawRound = (count || 0) + 1;

    await supabase.from("live_draw_logs").insert({
      participant_id: picked.id,
      draw_round: drawRound,
      call_status: "calling",
      result: "candidate",
      note: "전화 연결 후보 선정",
    });

    return NextResponse.json({
      ok: true,
      winner: {
        ...updated,
        phone_display: maskPhone(updated.phone),
      },
      draw_round: drawRound,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "server error",
    });
  }
}