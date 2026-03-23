import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = Number(searchParams.get("order_id") || "0");
    const phone = String(searchParams.get("phone") || "").replace(/[^0-9]/g, "");

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "주문번호가 필요합니다." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "연락처가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("expo_orders")
      .select("*")
      .eq("id", orderId)
      .eq("phone", phone)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "일치하는 주문을 찾을 수 없습니다. 주문번호와 연락처를 다시 확인해 주세요.",
        },
        { status: 404 }
      );
    }

    let booth: any = null;

    if (order.booth_id) {
      const { data: boothData } = await supabase
        .from("booths")
        .select("booth_id, name, is_public, status")
        .eq("booth_id", order.booth_id)
        .maybeSingle();

      booth = boothData || null;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        company_name: order.company_name,
        applicant_name: order.applicant_name,
        phone: order.phone,
        email: order.email,
        product_name: order.product_name,
        amount_krw: order.amount_krw,
        payment_status: order.payment_status,
        order_status: order.order_status,
        vendor_id: order.vendor_id,
        booth_id: order.booth_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      booth,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "주문 상태 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}