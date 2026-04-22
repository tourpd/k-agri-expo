import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string | null) {
  return (v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const url = new URL(req.url);
    const matched = clean(url.searchParams.get("matched"));
    const q = clean(url.searchParams.get("q"));

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("bank_transactions")
      .select(`
        tx_id,
        amount_krw,
        depositor_name,
        deposited_at,
        matched,
        matched_order_id,
        matched_at,
        match_note,
        raw_data,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (matched === "true") query = query.eq("matched", true);
    if (matched === "false") query = query.eq("matched", false);

    if (q) {
      query = query.or(
        [
          `depositor_name.ilike.%${q}%`,
          `match_note.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data: txs, error } = await query;

    if (error) return jsonError(error.message, 500);

    const orderIds = Array.from(
      new Set((txs || []).map((x: any) => x.matched_order_id).filter(Boolean))
    );

    let ordersMap = new Map<string, any>();

    if (orderIds.length > 0) {
      const { data: orders, error: orderError } = await supabase
        .from("expo_event_orders")
        .select(`
          order_id,
          event_id,
          farmer_name,
          farmer_phone,
          depositor_name,
          total_amount_krw,
          payment_status,
          created_at
        `)
        .in("order_id", orderIds);

      if (orderError) return jsonError(orderError.message, 500);

      ordersMap = new Map((orders || []).map((o: any) => [o.order_id, o]));
    }

    const items = (txs || []).map((tx: any) => ({
      ...tx,
      matched_order: tx.matched_order_id
        ? ordersMap.get(tx.matched_order_id) || null
        : null,
    }));

    const summary = {
      total_count: items.length,
      matched_count: items.filter((x: any) => !!x.matched).length,
      unmatched_count: items.filter((x: any) => !x.matched).length,
      total_amount_krw: items.reduce(
        (sum: number, x: any) => sum + Number(x.amount_krw || 0),
        0
      ),
    };

    return Response.json({
      success: true,
      summary,
      items,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "입금 로그 조회 실패",
      500
    );
  }
}