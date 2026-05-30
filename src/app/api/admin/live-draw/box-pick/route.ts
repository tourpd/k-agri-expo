import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

function num(v: unknown, fallback = 1) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function requireLiveEvent(supabase: any, eventId: string) {
  if (!eventId) {
    return { ok: false, error: "event_id가 없습니다." };
  }

  const { data, error } = await supabase
    .from("live_events")
    .select("id,title,status")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (data.status !== "live") {
    return {
      ok: false,
      error:
        data.status === "ready"
          ? "아직 방송중 상태가 아닙니다. 이벤트를 live로 변경한 뒤 추첨하세요."
          : "이미 종료된 이벤트입니다. 추첨할 수 없습니다.",
    };
  }

  return { ok: true, event: data };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventId = clean(body.event_id);
    const prizeId = clean(body.prize_id);
    const count = num(body.count, 1);

    if (!prizeId) {
      return NextResponse.json(
        { ok: false, error: "경품 ID가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const eventCheck = await requireLiveEvent(supabase, eventId);

    if (!eventCheck.ok) {
      return NextResponse.json(
        { ok: false, error: eventCheck.error },
        { status: 409 }
      );
    }

    const { data: prize, error: prizeError } = await supabase
      .from("live_prizes")
      .select("id, event_id, title, quantity, draw_type, is_active, drawn_count")
      .eq("id", prizeId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (prizeError || !prize) {
      return NextResponse.json(
        { ok: false, error: "현재 이벤트의 경품 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (prize.is_active === false) {
      return NextResponse.json(
        { ok: false, error: "중지된 경품입니다." },
        { status: 400 }
      );
    }

    const quantity = Number(prize.quantity || 0);
    const drawnCount = Number(prize.drawn_count || 0);
    const remainingCount = Math.max(quantity - drawnCount, 0);

    if (remainingCount <= 0) {
      return NextResponse.json(
        { ok: false, error: "이미 이 경품의 추첨 수량이 모두 완료되었습니다." },
        { status: 400 }
      );
    }

    if (count > remainingCount) {
      return NextResponse.json(
        {
          ok: false,
          error: `남은 추첨 가능 수량은 ${remainingCount}명입니다.`,
        },
        { status: 400 }
      );
    }

    const { data: alreadyWinners, error: winnersError } = await supabase
      .from("live_winners")
      .select("draw_number")
      .eq("event_id", eventId)
      .not("draw_number", "is", null);

    if (winnersError) {
      return NextResponse.json(
        { ok: false, error: winnersError.message },
        { status: 500 }
      );
    }

    const usedNumbers = new Set(
      (alreadyWinners || [])
        .map((row) => Number(row.draw_number))
        .filter((n) => Number.isFinite(n))
    );

    const { data: participants, error: participantError } = await supabase
      .from("live_participants")
      .select("id, event_id, draw_number, name, phone, region, crop")
      .eq("event_id", eventId)
      .not("draw_number", "is", null)
      .or("confirmed_winner.is.null,confirmed_winner.eq.false")
      .order("draw_number", { ascending: true });

    if (participantError) {
      return NextResponse.json(
        { ok: false, error: participantError.message },
        { status: 500 }
      );
    }

    const pool = (participants || []).filter(
      (p) => p.draw_number && !usedNumbers.has(Number(p.draw_number))
    );

    if (pool.length < count) {
      return NextResponse.json(
        {
          ok: false,
          error: `추첨 가능한 참여자가 부족합니다. 가능 인원: ${pool.length}명`,
        },
        { status: 400 }
      );
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);

    const insertRows = picked.map((p) => ({
      event_id: eventId,
      prize_id: prize.id,
      participant_id: p.id,
      draw_number: p.draw_number,
      status: "confirmed",
      prize_title: prize.title,
      winner_name: p.name,
      winner_phone: p.phone,
      shipping_status: "need_address",
      privacy_agreed: false,
    }));

    const { data: winners, error: insertError } = await supabase
      .from("live_winners")
      .insert(insertRows)
      .select("*");

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("live_prizes")
      .update({
        drawn_count: drawnCount + picked.length,
      })
      .eq("id", prize.id)
      .eq("event_id", eventId);

    await supabase
      .from("live_participants")
      .update({
        confirmed_winner: true,
        is_drawn: true,
        call_status: "box_confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .in(
        "id",
        picked.map((p) => p.id)
      )
      .eq("event_id", eventId);

    return NextResponse.json({
      ok: true,
      event_id: eventId,
      prize,
      winners: winners || [],
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