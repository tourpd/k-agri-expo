import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function clean(v: unknown) {

  return String(v || "").trim();

}

export async function POST(req: Request) {

  const supabase = createSupabaseAdminClient();

  const body = await req.json();

  const token = clean(body.token);

  if (!token) {

    return NextResponse.json({ ok: false, error: "token이 없습니다." }, { status: 400 });

  }

  if (!body.privacy_agreed) {

    return NextResponse.json({ ok: false, error: "개인정보 제공 동의가 필요합니다." }, { status: 400 });

  }

  const patch = {

    receiver_name: clean(body.receiver_name),

    receiver_phone: clean(body.receiver_phone),

    zipcode: clean(body.zipcode),

    address1: clean(body.address1),

    address2: clean(body.address2),

    delivery_memo: clean(body.delivery_memo),

    privacy_agreed: true,

    shipping_status: "address_submitted",

    address_submitted_at: new Date().toISOString(),

  };

  const { data, error } = await supabase

    .from("live_winners")

    .update(patch)

    .eq("address_token", token)

    .select("*")

    .single();

  if (error) {

    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  }

  return NextResponse.json({ ok: true, winner: data });

}