import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

async function getCurrentLiveId(
  supabase: ReturnType<typeof createSupabaseAdminClient>
) {
  const live = await supabase
    .from("live_events")
    .select("id")
    .eq("status", "live")
    .order("locked_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (live.error) throw live.error;
  if (live.data?.id) return live.data.id;

  const ready = await supabase
    .from("live_events")
    .select("id")
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ready.error) throw ready.error;
  return ready.data?.id || "";
}

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    let liveId =
      clean(searchParams.get("live_id")) ||
      clean(searchParams.get("event_id"));

    if (!liveId) {
      liveId = await getCurrentLiveId(supabase);
    }

    if (!liveId) {
      return NextResponse.json({
        ok: true,
        live_id: null,
        count: 0,
      });
    }

    const { count, error } = await supabase
      .from("live_participants")
      .select("id", { count: "exact", head: true })
      .eq("live_id", liveId);

    if (error) {
      console.error("[LIVE COUNT ERROR]", error);

      return NextResponse.json(
        {
          ok: false,
          live_id: liveId,
          count: 0,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      live_id: liveId,
      count: Number(count || 0),
    });
  } catch (error) {
    console.error("[LIVE COUNT ROUTE ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        live_id: null,
        count: 0,
        error: error instanceof Error ? error.message : "참여 수 조회 실패",
      },
      { status: 500 }
    );
  }
}