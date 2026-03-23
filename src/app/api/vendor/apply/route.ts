import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      company_name,
      applicant_name,
      phone,
      email,
      product_code,
      note,
    }: {
      company_name?: string;
      applicant_name?: string;
      phone?: string;
      email?: string;
      product_code?: string;
      note?: string;
    } = body;

    // ✅ 필수값 체크
    if (!company_name?.trim()) {
      return NextResponse.json(
        { success: false, error: "회사명은 필수입니다." },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { success: false, error: "연락처는 필수입니다." },
        { status: 400 }
      );
    }

    if (!product_code?.trim()) {
      return NextResponse.json(
        { success: false, error: "신청 상품을 선택해 주세요." },
        { status: 400 }
      );
    }

    // ✅ 상품 조회
    const { data: product, error: productError } = await supabase
      .from("expo_products")
      .select("*")
      .eq("code", product_code.trim())
      .eq("is_active", true)
      .single();

    if (productError) {
      return NextResponse.json(
        { success: false, error: productError.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "유효한 상품이 아닙니다." },
        { status: 400 }
      );
    }

    // ✅ 전화번호 정리
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // ✅ 주문 생성 (핵심)
    const { data, error } = await supabase
      .from("expo_orders")
      .insert({
        company_name: company_name.trim(),
        applicant_name: applicant_name?.trim() || null,
        phone: cleanPhone,
        email: email?.trim() || null,
        product_code: product.code,
        product_name: product.name,
        amount_krw: product.price_krw,
        payment_method: "bank_transfer",
        payment_status: "pending",
        order_status: "requested",
        note: note?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // ✅ 완료 응답
    return NextResponse.json({
      success: true,
      order: data,
      message:
        "입점 신청이 접수되었습니다. 관리자가 확인 후 입금 안내를 드립니다.",
      complete: {
        order_id: data.id,
        company_name: data.company_name,
        product_name: data.product_name,
        amount_krw: data.amount_krw,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "입점 신청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}