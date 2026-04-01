import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("*")
      .eq("email", user.email ?? "")
      .maybeSingle();

    if (!admin) {
      return Response.json(
        { ok: false, error: "관리자 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const applicationId = String(body?.application_id || "").trim();

    if (!applicationId) {
      return Response.json(
        { ok: false, error: "application_id required" },
        { status: 400 }
      );
    }

    const { data: app, error: appError } = await supabase
      .from("vendor_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      return Response.json(
        { ok: false, error: appError?.message || "신청서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: existingVendor } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", app.user_id)
      .maybeSingle();

    let vendor = existingVendor;

    if (!existingVendor) {
      const { data: createdVendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          user_id: app.user_id,
          email: app.email,
          company_name: app.company_name,
        })
        .select("*")
        .single();

      if (vendorError) {
        return Response.json(
          { ok: false, error: vendorError.message },
          { status: 400 }
        );
      }

      vendor = createdVendor;
    }

    const { data: existingBooth } = await supabase
      .from("booths")
      .select("*")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    let booth = existingBooth;

    if (!existingBooth) {
      const { data: createdBooth, error: boothError } = await supabase
        .from("booths")
        .insert({
          vendor_id: vendor.id,
          name: app.company_name,
          intro: `${app.company_name} 부스입니다.`,
          description: `${app.company_name} 입점 부스`,
          is_public: true,
        })
        .select("*")
        .single();

      if (boothError) {
        return Response.json(
          { ok: false, error: boothError.message },
          { status: 400 }
        );
      }

      booth = createdBooth;
    }

    const { error: updateAppError } = await supabase
      .from("vendor_applications")
      .update({
        review_status: "approved",
        reject_reason: null,
        vendor_id: vendor.id,
        booth_id: booth.booth_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateAppError) {
      return Response.json(
        { ok: false, error: updateAppError.message },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      vendor,
      booth,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "승인 처리 오류" },
      { status: 500 }
    );
  }
}