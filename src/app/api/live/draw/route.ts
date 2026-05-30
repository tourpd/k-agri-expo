import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrawBody = {
  event_id?: string;
  prize_id?: string;
};

function clean(v: unknown) {
  return String(v || "").trim();
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = (await req.json().catch(() => ({}))) as DrawBody;

    const event_id = clean(body.event_id);
    const prize_id = clean(body.prize_id);

    if (!event_id) {
      return NextResponse.json(
        { ok: false, error: "event_id가 없습니다." },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("live_events")
      .select("id,title,status")
      .eq("id", event_id)
      .maybeSingle();

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message },
        { status: 500 }
      );
    }

    if (!event?.id) {
      return NextResponse.json(
        { ok: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (event.status !== "live") {
      return NextResponse.json(
        { ok: false, error: "진행중인 이벤트만 추첨할 수 있습니다." },
        { status: 400 }
      );
    }

    let prize = null;

    if (prize_id) {
      const { data: prizeData, error: prizeError } = await supabase
        .from("live_prizes")
        .select("*")
        .eq("id", prize_id)
        .eq("event_id", event_id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (prizeError) {
        return NextResponse.json(
          { ok: false, error: prizeError.message },
          { status: 500 }
        );
      }

      prize = prizeData;
    } else {
      const { data: prizeData, error: prizeError } = await supabase
        .from("live_prizes")
        .select("*")
        .eq("event_id", event_id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (prizeError) {
        return NextResponse.json(
          { ok: false, error: prizeError.message },
          { status: 500 }
        );
      }

      prize = prizeData;
    }

    const { data: candidates, error: candidateError } = await supabase
      .from("live_participants")
      .select("*")
      .eq("event_id", event_id)
      .eq("is_eligible", true)
      .eq("is_drawn", false)
      .order("created_at", { ascending: true });

    if (candidateError) {
      return NextResponse.json(
        { ok: false, error: candidateError.message },
        { status: 500 }
      );
    }

    const rows = candidates || [];

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "추첨 가능한 참여자가 없습니다." },
        { status: 400 }
      );
    }

    const winner = rows[Math.floor(Math.random() * rows.length)];
    const now = new Date().toISOString();

    const { data: updatedWinner, error: updateError } = await supabase
      .from("live_participants")
      .update({
        is_drawn: true,
        drawn_at: now,
        call_status: "selected",
        confirmed_winner: false,
      })
      .eq("id", winner.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    if (prize?.id) {
      await supabase
        .from("live_prizes")
        .update({
          drawn_count: Number(prize.drawn_count || 0) + 1,
        })
        .eq("id", prize.id);
    }

    return NextResponse.json({
      ok: true,
      event,
      prize,
      winner: updatedWinner,
      message: "추첨이 완료되었습니다.",
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "server error",
      },
      { status: 500 }
    );
  }
}