import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function pad(n?: number | null) {
  return String(n || 0).padStart(4, "0");
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

function makeDrawNumber(row: any, index: number) {
  if (row.draw_number) return Number(row.draw_number);
  if (row.locked_candidate_no) return Number(row.locked_candidate_no);

  const raw = String(row.id || "");
  const compact = raw.replace(/\D/g, "").slice(-4);

  if (compact) return Number(compact);

  return index + 1;
}

function normalizePrize(row: any) {
  const mediaMode = String(row?.media_mode || "image").trim();

  return {
    ...row,
    title: row?.title || "라이브 경품",
    sponsor: row?.sponsor || null,
    image_url: row?.image_url || null,
    video_url: row?.video_url || null,
    media_mode: ["image", "video", "both", "none"].includes(mediaMode)
      ? mediaMode
      : "image",
    event_label: row?.event_label || "메인 이벤트",
    headline: row?.headline || row?.title || "오늘의 라이브 경품",
    subheadline:
      row?.subheadline ||
      row?.preview_note ||
      row?.description ||
      "방송 중 참여 농민 대상 라이브 이벤트 경품입니다.",
    winner_note: row?.winner_note || "방송 중 전화 확인 후 최종 당첨 확정",
    number_font_size: Number(row?.number_font_size || 180),
    name_font_size: Number(row?.name_font_size || 86),
    note_font_size: Number(row?.note_font_size || 48),
    sort_order: Number(row?.sort_order || 1),
    is_active: row?.is_active !== false,
  };
}

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const url = new URL(req.url);

    const eventId =
      url.searchParams.get("event_id") ||
      url.searchParams.get("eventId") ||
      "";

    const prizeIdFromUrl =
      url.searchParams.get("prize_id") ||
      url.searchParams.get("prizeId") ||
      "";

    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "event_id가 없습니다." },
        { status: 400 }
      );
    }

    if (!isUuid(eventId)) {
      return NextResponse.json(
        { ok: false, error: `event_id가 UUID 형식이 아닙니다: ${eventId}` },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("live_events")
      .select("*")
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

    const { data: prizesRaw, error: prizeError } = await supabase
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

    const prizeRows = (prizesRaw || []).map(normalizePrize);

    const { data: settings } = await supabase
      .from("live_event_settings")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    const requestedPrizeId =
      prizeIdFromUrl && isUuid(prizeIdFromUrl) ? prizeIdFromUrl : "";

    const savedPrizeId =
      requestedPrizeId ||
      String(event.current_prize_id || "").trim() ||
      String(settings?.current_prize_id || "").trim() ||
      String(settings?.current_live_prize_id || "").trim() ||
      String(settings?.active_prize_id || "").trim();

    const currentPrize =
      prizeRows.find((p: any) => p.id === savedPrizeId) || prizeRows[0] || null;

    const orderedPrizes = currentPrize
      ? [
          currentPrize,
          ...prizeRows.filter((p: any) => p.id !== currentPrize.id),
        ]
      : prizeRows;

    const { data: drawnParticipants, error: participantError } = await supabase
      .from("live_participants")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_drawn", true)
      .order("drawn_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (participantError) {
      return NextResponse.json(
        { ok: false, error: participantError.message },
        { status: 500 }
      );
    }

    const winners = (drawnParticipants || []).map((row: any, index: number) => {
      const rowPrizeId = row.prize_id || row.live_prize_id || null;

      const prize =
        prizeRows.find((p: any) => p.id === rowPrizeId) ||
        currentPrize ||
        prizeRows[0] ||
        null;

      const drawNumber = makeDrawNumber(row, index);

      return {
        id: row.id,
        event_id: row.event_id,
        prize_id: prize?.id || null,
        prize_title: prize?.title || "라이브 경품",
        draw_number: drawNumber,
        draw_number_text: pad(drawNumber),
        winner_name: row.name || row.winner_name || null,
        winner_phone: row.phone || row.winner_phone || null,
        region: row.region || null,
        crop: row.crop || null,
        farm_size: row.farm_size || null,
        call_status: row.call_status || null,
        confirmed_winner: row.confirmed_winner || false,
        created_at: row.drawn_at || row.created_at,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        event: {
          ...event,
          current_prize_id: currentPrize?.id || null,
          safe_start_at: event.start_at || null,
          safe_end_at: event.end_at || event.ended_at || null,
          dday_label:
            event.end_at || event.start_at ? null : "일정 준비중",
        },
        settings: settings || null,
        current_prize: currentPrize,
        prizes: orderedPrizes,
        winners,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
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