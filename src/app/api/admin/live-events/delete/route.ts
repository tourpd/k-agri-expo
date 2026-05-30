import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function canIgnoreDeleteError(error: any) {
  const msg = String(error?.message || "");
  return (
    msg.includes("does not exist") ||
    msg.includes("Could not find") ||
    msg.includes("column") ||
    msg.includes("schema cache")
  );
}

async function safeDeleteByEventId(supabase: any, table: string, eventId: string) {
  const { error } = await supabase.from(table).delete().eq("event_id", eventId);

  if (error && !canIgnoreDeleteError(error)) {
    throw new Error(`${table} 삭제 실패: ${error.message}`);
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));

    const eventId = String(body.id || body.event_id || body.eventId || "").trim();

    if (!isUuid(eventId)) {
      return NextResponse.json(
        { ok: false, error: "event_id가 올바른 UUID가 아닙니다." },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("live_events")
      .select("id,title,status")
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
        { ok: false, error: "삭제할 이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await safeDeleteByEventId(supabase, "live_draw_logs", eventId);
    await safeDeleteByEventId(supabase, "live_prize_winners", eventId);
    await safeDeleteByEventId(supabase, "live_winners", eventId);
    await safeDeleteByEventId(supabase, "live_product_leads", eventId);
    await safeDeleteByEventId(supabase, "live_sessions", eventId);
    await safeDeleteByEventId(supabase, "live_participants", eventId);
    await safeDeleteByEventId(supabase, "live_prizes", eventId);

    const { error: deleteEventError } = await supabase
      .from("live_events")
      .delete()
      .eq("id", eventId);

    if (deleteEventError) {
      return NextResponse.json(
        { ok: false, error: deleteEventError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "이벤트와 관련 데이터가 삭제되었습니다.",
      deleted_event_id: eventId,
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