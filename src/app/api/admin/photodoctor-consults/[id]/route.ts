import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ("payment_status" in body) patch.payment_status = body.payment_status;
    if ("order_status" in body) patch.order_status = body.order_status;
    if ("deposit_name" in body) patch.deposit_name = body.deposit_name;
    if ("deposit_bank" in body) patch.deposit_bank = body.deposit_bank;
    if ("memo" in body) patch.memo = body.memo;
    if ("tracking_company" in body) patch.tracking_company = body.tracking_company;
    if ("tracking_number" in body) patch.tracking_number = body.tracking_number;

    if (
      "quantity" in body ||
      "unit_price_krw" in body ||
      "shipping_fee_krw" in body
    ) {
      const quantity = Math.max(1, toNumber(body.quantity));
      const unitPrice = toNumber(body.unit_price_krw);
      const shippingFee = toNumber(body.shipping_fee_krw);

      patch.quantity = quantity;
      patch.unit_price_krw = unitPrice;
      patch.shipping_fee_krw = shippingFee;
      patch.total_amount_krw = quantity * unitPrice + shippingFee;
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "주문 수정 실패",
      },
      { status: 500 }
    );
  }
}