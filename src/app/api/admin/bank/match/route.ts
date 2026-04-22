import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(str: string = "") {
  return str.replace(/\s/g, "").toLowerCase();
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function POST() {
  try {
    await requireAdminUser();

    const supabase = createSupabaseAdminClient();

    // 1) 미매칭 입금 가져오기
    const { data: txs, error: txError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("matched", false)
      .order("created_at", { ascending: true });

    if (txError) {
      return jsonError(txError.message, 500);
    }

    if (!txs || txs.length === 0) {
      return Response.json({
        success: true,
        matched: 0,
        skipped: 0,
        details: [],
      });
    }

    let matchCount = 0;
    let skippedCount = 0;
    const details: Array<{
      tx_id: string;
      amount_krw: number;
      depositor_name: string | null;
      result: "matched" | "skipped";
      reason?: string;
      matched_order_id?: string;
    }> = [];

    for (const tx of txs) {
      const txId = String(tx.tx_id || "");
      const txAmount = Number(tx.amount_krw || 0);
      const txDepositor = String(tx.depositor_name || "");

      // 2) 금액 기준 후보 주문 찾기
      const { data: orders, error: orderError } = await supabase
        .from("expo_event_orders")
        .select("*")
        .eq("payment_status", "pending")
        .eq("total_amount_krw", txAmount)
        .order("created_at", { ascending: true });

      if (orderError) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: `주문 조회 오류: ${orderError.message}`,
        });
        continue;
      }

      if (!orders || orders.length === 0) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: "동일 금액의 pending 주문 없음",
        });
        continue;
      }

      // 3) 이름 매칭
      const matchedOrder = orders.find((o: any) => {
        const depositor = normalize(txDepositor);
        const orderName = normalize(o.depositor_name || o.farmer_name || "");
        if (!depositor || !orderName) return false;
        return orderName.includes(depositor) || depositor.includes(orderName);
      });

      if (!matchedOrder) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: "금액은 같지만 입금자명 매칭 실패",
        });
        continue;
      }

      const now = new Date().toISOString();

      // 4) 주문 업데이트
      const { error: orderUpdateError } = await supabase
        .from("expo_event_orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          paid_at: now,
          payment_tx_id: txId,
          updated_at: now,
        })
        .eq("order_id", matchedOrder.order_id)
        .eq("payment_status", "pending");

      if (orderUpdateError) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: `주문 업데이트 실패: ${orderUpdateError.message}`,
        });
        continue;
      }

      // 5) 이벤트 수량 반영
      const { data: event, error: eventError } = await supabase
        .from("expo_events")
        .select("event_id, sold_quantity, reserved_quantity")
        .eq("event_id", matchedOrder.event_id)
        .single();

      if (eventError || !event) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: eventError?.message || "이벤트 조회 실패",
        });
        continue;
      }

      const newReserved = Math.max(
        0,
        Number(event.reserved_quantity || 0) - Number(matchedOrder.quantity || 0)
      );

      const newSold =
        Number(event.sold_quantity || 0) + Number(matchedOrder.quantity || 0);

      const { error: eventUpdateError } = await supabase
        .from("expo_events")
        .update({
          reserved_quantity: newReserved,
          sold_quantity: newSold,
          updated_at: now,
        })
        .eq("event_id", matchedOrder.event_id);

      if (eventUpdateError) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: `이벤트 수량 반영 실패: ${eventUpdateError.message}`,
        });
        continue;
      }

      // 6) 입금 로그 업데이트
      const { error: txUpdateError } = await supabase
        .from("bank_transactions")
        .update({
          matched: true,
          matched_order_id: matchedOrder.order_id,
          matched_at: now,
          match_note: `자동 매칭 성공 / order_id=${matchedOrder.order_id}`,
        })
        .eq("tx_id", txId)
        .eq("matched", false);

      if (txUpdateError) {
        skippedCount++;
        details.push({
          tx_id: txId,
          amount_krw: txAmount,
          depositor_name: txDepositor,
          result: "skipped",
          reason: `입금 로그 업데이트 실패: ${txUpdateError.message}`,
        });
        continue;
      }

      matchCount++;
      details.push({
        tx_id: txId,
        amount_krw: txAmount,
        depositor_name: txDepositor,
        result: "matched",
        matched_order_id: matchedOrder.order_id,
      });
    }

    return Response.json({
      success: true,
      matched: matchCount,
      skipped: skippedCount,
      details,
    });
  } catch (e: any) {
    return jsonError(e?.message || "매칭 실패", 500);
  }
}