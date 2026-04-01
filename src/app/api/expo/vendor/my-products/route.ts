import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOwnedBoothId() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, boothId: null, error: "로그인이 필요합니다." };

  const { data: vendor } = await supabase
    .from("vendors")
    .select("vendor_id,user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendor) return { supabase, boothId: null, error: "vendor가 없습니다." };

  const { data: booth } = await supabase
    .from("booths")
    .select("booth_id,vendor_id")
    .eq("vendor_id", vendor.vendor_id)
    .maybeSingle();

  if (!booth) return { supabase, boothId: null, error: "부스가 없습니다." };

  return { supabase, boothId: booth.booth_id, error: null };
}

export async function POST(req: Request) {
  try {
    const { supabase, boothId, error } = await getOwnedBoothId();

    if (error || !boothId) {
      return Response.json({ ok: false, error: error || "권한 없음" }, { status: 401 });
    }

    const body = await req.json();

    const patch = {
      booth_id: boothId,
      name: typeof body?.name === "string" ? body.name.trim() : "",
      description: typeof body?.description === "string" ? body.description.trim() : "",
      price_text: typeof body?.price_text === "string" ? body.price_text.trim() : "",
      sort_order: Number.isFinite(Number(body?.sort_order)) ? Number(body.sort_order) : 1,
      is_active: body?.is_active !== false,
    };

    if (typeof body?.product_id === "string" && body.product_id.trim()) {
      const { data: owned } = await supabase
        .from("products")
        .select("product_id,booth_id")
        .eq("product_id", body.product_id.trim())
        .eq("booth_id", boothId)
        .maybeSingle();

      if (!owned) {
        return Response.json({ ok: false, error: "내 제품이 아닙니다." }, { status: 403 });
      }

      const { data: updated, error: updateError } = await supabase
        .from("products")
        .update(patch)
        .eq("product_id", body.product_id.trim())
        .select("*")
        .single();

      if (updateError) {
        return Response.json({ ok: false, error: updateError.message }, { status: 400 });
      }

      return Response.json({ ok: true, product: updated });
    }

    const { data: created, error: createError } = await supabase
      .from("products")
      .insert(patch)
      .select("*")
      .single();

    if (createError) {
      return Response.json({ ok: false, error: createError.message }, { status: 400 });
    }

    return Response.json({ ok: true, product: created });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 저장 중 오류" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { supabase, boothId, error } = await getOwnedBoothId();

    if (error || !boothId) {
      return Response.json({ ok: false, error: error || "권한 없음" }, { status: 401 });
    }

    const body = await req.json();
    const productId =
      typeof body?.product_id === "string" ? body.product_id.trim() : "";

    if (!productId) {
      return Response.json({ ok: false, error: "product_id required" }, { status: 400 });
    }

    const { data: owned } = await supabase
      .from("products")
      .select("product_id,booth_id")
      .eq("product_id", productId)
      .eq("booth_id", boothId)
      .maybeSingle();

    if (!owned) {
      return Response.json({ ok: false, error: "내 제품이 아닙니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      return Response.json({ ok: false, error: deleteError.message }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "제품 삭제 중 오류" },
      { status: 500 }
    );
  }
}