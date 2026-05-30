import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return String(v || "").trim();
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "주문 ID가 없습니다.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const paymentStatus = safe(body.payment_status) || "입금대기";
    const orderStatus = safe(body.order_status) || "접수";

    const trackingNumber = safe(body.tracking_number);
    const deliveryCompany = safe(body.delivery_company);

    const memo = safe(body.memo);

    const supabase = createSupabaseAdminClient();

    const updatePayload = {
      payment_status: paymentStatus,
      order_status: orderStatus,

      tracking_number: trackingNumber || null,
      delivery_company: deliveryCompany || null,

      memo: memo || null,

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("expo_brand_orders")
      .update(updatePayload)
      .eq("id", id)
      .select(`
        *,
        expo_brand_products (
          product_name
        ),
        expo_brands (
          brand_name
        )
      `)
      .single();

    if (error) {
      console.error(
        "[admin/product-orders/:id] PATCH error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const order = {
      ...data,
      product_name:
        data?.expo_brand_products?.product_name || null,

      brand_name:
        data?.expo_brands?.brand_name || null,
    };

    return NextResponse.json({
      success: true,
      message: "제품 주문 정보가 저장되었습니다.",
      order,
    });
  } catch (error) {
    console.error(
      "[admin/product-orders/:id] PATCH fatal:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "제품 주문 저장 실패",
      },
      { status: 500 }
    );
  }
}