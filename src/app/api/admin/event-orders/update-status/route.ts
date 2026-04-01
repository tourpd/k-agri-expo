import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    await requireAdminUser();

    const body = await req.json();

    const orderId = clean(body.order_id);
    const action = clean(body.action);

    if (!orderId) return jsonError("order_id가 필요합니다.");
    if (!action) return jsonError("action이 필요합니다.");

    const supabase = getSupabaseAdmin();

    const { data: order, error: orderError } = await supabase
      .from("expo_event_orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return jsonError(orderError?.message || "주문을 찾지 못했습니다.", 404);
    }

    const now = new Date().toISOString();
    let patch: Record<string, any> = {
      updated_at: now,
    };

    if (action === "mark_paid") {
      if (order.payment_status === "paid") {
        return jsonError("이미 입금 완료된 주문입니다.", 400);
      }

      patch.payment_status = "paid";
      patch.order_status = order.order_status === "pending" ? "confirmed" : order.order_status;

      // reserved → sold 반영
      const { data: event, error: eventError } = await supabase
        .from("expo_events")
        .select("event_id, sold_quantity, reserved_quantity")
        .eq("event_id", order.event_id)
        .single();

      if (eventError || !event) {
        return jsonError(eventError?.message || "이벤트를 찾지 못했습니다.", 404);
      }

      const newReserved = Math.max(0, Number(event.reserved_quantity || 0) - Number(order.quantity || 0));
      const newSold = Number(event.sold_quantity || 0) + Number(order.quantity || 0);

      const { error: eventUpdateError } = await supabase
        .from("expo_events")
        .update({
          reserved_quantity: newReserved,
          sold_quantity: newSold,
          updated_at: now,
        })
        .eq("event_id", order.event_id);

      if (eventUpdateError) {
        return jsonError(eventUpdateError.message, 500);
      }
    } else if (action === "mark_preparing") {
      if (order.payment_status !== "paid") {
        return jsonError("입금 완료 후 출고 준비로 변경할 수 있습니다.", 400);
      }
      patch.shipping_status = "preparing";
    } else if (action === "mark_shipped") {
      if (order.payment_status !== "paid") {
        return jsonError("입금 완료 후 출고 완료로 변경할 수 있습니다.", 400);
      }
      patch.shipping_status = "shipped";
    } else if (action === "cancel_order") {
      patch.order_status = "cancelled";

      // 미입금 상태면 reserved 수량 복구
      if (order.payment_status !== "paid") {
        const { data: event, error: eventError } = await supabase
          .from("expo_events")
          .select("event_id, reserved_quantity")
          .eq("event_id", order.event_id)
          .single();

        if (eventError || !event) {
          return jsonError(eventError?.message || "이벤트를 찾지 못했습니다.", 404);
        }

        const newReserved = Math.max(0, Number(event.reserved_quantity || 0) - Number(order.quantity || 0));

        const { error: eventUpdateError } = await supabase
          .from("expo_events")
          .update({
            reserved_quantity: newReserved,
            updated_at: now,
          })
          .eq("event_id", order.event_id);

        if (eventUpdateError) {
          return jsonError(eventUpdateError.message, 500);
        }
      }
    } else {
      return jsonError("지원하지 않는 action입니다.", 400);
    }

    const { data: updated, error: updateError } = await supabase
      .from("expo_event_orders")
      .update(patch)
      .eq("order_id", orderId)
      .select("*")
      .single();

    if (updateError || !updated) {
      return jsonError(updateError?.message || "주문 상태 변경 실패", 500);
    }

    return Response.json({
      success: true,
      item: updated,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "주문 상태 변경 중 오류",
      500
    );
  }
}