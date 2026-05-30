import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prizeId = String(body.prize_id || "").trim();

    if (!prizeId) {
      return NextResponse.json({ ok: false, error: "prize_id가 없습니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: prize, error: prizeError } = await supabase
      .from("live_prizes")
      .select("*")
      .eq("id", prizeId)
      .single();

    if (prizeError || !prize) {
      return NextResponse.json({ ok: false, error: "경품을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: event, error: eventError } = await supabase
      .from("live_events")
      .insert({
        title: `${prize.title} 라이브 이벤트`,
        status: "ready",
      })
      .select("*")
      .single();

    if (eventError || !event) {
      return NextResponse.json({ ok: false, error: eventError?.message || "이벤트 생성 실패" }, { status: 500 });
    }

    const copiedPrize = {
      event_id: event.id,
      title: prize.title,
      sponsor: prize.sponsor,
      category: prize.category,
      description: prize.description,
      preview_note: prize.preview_note,
      image_url: prize.image_url,
      quantity: prize.quantity || 1,
      draw_type: prize.draw_type || "box",
      display_group: prize.display_group || "general",
      sort_order: 1,
      is_active: true,
      vendor_delivery_required: prize.vendor_delivery_required !== false,
      drawn_count: 0,
    };

    const { error: copyError } = await supabase.from("live_prizes").insert(copiedPrize);

    if (copyError) {
      return NextResponse.json({ ok: false, error: copyError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      event,
      message: "선택한 경품으로 새 이벤트가 생성되었습니다.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server error" },
      { status: 500 }
    );
  }
}