import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(v: unknown) {
  const d = String(v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return String(v || "").trim();
}

async function getCurrentEvent(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const live = await supabase
    .from("live_events")
    .select("*")
    .eq("status", "live")
    .order("locked_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (live.data) return live.data;

  const ready = await supabase
    .from("live_events")
    .select("*")
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ready.data;
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json();
    const phone = normalizePhone(body.phone);

    if (!phone) {
      return NextResponse.json({ ok: false, error: "전화번호를 입력해주세요." }, { status: 400 });
    }

    const event = await getCurrentEvent(supabase);

    if (!event?.id) {
      return NextResponse.json(
        { ok: false, error: "현재 운영 중인 이벤트가 없습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("live_participants")
      .select("*")
      .eq("event_id", event.id)
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "해당 전화번호의 참여 기록이 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      event,
      participant: data,
      draw_number: data.draw_number,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server error" },
      { status: 500 }
    );
  }
}