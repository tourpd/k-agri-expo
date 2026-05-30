import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

    if ("quantity" in body || "unit_price_krw" in body || "shipping_fee_krw" in body) {
      const quantity = Math.max(1, num(body.quantity, 1));
      const unitPrice = num(body.unit_price_krw, 0);
      const shippingFee = num(body.shipping_fee_krw, 0);

      patch.quantity = quantity;
      patch.unit_price_krw = unitPrice;
      patch.shipping_fee_krw = shippingFee;
      patch.total_amount_krw = quantity * unitPrice + shippingFee;
    }

    if ("deposit_name" in body) patch.deposit_name = body.deposit_name;
    if ("memo" in body) patch.memo = body.memo;

    if ("receiver_name" in body) patch.receiver_name = body.receiver_name;
    if ("receiver_phone" in body) patch.receiver_phone = body.receiver_phone;
    if ("zipcode" in body) patch.zipcode = body.zipcode;
    if ("address1" in body) patch.address1 = body.address1;
    if ("address2" in body) patch.address2 = body.address2;
    if ("email" in body) patch.email = body.email;

    if ("payment_status" in body) patch.payment_status = body.payment_status;
    if ("order_status" in body) patch.order_status = body.order_status;
    if ("courier" in body) patch.courier = body.courier;
    if ("tracking_number" in body) patch.tracking_number = body.tracking_number;

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
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