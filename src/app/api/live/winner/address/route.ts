import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

function normalizePhone(v: unknown) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return clean(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const winnerId = clean(body.winner_id);
    const shippingName = clean(body.shipping_name);
    const shippingPhone = normalizePhone(body.shipping_phone);
    const shippingZipcode = clean(body.shipping_zipcode);
    const shippingAddress1 = clean(body.shipping_address1);
    const shippingAddress2 = clean(body.shipping_address2);
    const shippingMemo = clean(body.shipping_memo);
    const privacyAgreed = body.privacy_agreed === true;

    if (!winnerId) {
      return NextResponse.json(
        { ok: false, error: "당첨자 ID가 없습니다." },
        { status: 400 }
      );
    }

    if (!shippingName) {
      return NextResponse.json(
        { ok: false, error: "받는 사람 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!shippingPhone) {
      return NextResponse.json(
        { ok: false, error: "연락처를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!shippingAddress1) {
      return NextResponse.json(
        { ok: false, error: "주소를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!shippingAddress2) {
      return NextResponse.json(
        { ok: false, error: "상세주소를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!privacyAgreed) {
      return NextResponse.json(
        { ok: false, error: "개인정보 제공 동의가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: winner, error: findError } = await supabase
      .from("live_winners")
      .select("id")
      .eq("id", winnerId)
      .single();

    if (findError || !winner) {
      return NextResponse.json(
        { ok: false, error: "당첨자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("live_winners")
      .update({
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_zipcode: shippingZipcode,
        shipping_address1: shippingAddress1,
        shipping_address2: shippingAddress2,
        shipping_memo: shippingMemo,
        privacy_agreed: true,
        shipping_status: "address_submitted",
        address_submitted_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      winner: data,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "server error",
      },
      { status: 500 }
    );
  }
}