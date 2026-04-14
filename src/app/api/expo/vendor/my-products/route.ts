import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type VendorRef = {
  vendor_id: string;
  user_id?: string | null;
};

type BoothRef = {
  booth_id: string;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
};

async function getOwnedBoothByRequest(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      vendor: null,
      booth: null,
      body: null,
      error: "로그인이 필요합니다.",
      status: 401,
    };
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (jsonError: any) {
    return {
      supabase,
      user,
      vendor: null,
      booth: null,
      body: null,
      error: "잘못된 요청 형식입니다.",
      status: 400,
    };
  }

  const boothId = normalizeText(body?.booth_id);

  if (!boothId) {
    return {
      supabase,
      user,
      vendor: null,
      booth: null,
      body,
      error: "booth_id가 필요합니다.",
      status: 400,
    };
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    return {
      supabase,
      user,
      vendor: null,
      booth: null,
      body,
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
      user,
      vendor: null,
      booth: null,
      body,
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
      user,
      vendor: null,
      booth: null,
      body,
      error: vendorRes.error.message || "vendor 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const vendor = (vendorRes.data?.[0] ?? null) as VendorRef | null;

  if (!vendor?.vendor_id) {
    return {
      supabase,
      user,
      vendor: null,
      booth: null,
      body,
      error: "vendor가 없습니다.",
      status: 404,
    };
  }

  const boothRes = await supabase
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .eq("booth_id", boothId)
    .limit(1);

  if (boothRes.error) {
    return {
      supabase,
      user,
      vendor,
      booth: null,
      body,
      error: boothRes.error.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const booth = (boothRes.data?.[0] ?? null) as BoothRef | null;

  if (!booth?.booth_id) {
    return {
      supabase,
      user,
      vendor,
      booth: null,
      body,
      error: "부스를 찾을 수 없습니다.",
      status: 404,
    };
  }

  const ownedByVendorId = booth.vendor_id === vendor.vendor_id;
  const ownedByUserId = booth.vendor_user_id === user.id;

  if (!ownedByVendorId && !ownedByUserId) {
    return {
      supabase,
      user,
      vendor,
      booth: null,
      body,
      error: "이 부스를 수정할 권한이 없습니다.",
      status: 403,
    };
  }

  return {
    supabase,
    user,
    vendor,
    booth,
    body,
    error: null,
    status: 200,
  };
}

export async function POST(req: Request) {
  try {
    const { supabase, booth, body, error, status } = await getOwnedBoothByRequest(req);

    if (error || !booth || !body) {
      return Response.json(
        { ok: false, error: error || "권한이 없습니다." },
        { status: status || 401 }
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
    const youtubeUrl = normalizeOptionalUrl(body?.youtube_url);
    const catalogUrl = normalizeOptionalUrl(body?.catalog_url);
    const catalogFilename = normalizeText(body?.catalog_filename);

    if (!name) {
      return Response.json(
        { ok: false, error: "제품명은 필수입니다." },
        { status: 400 }
      );
    }

    const payload = {
      booth_id: booth.booth_id,
      name,
      description,
      price_text: priceText,
      sort_order: sortOrder,
      is_active: isActive,
      image_url: imageUrl,
      youtube_url: youtubeUrl,
      catalog_url: catalogUrl,
      catalog_filename: catalogFilename,
    };

    if (productId) {
      const ownedRes = await supabase
        .from("products")
        .select("product_id,booth_id")
        .eq("product_id", productId)
        .eq("booth_id", booth.booth_id)
        .limit(1);

      if (ownedRes.error) {
        return Response.json(
          {
            ok: false,
            error: ownedRes.error.message || "제품 확인 중 오류가 발생했습니다.",
          },
          { status: 400 }
        );
      }

      const owned = ownedRes.data?.[0] ?? null;

      if (!owned) {
        return Response.json(
          { ok: false, error: "내 제품이 아닙니다." },
          { status: 403 }
        );
      }

      const updateRes = await supabase
        .from("products")
        .update(payload)
        .eq("product_id", productId)
        .eq("booth_id", booth.booth_id);

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
        .eq("booth_id", booth.booth_id)
        .limit(1);

      if (refetchRes.error) {
        return Response.json({
          ok: true,
          mode: "updated",
          product_id: productId,
          booth_id: booth.booth_id,
        });
      }

      const updated = refetchRes.data?.[0] ?? null;

      return Response.json({
        ok: true,
        mode: "updated",
        product: updated,
        product_id: productId,
        booth_id: booth.booth_id,
      });
    }

    const insertRes = await supabase
      .from("products")
      .insert(payload);

    if (insertRes.error) {
      return Response.json(
        {
          ok: false,
          error: insertRes.error.message || "제품 생성에 실패했습니다.",
        },
        { status: 400 }
      );
    }

    const createdRes = await supabase
      .from("products")
      .select("*")
      .eq("booth_id", booth.booth_id)
      .eq("name", name)
      .order("created_at", { ascending: false })
      .limit(1);

    if (createdRes.error) {
      return Response.json({
        ok: true,
        mode: "created",
        booth_id: booth.booth_id,
      });
    }

    const created = createdRes.data?.[0] ?? null;

    return Response.json({
      ok: true,
      mode: "created",
      product: created,
      booth_id: booth.booth_id,
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
    const { supabase, booth, body, error, status } = await getOwnedBoothByRequest(req);

    if (error || !booth || !body) {
      return Response.json(
        { ok: false, error: error || "권한이 없습니다." },
        { status: status || 401 }
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

    const ownedRes = await supabase
      .from("products")
      .select("product_id,booth_id")
      .eq("product_id", productId)
      .eq("booth_id", booth.booth_id)
      .limit(1);

    if (ownedRes.error) {
      return Response.json(
        {
          ok: false,
          error: ownedRes.error.message || "제품 확인 중 오류가 발생했습니다.",
        },
        { status: 400 }
      );
    }

    const owned = ownedRes.data?.[0] ?? null;

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
      .eq("booth_id", booth.booth_id);

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
      booth_id: booth.booth_id,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}