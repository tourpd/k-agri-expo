import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));

    const eventId = String(body.event_id || body.eventId || "").trim();

    if (!isUuid(eventId)) {
      return NextResponse.json(
        { ok: false, error: "event_id가 올바른 UUID가 아닙니다." },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("live_events")
      .select("id,current_prize_id")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { ok: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: prizes, error: prizeError } = await supabase
      .from("live_prizes")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (prizeError) {
      return NextResponse.json(
        { ok: false, error: prizeError.message },
        { status: 500 }
      );
    }

    if (!prizes || prizes.length === 0) {
      return NextResponse.json(
        { ok: false, error: "사용 중인 경품이 없습니다." },
        { status: 404 }
      );
    }

    const currentId = event.current_prize_id || "";
    const currentIndex = prizes.findIndex((p: any) => p.id === currentId);

    const nextPrize =
      currentIndex >= 0 && currentIndex < prizes.length - 1
        ? prizes[currentIndex + 1]
        : prizes[0];

    const { error: updateError } = await supabase
      .from("live_events")
      .update({
        current_prize_id: nextPrize.id,
      })
      .eq("id", eventId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      event_id: eventId,
      current_prize_id: nextPrize.id,
      prize: nextPrize,
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