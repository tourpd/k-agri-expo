import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const {
      farmer_name,
      farmer_phone,
      product_name,
      quantity,
      source,
      video,
    } = body;

    const unit_price = 29300; // 👉 제품별로 나중에 분리 가능

    const { error } = await supabase.from("photodoctor_orders").insert({
      farmer_name,
      farmer_phone,
      product_name,
      quantity,
      unit_price_krw: unit_price,
      total_amount_krw: unit_price * quantity,
      payment_status: "waiting_deposit",
      order_status: "pending",
      memo: `유입:${source} / 영상:${video}`,
    });

    if (error) throw error;

    // 👉 문자 자동 발송
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: farmer_phone,
        message: `[한국농수산TV 포토닥터]
${farmer_name}님 주문 안내입니다.

제품: ${product_name}
수량: ${quantity}병
입금액: ${(unit_price * quantity).toLocaleString()}원

입금계좌:
466-072683-040-11 한국농수산TV

입금 후 주소만 답장 주세요.`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "주문 실패" });
  }
}