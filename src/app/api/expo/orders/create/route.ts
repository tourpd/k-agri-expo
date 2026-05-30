import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { applyRevenueToOrder } from "@/lib/revenue/applyRevenueToOrder";
import type { OrderType } from "@/lib/revenue/getCommissionRate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, debug?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
      debug: debug ?? null,
    },
    { status }
  );
}

function cleanText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function cleanNullableText(v: unknown) {
  const text = cleanText(v);
  return text || null;
}

function cleanNumber(v: unknown, fallback: number | null = null) {
  if (v === null || v === undefined || v === "") return fallback;

  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOrderType(v: unknown): OrderType {
  const text = cleanText(v, "general");

  if (text === "photodoctor") return "photodoctor";
  if (text === "live") return "live";

  return "general";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return jsonError("잘못된 요청입니다.", 400);
    }

    const product_id = cleanText(body.product_id);
    const booth_id = cleanText(body.booth_id);

    const buyer_name = cleanText(body.buyer_name);
    const buyer_phone = cleanText(body.buyer_phone);

    if (!buyer_name) return jsonError("이름 입력 필요", 400);
    if (!buyer_phone) return jsonError("연락처 입력 필요", 400);

    const admin = createSupabaseAdminClient();

    let product: any = null;

    if (product_id) {
      const { data, error } = await admin
        .from("products")
        .select(
          `
          id,
          product_id,
          name,
          product_name,
          title,
          brand_id,
          vendor_id,
          price_krw,
          sale_price_krw,
          coverage_per_unit,
          commission_type,
          platform_fee_rate
        `
        )
        .or(`id.eq.${product_id},product_id.eq.${product_id}`)
        .maybeSingle();

      if (error) {
        console.error("[products lookup error]", error);
      }

      product = data;
    }

    const product_name =
      cleanText(body.product_name) ||
      cleanText(product?.product_name) ||
      cleanText(product?.name) ||
      cleanText(product?.title) ||
      "제품명 미입력";

    const product_code =
      cleanText(body.product_code) ||
      product_id ||
      `ORDER-${Date.now()}`;

    const quantity = cleanNumber(body.quantity, 1) || 1;

    const farm_area = cleanNumber(body.farm_area, null);

    const coverage_per_unit =
      cleanNumber(body.coverage_per_unit, null) ??
      cleanNumber(product?.coverage_per_unit, null) ??
      null;

    const recommended_quantity =
      cleanNumber(body.recommended_quantity, null) ??
      quantity;

    const price_krw =
      cleanNumber(body.price_krw) ??
      cleanNumber(product?.price_krw) ??
      0;

    const sale_price_krw =
      cleanNumber(body.sale_price_krw) ??
      cleanNumber(product?.sale_price_krw);

    const unit_price_krw = sale_price_krw ?? price_krw;
    const total_amount_krw = Math.max(unit_price_krw * quantity, 0);

    const order_type = normalizeOrderType(
      body.order_type || product?.commission_type
    );

    const vendor_id =
      cleanNullableText(body.vendor_id) ||
      cleanNullableText(product?.vendor_id);

    const brand_id =
      cleanNullableText(body.brand_id) ||
      cleanNullableText(product?.brand_id);

    const revenue = await applyRevenueToOrder({
      orderType: order_type,
      orderAmount: total_amount_krw,
      productId: product_id || null,
      vendorId: vendor_id,
      brandId: brand_id,
    });

    const payload = {
      company_name: cleanNullableText(body.company_name),
      applicant_name: buyer_name,
      phone: buyer_phone,
      email: cleanNullableText(body.email),
      product_code,
      product_name,
      amount_krw: total_amount_krw,
      payment_method: cleanText(body.payment_method, "bank_transfer"),
      payment_status: cleanText(body.payment_status, "requested"),
      order_status: cleanText(body.order_status, "pending"),
      note: cleanNullableText(body.buyer_memo),

      product_id: product_id || null,
      booth_id: booth_id || null,
      vendor_id,
      brand_id,

      order_type,

      promo_type: cleanNullableText(body.promo_type),
      promo_title: cleanNullableText(body.promo_title),
      promo_reason: cleanNullableText(body.promo_reason),
      promo_condition: cleanNullableText(body.promo_condition),

      price_krw,
      sale_price_krw,
      unit_price_krw,
      total_amount_krw,

      buyer_name,
      buyer_phone,
      buyer_region: cleanNullableText(body.buyer_region),
      buyer_memo: cleanNullableText(body.buyer_memo),
      quantity,

      farm_area,
      coverage_per_unit,
      recommended_quantity,

      platform_fee_rate: revenue.platform_fee_rate,
      platform_fee_amount: revenue.platform_fee_amount,
      vendor_settlement_amount: revenue.vendor_settlement_amount,
      settlement_status: revenue.settlement_status,

      applied_commission_rule_id: revenue.applied_commission_rule_id,
      applied_commission_scope: revenue.applied_commission_scope,
      applied_commission_title: revenue.applied_commission_title,

      commission_type: order_type,
      revenue_category: order_type,

      status: cleanText(body.status, "pending"),
      source: cleanText(body.source, "expo_product"),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("expo_orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("[expo_orders insert error]", error);
      return jsonError("주문 저장 실패", 500, error);
    }

    return NextResponse.json({
      ok: true,
      success: true,
      order: data,
    });
  } catch (e) {
    console.error("[expo_orders create exception]", e);

    return jsonError(e instanceof Error ? e.message : "서버 오류", 500);
  }
}