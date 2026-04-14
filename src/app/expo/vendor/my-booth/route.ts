import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      return Response.json(
        { ok: false, error: rolesError.message || "권한 확인 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    const isVendor = Array.isArray(roles)
      ? roles.some((row) => row.role === "vendor")
      : false;

    if (!isVendor) {
      return Response.json(
        { ok: false, error: "vendor 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_id,user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorError) {
      return Response.json(
        { ok: false, error: vendorError.message || "vendor 조회 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    if (!vendor?.vendor_id) {
      return Response.json(
        { ok: false, error: "vendor가 없습니다." },
        { status: 404 }
      );
    }

    const { data: booth, error: boothError } = await supabase
      .from("booths")
      .select("booth_id,vendor_id,vendor_user_id")
      .eq("vendor_id", vendor.vendor_id)
      .maybeSingle();

    if (boothError) {
      return Response.json(
        { ok: false, error: boothError.message || "부스 조회 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    if (!booth?.booth_id) {
      return Response.json(
        { ok: false, error: "부스가 없습니다." },
        { status: 404 }
      );
    }

    const body = await req.json();

    const patch = {
      name: normalizeText(body?.name),
      region: normalizeText(body?.region),
      category_primary: normalizeText(body?.category_primary),
      intro: normalizeText(body?.intro),
      description: normalizeText(body?.description),
      phone: normalizeText(body?.phone),
      email: normalizeText(body?.email),
      hall_id: normalizeText(body?.hall_id),
    };

    const { data: updated, error: updateError } = await supabase
      .from("booths")
      .update(patch)
      .eq("booth_id", booth.booth_id)
      .eq("vendor_id", vendor.vendor_id)
      .select("*")
      .single();

    if (updateError) {
      return Response.json(
        { ok: false, error: updateError.message || "부스 저장에 실패했습니다." },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      booth: updated,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "부스 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}