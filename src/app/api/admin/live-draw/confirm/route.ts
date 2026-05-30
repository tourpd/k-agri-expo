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
        call_status: "answered",
        confirmed_winner: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, name, phone, region, crop, call_status, confirmed_winner")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    await supabase.from("live_draw_logs").insert({
      participant_id: id,
      call_status: "answered",
      result: "confirmed",
      note: "전화 받음 - 당첨 확정",
    });

    return NextResponse.json({ ok: true, winner: data });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "server error",
    });
  }
}