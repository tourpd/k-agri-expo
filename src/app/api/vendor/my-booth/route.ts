import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

async function getAuthedVendor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      status: 401,
      error: "업체 로그인이 필요합니다.",
    };
  }

  const userId = user.id;
  const email = (user.email || "").trim();

  let vendor: any = null;

  const { data: byUserId, error: byUserIdError } = await adminSupabase
    .from("vendors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserIdError) {
    return {
      ok: false as const,
      status: 500,
      error: byUserIdError.message,
    };
  }

  vendor = byUserId || null;

  if (!vendor && email) {
    const { data: byEmail, error: byEmailError } = await adminSupabase
      .from("vendors")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (byEmailError) {
      return {
        ok: false as const,
        status: 500,
        error: byEmailError.message,
      };
    }

    vendor = byEmail || null;
  }

  if (!vendor) {
    return {
      ok: false as const,
      status: 403,
      error: "인증된 업체 계정을 찾을 수 없습니다. 관리자 승인 후 다시 시도해 주세요.",
    };
  }

  return {
    ok: true as const,
    user,
    vendor,
  };
}

export async function GET() {
  try {
    const vendorResult = await getAuthedVendor();

    if (!vendorResult.ok) {
      return NextResponse.json(
        { success: false, error: vendorResult.error },
        { status: vendorResult.status }
      );
    }

    const { vendor } = vendorResult;

    const { data: booth, error: boothError } = await adminSupabase
      .from("booths")
      .select("*")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (boothError) {
      return NextResponse.json(
        { success: false, error: boothError.message },
        { status: 500 }
      );
    }

    if (!booth) {
      return NextResponse.json(
        {
          success: false,
          error: "연결된 부스를 찾을 수 없습니다. 관리자에게 문의해 주세요.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
      booth,
      verified: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "내 부스 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const vendorResult = await getAuthedVendor();

    if (!vendorResult.ok) {
      return NextResponse.json(
        { success: false, error: vendorResult.error },
        { status: vendorResult.status }
      );
    }

    const { vendor } = vendorResult;
    const body = await req.json();

    const updateData: Record<string, any> = {};

    if (typeof body.name === "string") updateData.name = clean(body.name);
    if (typeof body.intro === "string") updateData.intro = clean(body.intro);
    if (typeof body.description === "string") {
      updateData.description = clean(body.description);
    }
    if (typeof body.website_url === "string") {
      updateData.website_url = clean(body.website_url) || null;
    }
    if (typeof body.youtube_url === "string") {
      updateData.youtube_url = clean(body.youtube_url) || null;
    }
    if (typeof body.hero_image_url === "string") {
      updateData.hero_image_url = clean(body.hero_image_url) || null;
    }
    if (typeof body.logo_url === "string") {
      updateData.logo_url = clean(body.logo_url) || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "수정할 데이터가 없습니다." },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: booth, error: boothError } = await adminSupabase
      .from("booths")
      .update(updateData)
      .eq("vendor_id", vendor.id)
      .select("*")
      .single();

    if (boothError) {
      return NextResponse.json(
        { success: false, error: boothError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booth,
      verified: true,
      message: "내 부스 정보가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "내 부스 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}