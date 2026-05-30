import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "participant id 필요" });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("live_participants")
      .update({
        call_status: "missed",
        confirmed_winner: false,
        note: "전화 미응답 - 다음 후보로 이동",
      })
      .eq("id", id)
      .select("id, name, phone, region, crop, call_status, confirmed_winner")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    await supabase.from("live_draw_logs").insert({
      participant_id: id,
      call_status: "missed",
      result: "missed",
      note: "전화 안 받음 - 탈락 처리",
    });

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "server error",
    });
  }
}