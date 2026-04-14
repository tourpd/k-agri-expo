import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const booth_id = String(body.booth_id ?? "").trim();
    const vendor_id = String(body.vendor_id ?? "").trim() || null;
    const user_name = String(body.user_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const region = String(body.region ?? "").trim() || null;
    const crop = String(body.crop ?? "").trim() || null;
    const message = String(body.message ?? "").trim() || null;

    if (!booth_id) {
      return NextResponse.json({ error: "booth_id가 없습니다." }, { status: 400 });
    }

    if (!user_name) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: "연락처를 입력해 주세요." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("expo_inquiries").insert({
      booth_id,
      vendor_user_id: vendor_id,
      farmer_name: user_name,
      phone,
      region,
      crop,
      message,
      contact_channel: "form",
      status: "new",
    });

    if (error) {
      console.error("[api/expo/inquiries] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/expo/inquiries] unexpected error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}