import { createSupabaseServerClient } from "@/lib/supabase/server";

type BoothRef = {
  booth_id: string;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
};

type VendorRef = {
  vendor_id?: string | null;
  user_id?: string | null;
};

function safeString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeNullableText(v: unknown) {
  const value = safeString(v);
  return value;
}

async function getCurrentVendor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<{ vendor: VendorRef | null; error: string | null }> {
  const vendorRes = await supabase
    .from("vendors")
    .select("vendor_id,user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (vendorRes.error) {
    console.error("[my-booth] vendorRes.error =", vendorRes.error);
    return {
      vendor: null,
      error: vendorRes.error.message || "vendor 조회 중 오류가 발생했습니다.",
    };
  }

  const vendor = (vendorRes.data?.[0] ?? null) as VendorRef | null;

  if (!vendor?.vendor_id) {
    return {
      vendor: null,
      error: "vendor가 없습니다.",
    };
  }

  return {
    vendor,
    error: null,
  };
}

async function getOwnedBooth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  vendorId: string,
  requestedBoothId: string
): Promise<{ booth: BoothRef | null; error: string | null; status: number }> {
  if (requestedBoothId) {
    const boothByIdRes = await supabase
      .from("booths")
      .select("booth_id,vendor_id,vendor_user_id")
      .eq("booth_id", requestedBoothId)
      .limit(1);

    if (boothByIdRes.error) {
      console.error("[my-booth] boothByIdRes.error =", boothByIdRes.error);
      return {
        booth: null,
        error: boothByIdRes.error.message || "부스 조회 중 오류가 발생했습니다.",
        status: 400,
      };
    }

    const boothById = (boothByIdRes.data?.[0] ?? null) as BoothRef | null;

    if (!boothById?.booth_id) {
      return {
        booth: null,
        error: "요청한 부스를 찾을 수 없습니다.",
        status: 404,
      };
    }

    const ownedByVendorId = boothById.vendor_id === vendorId;
    const ownedByUserId = boothById.vendor_user_id === userId;

    if (!ownedByVendorId && !ownedByUserId) {
      return {
        booth: null,
        error: "이 부스를 수정할 권한이 없습니다.",
        status: 403,
      };
    }

    return {
      booth: boothById,
      error: null,
      status: 200,
    };
  }

  const boothByVendorRes = await supabase
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (boothByVendorRes.error) {
    console.error("[my-booth] boothByVendorRes.error =", boothByVendorRes.error);
    return {
      booth: null,
      error: boothByVendorRes.error.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const boothByVendor = (boothByVendorRes.data?.[0] ?? null) as BoothRef | null;
  if (boothByVendor?.booth_id) {
    return {
      booth: boothByVendor,
      error: null,
      status: 200,
    };
  }

  const boothByUserRes = await supabase
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .eq("vendor_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (boothByUserRes.error) {
    console.error("[my-booth] boothByUserRes.error =", boothByUserRes.error);
    return {
      booth: null,
      error: boothByUserRes.error.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const boothByUser = (boothByUserRes.data?.[0] ?? null) as BoothRef | null;
  if (boothByUser?.booth_id) {
    return {
      booth: boothByUser,
      error: null,
      status: 200,
    };
  }

  return {
    booth: null,
    error: "부스를 찾을 수 없습니다.",
    status: 404,
  };
}

async function assertVendorRole(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const roleRes = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleRes.error) {
    console.error("[my-booth] roleRes.error =", roleRes.error);
    return {
      ok: false,
      error: roleRes.error.message || "권한 확인 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const hasVendorRole = Array.isArray(roleRes.data)
    ? roleRes.data.some((row) => row.role === "vendor")
    : false;

  if (!hasVendorRole) {
    return {
      ok: false,
      error: "vendor 권한이 없습니다.",
      status: 403,
    };
  }

  return {
    ok: true,
    error: null,
    status: 200,
  };
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

    const roleCheck = await assertVendorRole(supabase, user.id);
    if (!roleCheck.ok) {
      return Response.json(
        { ok: false, error: roleCheck.error || "권한이 없습니다." },
        { status: roleCheck.status }
      );
    }

    const { vendor, error: vendorError } = await getCurrentVendor(supabase, user.id);
    if (vendorError || !vendor?.vendor_id) {
      return Response.json(
        { ok: false, error: vendorError || "vendor가 없습니다." },
        { status: vendorError === "vendor가 없습니다." ? 404 : 400 }
      );
    }

    let body: Record<string, unknown> = {};

    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch (jsonError) {
      console.error("[my-booth] invalid json body =", jsonError);
      return Response.json(
        { ok: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const requestedBoothId = safeString(body?.booth_id);

    const boothResult = await getOwnedBooth(
      supabase,
      user.id,
      vendor.vendor_id,
      requestedBoothId
    );

    if (boothResult.error || !boothResult.booth?.booth_id) {
      return Response.json(
        { ok: false, error: boothResult.error || "부스를 찾을 수 없습니다." },
        { status: boothResult.status || 404 }
      );
    }

    const targetBooth = boothResult.booth;

    const patch = {
      name: normalizeNullableText(body?.name),
      region: normalizeNullableText(body?.region),
      category_primary: normalizeNullableText(body?.category_primary),
      intro: normalizeNullableText(body?.intro),
      description: normalizeNullableText(body?.description),
      phone: normalizeNullableText(body?.phone),
      email: normalizeNullableText(body?.email),
      hall_id: normalizeNullableText(body?.hall_id),

      banner_url: normalizeNullableText(body?.banner_url),
      cover_image_url: normalizeNullableText(body?.cover_image_url),
      thumbnail_url: normalizeNullableText(body?.thumbnail_url),
      logo_url: normalizeNullableText(body?.logo_url),

      updated_at: new Date().toISOString(),
    };

    console.log("[my-booth] user.id =", user.id);
    console.log("[my-booth] vendor.vendor_id =", vendor.vendor_id);
    console.log("[my-booth] requestedBoothId =", requestedBoothId);
    console.log("[my-booth] targetBooth =", targetBooth);
    console.log("[my-booth] patch =", patch);

    const updateRes = await supabase
      .from("booths")
      .update(patch)
      .eq("booth_id", targetBooth.booth_id);

    if (updateRes.error) {
      console.error("[my-booth] updateRes.error =", updateRes.error);
      return Response.json(
        { ok: false, error: updateRes.error.message || "부스 저장에 실패했습니다." },
        { status: 400 }
      );
    }

    const refetchRes = await supabase
      .from("booths")
      .select("*")
      .eq("booth_id", targetBooth.booth_id)
      .limit(1);

    if (refetchRes.error) {
      console.error("[my-booth] refetchRes.error =", refetchRes.error);
      return Response.json({
        ok: true,
        booth_id: targetBooth.booth_id,
      });
    }

    const updated = refetchRes.data?.[0] ?? null;

    return Response.json({
      ok: true,
      booth: updated,
      booth_id: targetBooth.booth_id,
    });
  } catch (e: any) {
    console.error("[my-booth] unexpected error =", e);

    return Response.json(
      { ok: false, error: e?.message || "부스 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}