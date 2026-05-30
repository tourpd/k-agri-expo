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

function normalizePhase(v: string) {
  const phase = String(v || "").trim();

  if (
    [
      "idle",
      "ready",
      "countdown",
      "spinning",
      "calling",
      "call_check",
      "winner_reveal",
      "confirmed",
      "missed",
      "next_ready",
    ].includes(phase)
  ) {
    return phase;
  }

  return "idle";
}

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const url = new URL(req.url);

    const eventId =
      url.searchParams.get("event_id") ||
      url.searchParams.get("eventId") ||
      "";

    if (!isUuid(eventId)) {
      return NextResponse.json(
        { ok: false, error: "event_id가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("live_event_settings")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        state: data || {
          event_id: eventId,
          broadcast_phase: "idle",
          current_prize_id: null,
          current_participant_id: null,
          display_message: "방송 대기 중",
          draw_number: null,
          winner_name: null,
          updated_at: null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));

    const eventId = String(body.event_id || body.eventId || "").trim();

    if (!isUuid(eventId)) {
      return NextResponse.json(
        { ok: false, error: "event_id가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const patch = {
      event_id: eventId,
      broadcast_phase: normalizePhase(body.broadcast_phase || body.phase),
      current_prize_id: body.current_prize_id || body.prize_id || null,
      current_participant_id:
        body.current_participant_id || body.participant_id || null,
      display_message:
        String(body.display_message || body.message || "").trim() || null,
      draw_number:
        body.draw_number === undefined || body.draw_number === null
          ? null
          : Number(body.draw_number),
      winner_name:
        String(body.winner_name || body.name || "").trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("live_event_settings")
      .upsert(patch, {
        onConflict: "event_id",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        state: data,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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