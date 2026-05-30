import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function getDefaultProduct(issue: string) {
  const text = issue.toLowerCase();

  if (
    text.includes("흰가루") ||
    text.includes("노균") ||
    text.includes("탄저") ||
    text.includes("균")
  ) {
    return {
      product_name: "멸규니",
      unit_price_krw: 29000,
      shipping_fee_krw: 3000,
    };
  }

  if (
    text.includes("총채") ||
    text.includes("진딧") ||
    text.includes("응애") ||
    text.includes("벌레") ||
    text.includes("해충")
  ) {
    return {
      product_name: "싹쓰리충",
      unit_price_krw: 33000,
      shipping_fee_krw: 3000,
    };
  }

  return {
    product_name: "상담 후 제품 결정",
    unit_price_krw: 0,
    shipping_fee_krw: 0,
  };
}

function makeOrderCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `PDO-${y}${m}${d}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const consultId = safe(body.consult_id);

    if (!consultId) {
      return NextResponse.json(
        { ok: false, error: "consult_id가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: consult, error: consultError } = await supabase
      .from("photodoctor_consults")
      .select("*")
      .eq("id", consultId)
      .single();

    if (consultError || !consult) {
      return NextResponse.json(
        {
          ok: false,
          error: consultError?.message || "상담 데이터를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const { data: existingOrder } = await supabase
      .from("photodoctor_orders")
      .select("id, order_code")
      .eq("diagnosis_id", consult.diagnosis_id || "")
      .eq("farmer_phone", consult.phone || "")
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({
        ok: true,
        already_exists: true,
        order: existingOrder,
        message: "이미 주문으로 전환된 상담입니다.",
      });
    }

    const recommend = getDefaultProduct(consult.issue || "");
    const productName = consult.product_name || recommend.product_name;

    const quantity = 1;
    const unitPrice = recommend.unit_price_krw;
    const shippingFee = recommend.shipping_fee_krw;
    const totalAmount = unitPrice * quantity + shippingFee;
    const now = new Date().toISOString();

    const { data: order, error: orderError } = await supabase
      .from("photodoctor_orders")
      .insert({
        order_code: makeOrderCode(),

        farmer_name: consult.name || null,
        farmer_phone: consult.phone || null,

        receiver_name: consult.name || null,
        receiver_phone: consult.phone || null,

        product_name: productName,
        crop_name: consult.crop || null,
        issue_type: consult.issue || null,
        area_text: consult.area_text || null,
        diagnosis_id: consult.diagnosis_id || null,

        quantity,
        unit_price_krw: unitPrice,
        shipping_fee_krw: shippingFee,
        total_amount_krw: totalAmount,

        payment_method: "bank_transfer",
        payment_status: "waiting_deposit",
        order_status: "pending",

        memo: [
          "상담관리에서 주문 전환됨",
          consult.image_url ? `진단사진: ${consult.image_url}` : "",
          consult.message ? `상담내용:\n${consult.message}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),

        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (orderError) {
      return NextResponse.json(
        { ok: false, error: orderError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("photodoctor_consults")
      .update({
        status: "done",
        admin_memo: "주문으로 전환됨",
        updated_at: now,
      })
      .eq("id", consultId);

    if (consult.phone) {
      const { error: farmerOrderError } = await supabase.rpc(
        "increment_farmer_order",
        {
          target_phone: consult.phone,
          amount: totalAmount,
        }
      );

      if (farmerOrderError) {
        console.error("increment_farmer_order error:", farmerOrderError);
      }

      const { error: vipError } = await supabase.rpc("refresh_farmer_vip", {
        target_phone: consult.phone,
      });

      if (vipError) {
        console.error("refresh_farmer_vip error:", vipError);
      }
    }

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "주문 전환 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}