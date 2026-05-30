import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ ok: false, error: "id 필요" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // 1) 경품 존재 & 활성화 체크
    const { data: prizes, error: pErr } = await supabase
      .from("live_prizes")
      .select("id,is_active")
      .eq("event_id", id);

    if (pErr) throw pErr;

    const activeCount =
      (prizes || []).filter((p: any) => p.is_active !== false).length;

    if (activeCount === 0) {
      return NextResponse.json({
        ok: false,
        error: "활성 경품이 없습니다. 경품편성 먼저 하세요.",
      });
    }

    // 2) 상태 LIVE로 변경
    const { error: uErr } = await supabase
      .from("live_events")
      .update({
        status: "live",
        locked_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (uErr) throw uErr;

    return NextResponse.json({
      ok: true,
      message: "라이브 시작 완료",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "오류" },
      { status: 500 }
    );
  }
}