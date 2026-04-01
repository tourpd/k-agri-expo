import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const vendorId = body.vendor_id;
    const start = body.start_date;
    const end = body.end_date;
    const commissionRate = Number(body.commission_rate || 0.1);

    if (!vendorId) return jsonError("vendor_id 필요");
    if (!start || !end) return jsonError("기간 필요");

    const supabase = getSupabaseAdmin();

    // 👉 해당 기간 매출 가져오기
    const { data: orders, error } = await supabase
      .from("expo_event_orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("payment_status", "paid")
      .gte("created_at", start)
      .lte("created_at", end);

    if (error) return jsonError(error.message, 500);

    if (!orders || orders.length === 0) {
      return jsonError("해당 기간 매출 없음");
    }

    // 👉 계산
    const totalSales = orders.reduce(
      (sum: number, o: any) => sum + Number(o.total_amount_krw || 0),
      0
    );

    const commission = Math.round(totalSales * commissionRate);
    const payout = totalSales - commission;

    // 👉 저장
    const { data, error: insertError } = await supabase
      .from("vendor_settlements")
      .insert({
        vendor_id: vendorId,
        period_start: start,
        period_end: end,
        total_sales_krw: totalSales,
        commission_rate: commissionRate,
        commission_amount_krw: commission,
        payout_amount_krw: payout,
        order_count: orders.length,
      })
      .select("*")
      .single();

    if (insertError) return jsonError(insertError.message, 500);

    return Response.json({
      success: true,
      item: data,
    });
  } catch (e: any) {
    return jsonError(e?.message || "정산 생성 실패", 500);
  }
}