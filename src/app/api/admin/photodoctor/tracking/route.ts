import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function onlyDigits(v: string) {
  return String(v || "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderCode = String(body.order_code || "").trim();
    const phone = onlyDigits(String(body.buyer_phone || ""));

    if (!orderCode) {
      return NextResponse.json(
        { success: false, error: "주문번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    if (phone.length < 10) {
      return NextResponse.json(
        { success: false, error: "연락처를 정확히 입력해 주세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .select(`
        order_code,
        product_name,
        buyer_name,
        buyer_phone,
        quantity,
        unit_label,
        total_amount,
        payment_status,
        order_status,
        dof_export_status,
        tracking_company,
        tracking_number,
        shipped_at,
        created_at
      `)
      .eq("order_code", orderCode)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "해당 주문번호를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const savedPhone = onlyDigits(data.buyer_phone || "");

    if (!savedPhone.endsWith(phone.slice(-4))) {
      return NextResponse.json(
        { success: false, error: "주문번호와 연락처가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "배송조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}