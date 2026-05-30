import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createSupabaseAdminClient();
  const body = await req.json();

  const winnerId = String(body.winner_id || "").trim();

  if (!winnerId) {
    return NextResponse.json({ ok: false, error: "winner_id가 없습니다." }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString("hex");

  const { data, error } = await supabase
    .from("live_winners")
    .update({
      address_token: token,
      shipping_status: "need_address",
    })
    .eq("id", winnerId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const addressUrl = `${baseUrl}/live/winner/${token}`;

  const smsText = `[K-Agri Expo] 경품 당첨을 축하드립니다.
경품: ${data.prize_title || "라이브 경품"}
아래 링크에서 배송정보를 입력해주세요.
${addressUrl}`;

  return NextResponse.json({
    ok: true,
    winner: data,
    address_url: addressUrl,
    sms_text: smsText,
  });
}