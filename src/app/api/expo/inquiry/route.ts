import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const boothId = String(body?.booth_id || "").trim();
    const farmerName = String(body?.farmer_name || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();

    if (!boothId || !message) {
      return Response.json(
        { ok: false, error: "booth_id와 message는 필수입니다." },
        { status: 400 }
      );
    }

    const { data: booth, error: boothError } = await supabase
      .from("booths")
      .select("booth_id, vendor_id")
      .eq("booth_id", boothId)
      .maybeSingle();

    if (boothError || !booth) {
      return Response.json(
        { ok: false, error: boothError?.message || "부스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, user_id")
      .eq("id", booth.vendor_id)
      .maybeSingle();

    if (vendorError || !vendor) {
      return Response.json(
        { ok: false, error: vendorError?.message || "업체 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("expo_inquiries")
      .insert({
        booth_id: booth.booth_id,
        vendor_user_id: vendor.user_id,
        farmer_name: farmerName || null,
        phone: phone || null,
        email: email || null,
        message,
        status: "new",
      })
      .select("*")
      .single();

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      inquiry: data,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "상담 요청 저장 오류" },
      { status: 500 }
    );
  }
}