import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createSupabaseAdminClient();

    // 24시간 지난 미입금 pending 주문
    const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

    const { data: orders, error } = await supabase
      .from("expo_event_orders")
      .select("*")
      .eq("payment_status", "pending")
      .neq("order_status", "cancelled")
      .lte("created_at", threshold);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return Response.json({ success: true, expired: 0 });
    }

    let expiredCount = 0;

    for (const order of orders) {
      const now = new Date().toISOString();

      const { error: orderUpdateError } = await supabase
        .from("expo_event_orders")
        .update({
          order_status: "cancelled",
          updated_at: now,
          note: `${order.note || ""}\n[system] 24시간 미입금 자동취소`.trim(),
        })
        .eq("order_id", order.order_id)
        .eq("payment_status", "pending")
        .neq("order_status", "cancelled");

      if (orderUpdateError) continue;

      const { data: event } = await supabase
        .from("expo_events")
        .select("event_id, reserved_quantity")
        .eq("event_id", order.event_id)
        .single();

      if (event) {
        const newReserved = Math.max(
          0,
          Number(event.reserved_quantity || 0) - Number(order.quantity || 0)
        );

        await supabase
          .from("expo_events")
          .update({
            reserved_quantity: newReserved,
            updated_at: now,
          })
          .eq("event_id", order.event_id);
      }

      expiredCount++;
    }

    return Response.json({
      success: true,
      expired: expiredCount,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error?.message || "자동 취소 실패" },
      { status: 500 }
    );
  }
}