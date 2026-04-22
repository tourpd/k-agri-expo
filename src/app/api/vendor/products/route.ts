import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductPayload = {
  product_id?: string | number | null;
  id?: string | number | null;
  booth_id?: string | null;

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

type BoothRow = {
  booth_id?: string | null;
  vendor_user_id?: string | null;
  vendor_id?: string | null;
  plan_type?: string | null;
  product_limit?: number | null;
};

type ProductRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

function cleanString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullableString(v: unknown): string | null {
  const s = cleanString(v);
  return s || null;
}

function cleanNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanBoolean(v: unknown, defaultValue = true): boolean {
  if (typeof v === "boolean") return v;
  return defaultValue;
}

function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function resolveProductKey(body: ProductPayload): string | number | null {
  const raw = body.product_id ?? body.id ?? null;
  if (raw === null || raw === undefined || raw === "") return null;
  return raw;
}

function normalizePlanType(v?: string | null): "free" | "basic" | "premium" {
  const plan = cleanString(v).toLowerCase();
  if (plan === "premium") return "premium";
  if (plan === "basic") return "basic";
  return "free";
}

function getProductLimitFromPlan(planType?: string | null): number {
  const plan = normalizePlanType(planType);
  if (plan === "premium") return 10;
  if (plan === "basic") return 3;
  return 1;
}

async function getAuthedUserId(): Promise<string | null> {
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
): Promise<BoothRow | null> {
  if (!boothId || !userId) return null;

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("booths")
    .select("booth_id, vendor_user_id, vendor_id, plan_type, product_limit")
    .eq("booth_id", boothId)
    .maybeSingle<BoothRow>();

  if (error) {
    console.error("[api/vendor/products/upsert] booth lookup error:", error);
    return null;
  }

  if (!data?.booth_id) return null;

  const owned =
    data.vendor_user_id === userId || data.vendor_id === userId;

  return owned ? data : null;
}

async function findOwnedProduct(
  productKey: string | number,
  userId: string
): Promise<{ product: ProductRow; booth: BoothRow } | null> {
  const admin = createSupabaseAdminClient();

  const tryResolve = async (
    column: "product_id" | "id"
  ): Promise<{ product: ProductRow; booth: BoothRow } | null> => {
    const { data, error } = await admin
      .from("expo_products")
      .select("id, product_id, booth_id")
      .eq(column, productKey)
      .maybeSingle<ProductRow>();

    if (error) {
      console.error(
        `[api/vendor/products/upsert] product lookup error by ${column}:`,
        error
      );
      return null;
    }

    if (!data?.booth_id) return null;

    const booth = await getOwnedBooth(String(data.booth_id), userId);
    if (!booth) return null;

    return { product: data, booth };
  };

  return (await tryResolve("product_id")) || (await tryResolve("id"));
}

async function countProductsByBooth(boothId: string): Promise<number> {
  const admin = createSupabaseAdminClient();

  const { count, error } = await admin
    .from("expo_products")
    .select("*", { head: true, count: "exact" })
    .eq("booth_id", boothId)
    .eq("is_active", true);

  if (error) {
    console.error("[api/vendor/products/upsert] count products error:", error);
    return 0;
  }

  return count ?? 0;
}

function buildSharedPayload(body: ProductPayload) {
  return compactObject({
    name: cleanNullableString(body.name),
    title: cleanNullableString(body.title),
    description: cleanNullableString(body.description),

    image_url: cleanNullableString(body.image_url),
    image_file_url: cleanNullableString(body.image_file_url),
    thumbnail_url: cleanNullableString(body.thumbnail_url),

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
    const boothId = cleanString(body.booth_id);
    const resolvedName = cleanString(body.name);
    const resolvedTitle = cleanString(body.title);

    if (!resolvedName && !resolvedTitle) {
      return jsonError("제품명 또는 제목 중 하나는 입력해야 합니다.", 400);
    }

    const admin = createSupabaseAdminClient();

    // =========================
    // UPDATE
    // =========================
    if (productKey !== null) {
      const owned = await findOwnedProduct(productKey, userId);

      if (!owned) {
        return jsonError("이 제품을 수정할 권한이 없습니다.", 403);
      }

      const updatePayload = buildSharedPayload(body);

      const tryUpdateBy = async (column: "product_id" | "id", value: unknown) => {
        return admin
          .from("expo_products")
          .update(updatePayload)
          .eq(column, value)
          .select("*")
          .maybeSingle();
      };

      const byProductIdValue = owned.product.product_id ?? productKey;
      const byIdValue = owned.product.id ?? productKey;

      let result = await tryUpdateBy("product_id", byProductIdValue);

      if (result.error || !result.data) {
        result = await tryUpdateBy("id", byIdValue);
      }

      if (result.error || !result.data) {
        console.error("[api/vendor/products/upsert] update failed:", result.error);
        return jsonError(result.error?.message || "제품 수정에 실패했습니다.", 500);
      }

      return NextResponse.json(
        {
          success: true,
          mode: "updated",
          item: result.data,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    // =========================
    // INSERT
    // =========================
    if (!boothId) {
      return jsonError("booth_id가 필요합니다.", 400);
    }

    const ownedBooth = await getOwnedBooth(boothId, userId);

    if (!ownedBooth) {
      return jsonError("이 부스에 제품을 등록할 권한이 없습니다.", 403);
    }

    const currentCount = await countProductsByBooth(boothId);
    const planLimit =
      typeof ownedBooth.product_limit === "number" &&
      Number.isFinite(ownedBooth.product_limit)
        ? ownedBooth.product_limit
        : getProductLimitFromPlan(ownedBooth.plan_type);

    if (currentCount >= planLimit) {
      return jsonError(
        `현재 플랜에서는 제품을 최대 ${planLimit}개까지 등록할 수 있습니다.`,
        403
      );
    }

    const insertPayload = compactObject({
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

    return NextResponse.json(
      {
        success: true,
        mode: "inserted",
        item: data,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/vendor/products/upsert] exception:", error);

    return jsonError(
      error instanceof Error ? error.message : "제품 저장 중 오류가 발생했습니다.",
      500
    );
  }
}