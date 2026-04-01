import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { data: events, error } = await supabase
      .from("expo_events")
      .select("*")
      .eq("is_active", true);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return Response.json({ success: true, closed: 0 });
    }

    let closedCount = 0;

    for (const event of events) {
      const totalQty = Number(event.total_quantity || 0);
      const soldQty = Number(event.sold_quantity || 0);
      const reservedQty = Number(event.reserved_quantity || 0);
      const available = totalQty - soldQty - reservedQty;

      let shouldClose = false;
      let reason = "";

      if (event.end_at && new Date(event.end_at).getTime() < Date.now()) {
        shouldClose = true;
        reason = "기간 종료";
      }

      if (available <= 0) {
        shouldClose = true;
        reason = "수량 소진";
      }

      if (!shouldClose) continue;

      const { error: updateError } = await supabase
        .from("expo_events")
        .update({
          is_active: false,
          is_closed_early: reason === "수량 소진" ? true : event.is_closed_early,
          close_reason: reason,
          updated_at: nowIso,
        })
        .eq("event_id", event.event_id)
        .eq("is_active", true);

      if (updateError) continue;

      // 관리자 알림 기록
      await supabase.from("expo_event_alerts").insert({
        event_id: event.event_id,
        alert_type: reason === "수량 소진" ? "sold_out" : "closed",
        title: `[자동종료] ${event.title || event.product_name || "이벤트"}`,
        message: `${reason}로 자동 종료되었습니다.`,
        is_read: false,
        created_at: nowIso,
      });

      closedCount++;
    }

    return Response.json({
      success: true,
      closed: closedCount,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error?.message || "자동 종료 실패" },
      { status: 500 }
    );
  }
}