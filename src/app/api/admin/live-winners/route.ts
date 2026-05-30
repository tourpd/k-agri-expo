import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = createSupabaseAdminClient();
  const url = new URL(req.url);
  const eventId = url.searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json(
      { ok: false, error: "event_id 필요" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("live_winners")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    winners: data || [],
  });
}