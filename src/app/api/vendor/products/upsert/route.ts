import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductPayload = {
  product_id?: string | number | null;
  id?: string | number | null;
  booth_id?: string | null;
  boothId?: string | null;

  name?: string | null;
  title?: string | null;
  description?: string | null;

  image_url?: string | null;
  image_file_url?: string | null;
  thumbnail_url?: string | null;

  price_krw?: number | string | null;
  sale_price_krw?: number | string | null;
  price_text?: string | null;

  youtube_url?: string | null;

  catalog_url?: string | null;
  catalog_file_url?: string | null;
  catalog_filename?: string | null;

  headline_text?: string | null;
  urgency_text?: string | null;
  cta_text?: string | null;

  point_1?: string | null;
  point_2?: string | null;
  point_3?: string | null;

  is_active?: boolean | null;
  status?: string | null;
  sort_order?: number | string | null;
};

type BoothOwnerRow = {
  booth_id?: string | null;
  vendor_user_id?: string | null;
  vendor_id?: string | null;
};

type ProductOwnerRow = {
  id?: string | null;
  product_id?: string | null;
  booth_id?: string | null;
};

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function jsonSuccess(data: Record<string, unknown>) {
  return NextResponse.json(data, {
    headers: noStoreHeaders(),
  });
}

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullableString(v: unknown) {
  const s = cleanString(v);
  return s || null;
}

function cleanNumber(v: unknown) {
  if (v === null || v === undefined || v === "") return null;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }

  if (typeof v === "string") {
    const normalized = v.replace(/[^\d.-]/g, "").trim();
    if (!normalized) return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function cleanBoolean(v: unknown, defaultValue = true) {
  if (typeof v === "boolean") return v;
  return defaultValue;
}

function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

function resolveProductKey(body: ProductPayload): string | null {
  const raw = body.product_id ?? body.id ?? null;
  if (raw === null || raw === undefined || raw === "") return null;
  return String(raw);
}

function resolveBoothId(body: ProductPayload): string {
  return cleanString(body.booth_id ?? body.boothId ?? "");
}

function makeProductId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

async function getAuthedUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error("[api/vendor/products/upsert] auth.getUser error:", error);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error(
      "[api/vendor/products/upsert] getAuthedUserId exception:",
      error
    );
    return null;
  }
}

async function getOwnedBooth(
  boothId: string,
  userId: string
): Promise<BoothOwnerRow | null> {
  if (!boothId || !userId) return null;

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("booths")
    .select("booth_id, vendor_user_id, vendor_id")
    .eq("booth_id", boothId)
    .maybeSingle<BoothOwnerRow>();

  if (error) {
    console.error("[api/vendor/products/upsert] booth lookup error:", error);
    return null;
  }

  if (!data?.booth_id) return null;

  const isOwner = data.vendor_user_id === userId || data.vendor_id === userId;

  return isOwner ? data : null;
}

async function getOwnedProduct(
  productKey: string,
  userId: string
): Promise<ProductOwnerRow | null> {
  const admin = createSupabaseAdminClient();

  const byProductId = await admin
    .from("expo_products")
    .select("id, product_id, booth_id")
    .eq("product_id", productKey)
    .maybeSingle<ProductOwnerRow>();

  if (!byProductId.error && byProductId.data?.booth_id) {
    const ownedBooth = await getOwnedBooth(
      String(byProductId.data.booth_id),
      userId
    );
    if (ownedBooth) return byProductId.data;
  }

  const byId = await admin
    .from("expo_products")
    .select("id, product_id, booth_id")
    .eq("id", productKey)
    .maybeSingle<ProductOwnerRow>();

  if (!byId.error && byId.data?.booth_id) {
    const ownedBooth = await getOwnedBooth(String(byId.data.booth_id), userId);
    if (ownedBooth) return byId.data;
  }

  return null;
}

function buildSharedPayload(body: ProductPayload) {
  const imageUrl = cleanNullableString(body.image_url);
  const imageFileUrl =
    cleanNullableString(body.image_file_url) ?? imageUrl ?? null;
  const thumbnailUrl =
    cleanNullableString(body.thumbnail_url) ?? imageUrl ?? null;

  return compactObject({
    name: cleanNullableString(body.name),
    title: cleanNullableString(body.title),
    description: cleanNullableString(body.description),

    image_url: imageUrl,
    image_file_url: imageFileUrl,
    thumbnail_url: thumbnailUrl,

    price_krw: cleanNumber(body.price_krw),
    sale_price_krw: cleanNumber(body.sale_price_krw),
    price_text: cleanNullableString(body.price_text),

    youtube_url: cleanNullableString(body.youtube_url),

    catalog_url: cleanNullableString(body.catalog_url),
    catalog_file_url: cleanNullableString(body.catalog_file_url),
    catalog_filename: cleanNullableString(body.catalog_filename),

    headline_text: cleanNullableString(body.headline_text),
    urgency_text: cleanNullableString(body.urgency_text),
    cta_text: cleanNullableString(body.cta_text),

    point_1: cleanNullableString(body.point_1),
    point_2: cleanNullableString(body.point_2),
    point_3: cleanNullableString(body.point_3),

    is_active: cleanBoolean(body.is_active, true),
    status: cleanNullableString(body.status) ?? "active",
    sort_order: cleanNumber(body.sort_order),

    updated_at: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthedUserId();

    if (!userId) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const body = (await req.json().catch(() => ({}))) as ProductPayload;

    const productKey = resolveProductKey(body);
    const boothId = resolveBoothId(body);

    const resolvedName = cleanString(body.name);
    const resolvedTitle = cleanString(body.title);

    if (!resolvedName && !resolvedTitle) {
      return jsonError("제품명 또는 제목 중 하나는 입력해야 합니다.", 400);
    }

    const admin = createSupabaseAdminClient();

    if (productKey) {
      const ownedProduct = await getOwnedProduct(productKey, userId);

      if (!ownedProduct) {
        return jsonError("이 제품을 수정할 권한이 없습니다.", 403);
      }

      const updatePayload = compactObject({
        ...buildSharedPayload(body),
        booth_id: ownedProduct.booth_id ?? undefined,
      });

      if (ownedProduct.product_id) {
        const updateByProductId = await admin
          .from("expo_products")
          .update(updatePayload)
          .eq("product_id", ownedProduct.product_id)
          .select("*")
          .maybeSingle();

        if (!updateByProductId.error && updateByProductId.data) {
          return jsonSuccess({
            ok: true,
            success: true,
            mode: "updated",
            item: updateByProductId.data,
          });
        }
      }

      const updateById = await admin
        .from("expo_products")
        .update(updatePayload)
        .eq("id", ownedProduct.id ?? productKey)
        .select("*")
        .maybeSingle();

      if (updateById.error || !updateById.data) {
        console.error(
          "[api/vendor/products/upsert] update error:",
          updateById.error
        );

        return jsonError(
          updateById.error?.message || "제품 수정에 실패했습니다.",
          500
        );
      }

      return jsonSuccess({
        ok: true,
        success: true,
        mode: "updated",
        item: updateById.data,
      });
    }

    if (!boothId) {
      return jsonError("booth_id가 필요합니다.", 400);
    }

    const ownedBooth = await getOwnedBooth(boothId, userId);
    if (!ownedBooth) {
      return jsonError("이 부스에 제품을 등록할 권한이 없습니다.", 403);
    }

    const insertPayload = compactObject({
      product_id: makeProductId(),
      booth_id: boothId,
      ...buildSharedPayload(body),
      created_at: new Date().toISOString(),
    });

    const { data, error } = await admin
      .from("expo_products")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("[api/vendor/products/upsert] insert error:", error);
      return jsonError(error.message || "제품 등록에 실패했습니다.", 500);
    }

    return jsonSuccess({
      ok: true,
      success: true,
      mode: "inserted",
      item: data,
    });
  } catch (error) {
    console.error("[api/vendor/products/upsert] exception:", error);

    return jsonError(
      error instanceof Error ? error.message : "제품 저장 중 오류가 발생했습니다.",
      500
    );
  }
}