import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function prizeTitle(body: any) {
  return clean(body.prize_text) || clean(body.title) || "라이브 경품";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const title = clean(body.title) || "K-Agri LIVE 이벤트";
    const subtitle = clean(body.subtitle);
    const description = clean(body.description);
    const prize_text = clean(body.prize_text);
    const image_url = clean(body.image_url);
    const video_url = clean(body.video_url);
    const live_url = clean(body.live_url);
    const live_password = clean(body.live_password) || "1234";
    const incomingEventId = clean(body.event_id);

    let eventId = incomingEventId;

    if (eventId) {
      const { data: existingEvent } = await supabase
        .from("live_events")
        .select("id")
        .eq("id", eventId)
        .maybeSingle();

      if (!existingEvent?.id) {
        eventId = "";
      }
    }

    if (!eventId) {
      const { data: newEvent, error: insertEventError } = await supabase
        .from("live_events")
        .insert({
          title,
          status: "live",
          locked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertEventError || !newEvent?.id) {
        return NextResponse.json({
          ok: false,
          error: insertEventError?.message || "이벤트 생성 실패",
        });
      }

      eventId = newEvent.id;
    }

    await supabase
      .from("live_events")
      .update({
        status: "ended",
      })
      .neq("id", eventId)
      .in("status", ["live", "ready"]);

    const { error: updateEventError } = await supabase
      .from("live_events")
      .update({
        title,
        status: "live",
        locked_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (updateEventError) {
      return NextResponse.json({
        ok: false,
        error: updateEventError.message,
      });
    }

    const { data: existingPrize } = await supabase
      .from("live_prizes")
      .select("id")
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prizePayload = {
      event_id: eventId,
      title: prizeTitle(body),
      description: description || subtitle || prize_text,
      image_url,
      sponsor: "K-Agri Expo",
      quantity: 1,
      total_winners: 1,
      draw_type: "box",
      display_group: "big",
      category: "live",
      preview_note: subtitle,
      is_active: true,
      sort_order: 1,
    };

    if (existingPrize?.id) {
      const { error: updatePrizeError } = await supabase
        .from("live_prizes")
        .update(prizePayload)
        .eq("id", existingPrize.id);

      if (updatePrizeError) {
        return NextResponse.json({
          ok: false,
          error: updatePrizeError.message,
        });
      }
    } else {
      const { error: insertPrizeError } = await supabase
        .from("live_prizes")
        .insert(prizePayload);

      if (insertPrizeError) {
        return NextResponse.json({
          ok: false,
          error: insertPrizeError.message,
        });
      }
    }

    const settingsPayload = {
      id: "00000000-0000-0000-0000-000000000001",
      event_id: eventId,
      title,
      subtitle,
      description,
      prize_text,
      image_url,
      video_url,
      live_url,
      live_password,
      updated_at: new Date().toISOString(),
    };

    const { error: settingsError } = await supabase
      .from("live_event_settings")
      .upsert(settingsPayload, {
        onConflict: "id",
      });

    if (settingsError) {
      return NextResponse.json({
        ok: false,
        error: settingsError.message,
      });
    }

    return NextResponse.json({
      ok: true,
      event_id: eventId,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "server error",
    });
  }
}