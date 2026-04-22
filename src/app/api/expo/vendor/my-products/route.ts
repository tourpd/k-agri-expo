import { createSupabaseServerClient } from "@/lib/supabase/server";

type OwnedBoothResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  boothId: string | null;
  error: string | null;
  status: number;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalUrl(value: unknown) {
  const text = normalizeText(value);
  return text || "";
}

function normalizeSortOrder(value: unknown, fallback = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < 1) return 1;
  return Math.floor(num);
}

async function getOwnedBoothId(
  requestedBoothId?: string
): Promise<OwnedBoothResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      boothId: null,
      error: "로그인이 필요합니다.",
      status: 401,
    };
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    return {
      supabase,
      boothId: null,
      error: roleError.message || "권한 확인 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const isVendor = Array.isArray(roleRows)
    ? roleRows.some((row) => row.role === "vendor")
    : false;

  if (!isVendor) {
    return {
      supabase,
      boothId: null,
      error: "vendor 권한이 없습니다.",
      status: 403,
    };
  }

  const vendorRes = await supabase
    .from("vendors")
    .select("vendor_id,user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (vendorRes.error) {
    return {
      supabase,
      boothId: null,
      error: vendorRes.error.message || "vendor 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const vendor = vendorRes.data?.[0] ?? null;

  if (!vendor?.vendor_id) {
    return {
      supabase,
      boothId: null,
      error: "vendor가 없습니다.",
      status: 404,
    };
  }

  if (requestedBoothId) {
    const boothByIdRes = await supabase
      .from("booths")
      .select("booth_id,vendor_id,vendor_user_id")
      .eq("booth_id", requestedBoothId)
      .limit(1);

    if (boothByIdRes.error) {
      return {
        supabase,
        boothId: null,
        error: boothByIdRes.error.message || "부스 조회 중 오류가 발생했습니다.",
        status: 400,
      };
    }

    const boothById = boothByIdRes.data?.[0] ?? null;

    if (!boothById?.booth_id) {
      return {
        supabase,
        boothId: null,
        error: "요청한 부스를 찾을 수 없습니다.",
        status: 404,
      };
    }

    const ownedByVendorId = boothById.vendor_id === vendor.vendor_id;
    const ownedByUserId = boothById.vendor_user_id === user.id;

    if (!ownedByVendorId && !ownedByUserId) {
      return {
        supabase,
        boothId: null,
        error: "이 부스를 수정할 권한이 없습니다.",
        status: 403,
      };
    }

    return {
      supabase,
      boothId: boothById.booth_id,
      error: null,
      status: 200,
    };
  }

  const boothByVendorRes = await supabase
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .eq("vendor_id", vendor.vendor_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (boothByVendorRes.error) {
    return {
      supabase,
      boothId: null,
      error: boothByVendorRes.error.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const boothByVendor = boothByVendorRes.data?.[0] ?? null;
  if (boothByVendor?.booth_id) {
    return {
      supabase,
      boothId: boothByVendor.booth_id,
      error: null,
      status: 200,
    };
  }

  const boothByUserRes = await supabase
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .eq("vendor_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (boothByUserRes.error) {
    return {
      supabase,
      boothId: null,
      error: boothByUserRes.error.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const boothByUser = boothByUserRes.data?.[0] ?? null;
  if (boothByUser?.booth_id) {
    return {
      supabase,
      boothId: boothByUser.booth_id,
      error: null,
      status: 200,
    };
  }

  return {
    supabase,
    boothId: null,
    error: "부스를 찾을 수 없습니다.",
    status: 404,
  };
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};

    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return Response.json(
        { ok: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const requestedBoothId = normalizeText(body?.booth_id);

    const { supabase, boothId, error, status } = await getOwnedBoothId(
      requestedBoothId || undefined
    );

    if (error || !boothId) {
      return Response.json(
        { ok: false, error: error || "권한이 없습니다." },
        { status }
      );
    }

    const productId =
      typeof body?.product_id === "string" ? body.product_id.trim() : "";

    const name = normalizeText(body?.name);
    const description = normalizeText(body?.description);
    const priceText = normalizeText(body?.price_text);
    const sortOrder = normalizeSortOrder(body?.sort_order, 1);
    const isActive = body?.is_active !== false;

    const imageUrl = normalizeOptionalUrl(body?.image_url);
    const imageFileUrl = normalizeOptionalUrl(body?.image_file_url);
    const youtubeUrl = normalizeOptionalUrl(body?.youtube_url);
    const catalogUrl = normalizeOptionalUrl(body?.catalog_url);
    const catalogFileUrl = normalizeOptionalUrl(body?.catalog_file_url);
    const catalogFilename = normalizeText(body?.catalog_filename);

    const headlineText = normalizeText(body?.headline_text);
    const urgencyText = normalizeText(body?.urgency_text);
    const ctaText = normalizeText(body?.cta_text);
    const point1 = normalizeText(body?.point_1);
    const point2 = normalizeText(body?.point_2);
    const point3 = normalizeText(body?.point_3);

    if (!name) {
      return Response.json(
        { ok: false, error: "제품명은 필수입니다." },
        { status: 400 }
      );
    }

    const updatePayload = {
      name,
      description,
      price_text: priceText,
      sort_order: sortOrder,
      is_active: isActive,

      image_url: imageUrl,
      image_file_url: imageFileUrl,

      youtube_url: youtubeUrl,

      catalog_url: catalogUrl,
      catalog_file_url: catalogFileUrl,
      catalog_filename: catalogFilename,

      headline_text: headlineText,
      urgency_text: urgencyText,
      cta_text: ctaText,
      point_1: point1,
      point_2: point2,
      point_3: point3,
    };

    if (productId) {
      const { data: ownedRows, error: ownedError } = await supabase
        .from("products")
        .select("product_id,booth_id")
        .eq("product_id", productId)
        .eq("booth_id", boothId)
        .limit(1);

      if (ownedError) {
        return Response.json(
          {
            ok: false,
            error: ownedError.message || "제품 확인 중 오류가 발생했습니다.",
          },
          { status: 400 }
        );
      }

      const owned = ownedRows?.[0] ?? null;

      if (!owned) {
        return Response.json(
          { ok: false, error: "내 제품이 아닙니다." },
          { status: 403 }
        );
      }

      const updateRes = await supabase
        .from("products")
        .update(updatePayload)
        .eq("product_id", productId)
        .eq("booth_id", boothId);

      if (updateRes.error) {
        return Response.json(
          {
            ok: false,
            error: updateRes.error.message || "제품 수정에 실패했습니다.",
          },
          { status: 400 }
        );
      }

      const refetchRes = await supabase
        .from("products")
        .select("*")
        .eq("product_id", productId)
        .eq("booth_id", boothId)
        .limit(1);

      if (refetchRes.error) {
        return Response.json({
          ok: true,
          mode: "updated",
          product_id: productId,
        });
      }

      return Response.json({
        ok: true,
        mode: "updated",
        product: refetchRes.data?.[0] ?? null,
      });
    }

    const insertPayload = {
      booth_id: boothId,
      ...updatePayload,
    };

    const insertRes = await supabase
      .from("products")
      .insert(insertPayload);

    if (insertRes.error) {
      return Response.json(
        {
          ok: false,
          error: insertRes.error.message || "제품 생성에 실패했습니다.",
        },
        { status: 400 }
      );
    }

    const refetchCreatedRes = await supabase
      .from("products")
      .select("*")
      .eq("booth_id", boothId)
      .eq("name", name)
      .order("created_at", { ascending: false })
      .limit(1);

    if (refetchCreatedRes.error) {
      return Response.json({
        ok: true,
        mode: "created",
      });
    }

    return Response.json({
      ok: true,
      mode: "created",
      product: refetchCreatedRes.data?.[0] ?? null,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    let body: Record<string, unknown> = {};

    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return Response.json(
        { ok: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const requestedBoothId = normalizeText(body?.booth_id);

    const { supabase, boothId, error, status } = await getOwnedBoothId(
      requestedBoothId || undefined
    );

    if (error || !boothId) {
      return Response.json(
        { ok: false, error: error || "권한이 없습니다." },
        { status }
      );
    }

    const productId =
      typeof body?.product_id === "string" ? body.product_id.trim() : "";

    if (!productId) {
      return Response.json(
        { ok: false, error: "product_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: ownedRows, error: ownedError } = await supabase
      .from("products")
      .select("product_id,booth_id")
      .eq("product_id", productId)
      .eq("booth_id", boothId)
      .limit(1);

    if (ownedError) {
      return Response.json(
        {
          ok: false,
          error: ownedError.message || "제품 확인 중 오류가 발생했습니다.",
        },
        { status: 400 }
      );
    }

    const owned = ownedRows?.[0] ?? null;

    if (!owned) {
      return Response.json(
        { ok: false, error: "내 제품이 아닙니다." },
        { status: 403 }
      );
    }

    const deleteRes = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId)
      .eq("booth_id", boothId);

    if (deleteRes.error) {
      return Response.json(
        {
          ok: false,
          error: deleteRes.error.message || "제품 삭제에 실패했습니다.",
        },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      deleted_product_id: productId,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}