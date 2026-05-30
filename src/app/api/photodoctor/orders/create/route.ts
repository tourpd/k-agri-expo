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

  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  if (d.length === 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }

  return v.trim();
}

function makeOrderCode() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `PDO-${ymd}-${rand}`;
}

function getCommissionRate(productName: string) {
  if (productName.includes("멸규니")) return 0.3;
  if (productName.includes("싹쓰리충")) return 0.25;
  if (productName.includes("총나와")) return 0.2;
  if (productName.includes("달아웃")) return 0.2;

  return 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const now = new Date().toISOString();
    const orderCode = makeOrderCode();

    const productName = safe(body.product_name || body.product);

    const farmerName = safe(
      body.farmer_name || body.buyer_name || body.name
    );

    const farmerPhoneRaw = safe(
      body.farmer_phone || body.buyer_phone || body.phone
    );

    const farmerPhone = formatPhone(farmerPhoneRaw);

    const receiverName = safe(body.receiver_name) || farmerName;

    const receiverPhoneRaw =
      safe(body.receiver_phone) || farmerPhoneRaw;

    const receiverPhone = formatPhone(receiverPhoneRaw);

    const cropName = safe(body.crop_name || body.crop);
    const issueType = safe(body.issue_type || body.issue || body.diagnosis);
    const diagnosisId = safe(body.diagnosis_id);

    const zipcode = safe(body.zipcode);
    const address1 = safe(body.address1 || body.address);
    const address2 = safe(body.address2 || body.address_detail);

    const areaText = safe(body.area_text);
    const areaPyeong = Math.max(0, Number(body.area_pyeong || 0));

    const quantity = Math.max(1, Number(body.quantity || 1));
    const unitPrice = Math.max(
      0,
      Number(body.unit_price_krw || body.unit_price || 0)
    );

    const shippingFee = Math.max(
      0,
      Number(body.shipping_fee_krw || body.shipping_fee || 3000)
    );

    const totalAmount =
      Number(body.total_amount_krw || body.total_amount || 0) ||
      unitPrice * quantity + shippingFee;

    const memo = safe(body.memo);
    const sourceType = safe(body.source_type || body.source) || "photodoctor";
    const sourceVideo = safe(body.source_video || body.video);

    const paymentMethod = safe(body.payment_method) || "bank_transfer";
    const depositBank =
      safe(body.deposit_bank) || "기업은행 486-072683-04-011";
    const depositName = safe(body.deposit_name) || farmerName;

    if (!productName) {
      return NextResponse.json(
        { ok: false, error: "제품명이 없습니다." },
        { status: 400 }
      );
    }

    if (!farmerName) {
      return NextResponse.json(
        { ok: false, error: "주문자 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (onlyDigits(farmerPhoneRaw).length < 10) {
      return NextResponse.json(
        { ok: false, error: "주문자 전화번호를 정확히 입력해주세요." },
        { status: 400 }
      );
    }

    if (!address1) {
      return NextResponse.json(
        { ok: false, error: "주소를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!address2) {
      return NextResponse.json(
        { ok: false, error: "상세주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const orderSourceType =
      sourceType === "youtube"
        ? "youtube_order"
        : sourceType === "photodoctor_consult"
          ? "converted_consult"
          : "photodoctor_order";

    const payload = {
      order_code: orderCode,

      order_source_type: orderSourceType,
      source_type: sourceType,
      source_video: sourceVideo || null,

      farmer_name: farmerName,
      farmer_phone: farmerPhone,

      receiver_name: receiverName,
      receiver_phone: receiverPhone,

      zipcode: zipcode || null,
      address1,
      address2,
      email: safe(body.email) || null,

      crop_name: cropName || null,
      issue_type: issueType || null,
      diagnosis_id: diagnosisId || null,

      product_name: productName,
      unit_price_krw: unitPrice,
      quantity,
      shipping_fee_krw: shippingFee,
      total_amount_krw: totalAmount,

      area_text: areaText || null,
      area_pyeong: areaPyeong || null,

      vendor_target: "dof",
      commission_rate: getCommissionRate(productName),

      order_status: "pending",
      payment_status:
        paymentMethod === "bank_transfer"
          ? "waiting_deposit"
          : "waiting_payment",
      shipping_status: "shipping_ready",

      payment_method: paymentMethod,
      deposit_bank: depositBank,
      deposit_name: depositName,

      memo:
        memo ||
        [
          "포토닥터 바로구매 주문",
          sourceType ? `유입: ${sourceType}` : "",
          cropName ? `작물: ${cropName}` : "",
          issueType ? `진단/증상: ${issueType}` : "",
          diagnosisId ? `진단ID: ${diagnosisId}` : "",
          areaText ? `면적: ${areaText}` : "",
          sourceVideo ? `영상: ${sourceVideo}` : "",
        ]
          .filter(Boolean)
          .join("\n"),

      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("photodoctor_orders insert error:", error);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          detail: error,
        },
        { status: 500 }
      );
    }

    try {
      const { error: farmerError } = await supabase.from("farmers").upsert(
        {
          name: farmerName,
          phone: farmerPhone,
          main_crop: cropName || null,
          last_crop: cropName || null,
          last_issue: issueType || null,
          last_product_interest: productName,
          last_order_area_text: areaText || null,
          source: sourceType,
          last_seen_at: now,
          updated_at: now,
        },
        { onConflict: "phone" }
      );

      if (farmerError) {
        console.error("farmers upsert error:", farmerError);
      }
    } catch (farmerError) {
      console.error("farmers upsert exception:", farmerError);
    }

    try {
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
    } catch (orderCountError) {
      console.error("increment_farmer_order exception:", orderCountError);
    }

    try {
      const { error: vipError } = await supabase.rpc("refresh_farmer_vip", {
        target_phone: farmerPhone,
      });

      if (vipError) {
        console.error("refresh_farmer_vip error:", vipError);
      }
    } catch (vipError) {
      console.error("refresh_farmer_vip exception:", vipError);
    }

    try {
      if (paymentMethod === "bank_transfer") {
        await fetch(new URL("/api/send-sms", req.url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: farmerPhone,
            message: `[한국농수산TV 포토닥터]
${farmerName}님 주문이 접수되었습니다.

주문번호: ${orderCode}
제품: ${productName}
수량: ${quantity}
입금액: ${totalAmount.toLocaleString()}원

입금계좌:
기업은행 486-072683-04-011
예금주: 한국농수산TV

입금 확인 후 발송 안내드리겠습니다.`,
          }),
        });
      }
    } catch (smsError) {
      console.error("send sms error:", smsError);
    }

    return NextResponse.json({
      ok: true,
      order: data,
    });
  } catch (error) {
    console.error("photodoctor order create error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "주문 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}