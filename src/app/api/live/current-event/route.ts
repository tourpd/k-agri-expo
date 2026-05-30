import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    // 1순위: 방송중 이벤트
    let { data: event, error } = await supabase
      .from("live_events")
      .select("*")
      .eq("status", "live")
      .order("locked_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // 2순위: 방송중이 없으면 준비중 최신 이벤트
    if (!event) {
      const fallback = await supabase
        .from("live_events")
        .select("*")
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallback.error) {
        return NextResponse.json(
          { ok: false, error: fallback.error.message },
          { status: 500 }
        );
      }

      event = fallback.data;
    }

    if (!event) {
      return NextResponse.json({
        ok: false,
        error: "현재 운영 가능한 라이브 이벤트가 없습니다.",
        event: null,
        prizes: [],
      });
    }

    const { data: prizes, error: prizeError } = await supabase
      .from("live_prizes")
      .select("*")
      .eq("event_id", event.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (prizeError) {
      return NextResponse.json(
        { ok: false, error: prizeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      event,
      prizes: prizes || [],
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