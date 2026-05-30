import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const d = onlyDigits(v);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  return v;
}

function makeOrderCode() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PDO-${ymd}-${rand}`;
}

function getProductInfo(productName: string) {
  const p = productName.replace(/\s+/g, "");

  if (p.includes("멸규니")) {
    return {
      product_name: "멸규니",
      unit_price_krw: 29000,
      shipping_fee_krw: 3000,
    };
  }

  if (p.includes("싹쓰리충")) {
    return {
      product_name: "싹쓰리충",
      unit_price_krw: 33000,
      shipping_fee_krw: 3000,
    };
  }

  return {
    product_name: productName || "포토닥터 추천 제품",
    unit_price_krw: 0,
    shipping_fee_krw: 3000,
  };
}

function getOrderSourceType(sourceType: string) {
  const s = sourceType.toLowerCase();

  if (s.includes("youtube")) return "youtube_order";
  if (s.includes("consult")) return "converted_consult";
  if (s.includes("manual")) return "manual_order";

  return "direct_order";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const farmerName = safe(body.farmer_name || body.name);
    const farmerPhoneRaw = safe(body.farmer_phone || body.phone);
    const farmerPhone = formatPhone(farmerPhoneRaw);

    const receiverName = safe(body.receiver_name) || farmerName;
    const receiverPhone = formatPhone(safe(body.receiver_phone) || farmerPhone);

    const zipcode = safe(body.zipcode);
    const address1 = safe(body.address1);
    const address2 = safe(body.address2);
    const email = safe(body.email);

    const productNameRaw = safe(body.product_name || body.product);
    const cropName = safe(body.crop_name || body.crop);
    const issueType = safe(body.issue_type || body.issue);
    const areaText = safe(body.area_text);
    const diagnosisId = safe(body.diagnosis_id);

    const paymentMethod = safe(body.payment_method) || "manual";
    const depositBank = safe(body.deposit_bank);
    const depositName = safe(body.deposit_name) || farmerName;

    const sourceType = safe(body.source_type || body.source) || "photodoctor";
    const sourceVideo = safe(body.source_video || body.video);
    const orderSourceType = getOrderSourceType(sourceType);

    const memo = safe(body.memo);
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!farmerName) {
      return NextResponse.json(
        { ok: false, error: "이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!farmerPhone) {
      return NextResponse.json(
        { ok: false, error: "전화번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const product = getProductInfo(productNameRaw);

    const unitPrice = Number(body.unit_price_krw || product.unit_price_krw);
    const shippingFee = Number(
      body.shipping_fee_krw ?? product.shipping_fee_krw
    );
    const totalAmount = unitPrice * quantity + shippingFee;

    const now = new Date().toISOString();
    const supabase = createSupabaseAdminClient();

    const { data: order, error } = await supabase
      .from("photodoctor_orders")
      .insert({
        order_code: makeOrderCode(),

        farmer_name: farmerName,
        farmer_phone: farmerPhone,

        receiver_name: receiverName,
        receiver_phone: receiverPhone,

        zipcode: zipcode || null,
        address1: address1 || null,
        address2: address2 || null,
        email: email || null,

        product_name: product.product_name,
        crop_name: cropName || null,
        issue_type: issueType || null,
        area_text: areaText || null,
        diagnosis_id: diagnosisId || null,

        quantity,
        unit_price_krw: unitPrice,
        shipping_fee_krw: shippingFee,
        total_amount_krw: totalAmount,

        payment_method: paymentMethod,
        payment_status: "waiting_deposit",
        deposit_bank: depositBank || null,
        deposit_name: depositName || null,
        order_status: "pending",

        order_source_type: orderSourceType,
        source_type: sourceType || null,
        source_video: sourceVideo || null,

        memo:
          memo ||
          [
            "포토닥터 바로구매 주문",
            orderSourceType ? `주문유형: ${orderSourceType}` : "",
            sourceType ? `유입: ${sourceType}` : "",
            sourceVideo ? `영상: ${sourceVideo}` : "",
            diagnosisId ? `진단ID: ${diagnosisId}` : "",
          ]
            .filter(Boolean)
            .join("\n"),

        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    await supabase.from("farmers").upsert(
      {
        name: farmerName,
        phone: farmerPhone,

        main_crop: cropName || null,
        last_crop: cropName || null,
        last_issue: issueType || null,
        last_product_interest: product.product_name,
        last_order_area_text: areaText || null,

        source: sourceType,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: "phone" }
    );

    const { error: orderCountError } = await supabase.rpc(
      "increment_farmer_order",
      {
        target_phone: farmerPhone,
        amount: totalAmount,
      }
    );

    if (orderCountError) {
      console.error("increment_farmer_order error:", orderCountError);
    }

    const { error: vipError } = await supabase.rpc("refresh_farmer_vip", {
      target_phone: farmerPhone,
    });

    if (vipError) {
      console.error("refresh_farmer_vip error:", vipError);
    }

    await fetch(new URL("/api/send-sms", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: farmerPhone,
        message: `[한국농수산TV 포토닥터]
${farmerName}님 주문 안내입니다.

제품: ${product.product_name}
수량: ${quantity}병
입금액: ${totalAmount.toLocaleString()}원

입금계좌:
${depositBank || "466-072683-040-11 한국농수산TV"}

입금 후 배송받을 주소만 답장으로 보내주세요.`,
      }),
    }).catch((smsError) => {
      console.error("send sms mock error:", smsError);
    });

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
            : "주문 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}