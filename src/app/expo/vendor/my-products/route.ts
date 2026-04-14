import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSortOrder(value: unknown, fallback = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < 1) return 1;
  return Math.floor(num);
}

async function getOwnedBooth() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, booth: null, error: "로그인이 필요합니다." };
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isVendor = Array.isArray(roles)
    ? roles.some((r) => r.role === "vendor")
    : false;

  if (!isVendor) {
    return { supabase, booth: null, error: "vendor 권한이 없습니다." };
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("vendor_id,user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (vendorError || !vendor?.vendor_id) {
    return { supabase, booth: null, error: "vendor가 없습니다." };
  }

  const { data: booth, error: boothError } = await supabase
    .from("booths")
    .select("booth_id,vendor_id")
    .eq("vendor_id", vendor.vendor_id)
    .maybeSingle();

  if (boothError || !booth?.booth_id) {
    return { supabase, booth: null, error: "부스가 없습니다." };
  }

  return { supabase, booth, error: null };
}

export async function POST(req: Request) {
  try {
    const { supabase, booth, error } = await getOwnedBooth();

    if (error || !booth) {
      return Response.json(
        { ok: false, error: error || "권한 없음" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const productId =
      typeof body?.product_id === "string" ? body.product_id.trim() : "";

    const payload = {
      booth_id: booth.booth_id,
      name: normalizeText(body?.name),
      description: normalizeText(body?.description),
      price_text: normalizeText(body?.price_text),
      sort_order: normalizeSortOrder(body?.sort_order, 1),
      is_active: body?.is_active !== false,
      image_url: normalizeText(body?.image_url),
      youtube_url: normalizeText(body?.youtube_url),
      catalog_url: normalizeText(body?.catalog_url),
      catalog_filename: normalizeText(body?.catalog_filename),
    };

    if (!payload.name) {
      return Response.json(
        { ok: false, error: "제품명은 필수입니다." },
        { status: 400 }
      );
    }

    // UPDATE
    if (productId) {
      const { data: owned } = await supabase
        .from("products")
        .select("product_id,booth_id")
        .eq("product_id", productId)
        .eq("booth_id", booth.booth_id)
        .maybeSingle();

      if (!owned) {
        return Response.json(
          { ok: false, error: "내 제품이 아닙니다." },
          { status: 403 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("product_id", productId)
        .eq("booth_id", booth.booth_id)
        .select("*")
        .single();

      if (updateError) {
        return Response.json(
          { ok: false, error: updateError.message },
          { status: 400 }
        );
      }

      return Response.json({
        ok: true,
        mode: "updated",
        product: updated,
      });
    }

    // INSERT
    const { data: created, error: createError } = await supabase
      .from("products")
      .insert(payload)
      .select("*")
      .single();

    if (createError) {
      return Response.json(
        { ok: false, error: createError.message },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      mode: "created",
      product: created,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 저장 중 오류" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { supabase, booth, error } = await getOwnedBooth();

    if (error || !booth) {
      return Response.json(
        { ok: false, error: error || "권한 없음" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const productId =
      typeof body?.product_id === "string" ? body.product_id.trim() : "";

    if (!productId) {
      return Response.json(
        { ok: false, error: "product_id required" },
        { status: 400 }
      );
    }

    const { data: owned } = await supabase
      .from("products")
      .select("product_id,booth_id")
      .eq("product_id", productId)
      .eq("booth_id", booth.booth_id)
      .maybeSingle();

    if (!owned) {
      return Response.json(
        { ok: false, error: "내 제품이 아닙니다." },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId)
      .eq("booth_id", booth.booth_id);

    if (deleteError) {
      return Response.json(
        { ok: false, error: deleteError.message },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      deleted_product_id: productId,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 삭제 중 오류" },
      { status: 500 }
    );
  }
}