import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ⚠️ 긴급 잠금 (2026-10-30)
// 이 웹훅은 토스가 보낸 요청인지 확인하는 절차가 없어서, 누구나 주문을 '결제 완료'로
// 바꿀 수 있었습니다. 실제 토스 가상계좌 연동(시크릿 검증)을 붙이기 전까지 꺼 둡니다.
const WEBHOOK_ENABLED = false;

export async function POST(req: Request) {
  if (!WEBHOOK_ENABLED) {
    return Response.json(
      { success: false, error: "virtual-account webhook is disabled" },
      { status: 410 }
    );
  }
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    // 토스 웹훅 payload는 실제 연동 시 필드명 확인 후 맞추세요.
    const payment = body?.data || body || {};
    const amount = Number(payment.totalAmount || payment.amount || 0);
    const depositorName = String(payment.virtualAccount?.depositorName || payment.depositorName || "");
    const depositedAt = payment.approvedAt || new Date().toISOString();
    const orderId = String(payment.orderId || "");

    // 1) bank_transactions 적재
    const { data: tx, error: txError } = await supabase
      .from("bank_transactions")
      .insert({
        amount_krw: amount,
        depositor_name: depositorName || null,
        deposited_at: depositedAt,
        matched: false,
        raw_data: body,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (txError) {
      return Response.json({ success: false, error: txError.message }, { status: 500 });
    }

    // 2) orderId가 있으면 바로 주문에 매칭 시도
    if (orderId) {
      const now = new Date().toISOString();

      const { data: order, error: orderError } = await supabase
        .from("expo_event_orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (!orderError && order && order.payment_status === "pending") {
        await supabase
          .from("expo_event_orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
            paid_at: now,
            payment_tx_id: tx.tx_id,
            updated_at: now,
          })
          .eq("order_id", orderId);

        const { data: event } = await supabase
          .from("expo_events")
          .select("event_id, sold_quantity, reserved_quantity")
          .eq("event_id", order.event_id)
          .single();

        if (event) {
          await supabase
            .from("expo_events")
            .update({
              reserved_quantity: Math.max(0, Number(event.reserved_quantity || 0) - Number(order.quantity || 0)),
              sold_quantity: Number(event.sold_quantity || 0) + Number(order.quantity || 0),
              updated_at: now,
            })
            .eq("event_id", order.event_id);
        }

        await supabase
          .from("bank_transactions")
          .update({
            matched: true,
            matched_order_id: order.order_id,
            matched_at: now,
            match_note: `토스 웹훅 direct match / order_id=${order.order_id}`,
          })
          .eq("tx_id", tx.tx_id);
      }
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error?.message || "webhook failed" },
      { status: 500 }
    );
  }
}