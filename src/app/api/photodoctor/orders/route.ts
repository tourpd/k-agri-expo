import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown, fallback = 0) {
  if (v === null || v === undefined || v === "") return fallback;

  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const d = onlyDigits(v);

  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  return v;
}

function makeOrderCode() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `PDO-${ymd}-${rand}`;
}

function getPlatformFeeRate(product: any, body: any) {
  const bodyRate = num(body.platform_fee_rate, -1);
  const productRate = num(product.platform_fee_rate, -1);

  if (bodyRate >= 0) return bodyRate;
  if (productRate >= 0) return productRate;

  return 12;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const productId = safe(body.product_id);
    const productName = safe(body.product_name);

    const buyerName = safe(body.buyer_name);
    const buyerPhone = formatPhone(safe(body.buyer_phone));

    const zipcode = safe(body.zipcode);
    const address = safe(body.address);
    const addressDetail = safe(body.address_detail);

    if (!productId && !productName) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "상품 정보가 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!buyerName) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "주문자 성함을 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (onlyDigits(buyerPhone).length < 10) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "연락처를 정확히 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "주소를 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    const baseProductQuery = supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .limit(1);

    const { data: product, error: productError } = productId
      ? await baseProductQuery.eq("product_id", productId).maybeSingle()
      : await baseProductQuery.eq("name", productName).maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "등록된 상품을 찾지 못했습니다.",
        },
        { status: 404 }
      );
    }

    const quantity = Math.max(1, num(body.quantity, 1));

    const unitPrice = num(
      body.unit_price ??
        body.unit_price_krw ??
        product.price_krw ??
        product.unit_price_krw,
      0
    );

    const shippingFee = num(
      body.shipping_fee ??
        body.shipping_fee_krw ??
        product.shipping_fee_krw ??
        product.shipping_fee,
      3000
    );

    const calculatedTotalAmount = unitPrice * quantity + shippingFee;

    const totalAmount =
      num(body.total_amount ?? body.total_amount_krw, 0) ||
      calculatedTotalAmount;

    /*
      ==================================================
      플랫폼 수익 / 업체 정산 계산
      ==================================================
      예:
      총 주문금액 100,000원
      플랫폼 수수료율 12%
      플랫폼 수익 12,000원
      업체 정산금 88,000원
    */

    const platformFeeRate = getPlatformFeeRate(product, body);

    const platformFeeAmount = Math.floor(
      totalAmount * (platformFeeRate / 100)
    );

    const vendorSettlementAmount =
      totalAmount - platformFeeAmount;

    const now = new Date().toISOString();

    const payload = {
      order_code: makeOrderCode(),

      product_id: product.product_id,
      product_snapshot: product,
      product_name: product.name,

      crop: safe(body.crop),
      diagnosis: safe(body.diagnosis),
      issue: safe(body.issue),
      diagnosis_id: safe(body.diagnosis_id),

      buyer_name: buyerName,
      buyer_phone: buyerPhone,

      zipcode,
      address,
      address_detail: addressDetail,

      area_text: safe(body.area_text),
      area_pyeong: num(body.area_pyeong, 0),

      quantity,
      unit_label: safe(body.unit_label) || product.unit_label || "개",

      unit_price: unitPrice,
      unit_price_krw: unitPrice,

      shipping_fee: shippingFee,
      shipping_fee_krw: shippingFee,

      total_amount: totalAmount,
      total_amount_krw: totalAmount,

      /*
        수익/정산 핵심 컬럼
      */
      platform_fee_rate: platformFeeRate,
      platform_fee_amount: platformFeeAmount,
      vendor_settlement_amount: vendorSettlementAmount,
      settlement_status: "정산대기",

      memo: safe(body.memo),
      source: safe(body.source) || "photodoctor",
      video: safe(body.video),

      payment_method: safe(body.payment_method) || "bank_transfer",
      deposit_bank: safe(body.deposit_bank) || "기업은행 486-072683-04-011",
      deposit_name: safe(body.deposit_name) || buyerName,

      payment_status: "waiting_deposit",
      order_status: "waiting_deposit",
      dof_export_status: "not_exported",

      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ok: true,
      order: data,

      revenue: {
        total_amount_krw: totalAmount,
        platform_fee_rate: platformFeeRate,
        platform_fee_amount: platformFeeAmount,
        vendor_settlement_amount: vendorSettlementAmount,
        settlement_status: "정산대기",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: e?.message || "주문 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}