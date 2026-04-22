import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await req.json();

    const vendorId = clean(body.vendor_id);

    if (!vendorId) {
      return jsonError("vendor_id가 필요합니다.");
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    // pending 건수 확인
    const { data: pendingRows, error: pendingError } = await supabase
      .from("vendor_billing_events")
      .select("billing_event_id, amount_krw, status")
      .eq("vendor_id", vendorId)
      .eq("status", "pending");

    if (pendingError) {
      return jsonError(pendingError.message, 500);
    }

    if (!pendingRows || pendingRows.length === 0) {
      return jsonError("입금 처리할 pending 항목이 없습니다.", 404);
    }

    const totalAmount = pendingRows.reduce(
      (sum, row: any) => sum + Number(row.amount_krw || 0),
      0
    );

    const ids = pendingRows.map((row: any) => row.billing_event_id);

    const { error: updateError } = await supabase
      .from("vendor_billing_events")
      .update({
        status: "paid",
        meta: {
          paid_at: now,
          paid_by_admin_email: admin.email || "",
        },
      })
      .in("billing_event_id", ids);

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    return Response.json({
      success: true,
      item: {
        vendor_id: vendorId,
        paid_count: ids.length,
        paid_amount_krw: totalAmount,
        paid_at: now,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "입금 처리 중 오류",
      500
    );
  }
}