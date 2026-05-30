import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));

    const eventId = String(body.event_id || body.eventId || "").trim();
    const prizeId = String(body.prize_id || body.prizeId || "").trim();

    if (!isUuid(eventId)) {
      return NextResponse.json(
        { ok: false, error: "event_id가 올바른 UUID가 아닙니다." },
        { status: 400 }
      );
    }

    if (!isUuid(prizeId)) {
      return NextResponse.json(
        { ok: false, error: "prize_id가 올바른 UUID가 아닙니다." },
        { status: 400 }
      );
    }

    const { data: prize, error: prizeError } = await supabase
      .from("live_prizes")
      .select("id,event_id,title,is_active,deleted_at")
      .eq("id", prizeId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (prizeError) {
      return NextResponse.json(
        { ok: false, error: prizeError.message },
        { status: 500 }
      );
    }

    if (!prize || prize.is_active === false || prize.deleted_at) {
      return NextResponse.json(
        { ok: false, error: "사용 가능한 경품이 아닙니다." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("live_events")
      .update({ current_prize_id: prizeId })
      .eq("id", eventId);

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "live_events.current_prize_id 컬럼이 필요합니다. Supabase SQL에서 먼저 추가하세요: " +
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      event_id: eventId,
      current_prize_id: prizeId,
      prize,
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