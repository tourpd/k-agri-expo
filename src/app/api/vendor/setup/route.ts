import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const boothId = String(formData.get("booth_id") ?? "").trim();
    const boothType = String(formData.get("booth_type") ?? "").trim();

    if (!boothId) {
      return NextResponse.json({ error: "booth_id가 없습니다." }, { status: 400 });
    }

    if (!["product", "brand", "promo"].includes(boothType)) {
      return NextResponse.json({ error: "booth_type 값이 잘못되었습니다." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const admin = createSupabaseAdminClient();

    const { data: booth, error: readError } = await admin
      .from("booths")
      .select("booth_id, owner_user_id, vendor_id")
      .eq("booth_id", boothId)
      .maybeSingle();

    if (readError || !booth) {
      return NextResponse.json({ error: "부스를 찾을 수 없습니다." }, { status: 404 });
    }

    let authorized = booth.owner_user_id === user.id;

    if (!authorized && booth.vendor_id) {
      const vendor = await admin
        .from("vendors")
        .select("vendor_id")
        .eq("vendor_id", booth.vendor_id)
        .eq("user_id", user.id)
        .maybeSingle();

      authorized = !!vendor.data;
    }

    if (!authorized) {
      return NextResponse.json({ error: "이 부스를 수정할 권한이 없습니다." }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("booths")
      .update({ booth_type: boothType })
      .eq("booth_id", boothId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.redirect(
      new URL(`/expo/vendor/booth-editor?booth_id=${encodeURIComponent(boothId)}`, req.url)
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}