import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductSpecPayload = {
  application_methods?: string[];
  application_method_detail?: string;
  dilution_ratio_text?: string;
  base_water_liter?: number | null;
  base_product_amount?: number | null;
  base_product_unit?: string;
  base_area_pyeong?: number | null;
  interval_days?: number | null;
  max_cycles?: number | null;
  best_timing_text?: string;
  target_crops?: string[];
  growth_stages?: string[];
  seedling_allowed?: boolean;
  seedling_ratio_text?: string;
  seedling_interval_days?: number | null;
  seedling_notes?: string;
  soaking_allowed?: boolean;
  soaking_ratio_text?: string;
  soaking_duration_minutes?: number | null;
  soaking_target?: string;
  soaking_notes?: string;
  foliar_allowed?: boolean;
  foliar_target_parts?: string[];
  foliar_method_text?: string;
  drench_allowed?: boolean;
  drench_method_text?: string;
  drench_water_volume_text?: string;
  mixable?: boolean | null;
  mixable_with?: string[];
  non_mixable_with?: string[];
  mix_notes?: string;
  phytotoxicity_warning?: string;
  precautions?: string;
  protective_equipment?: string[];
  ai_summary?: string;
  ai_enabled?: boolean;
  verified_status?: string;
};

type Body = {
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

  purchase_url?: string | null;
  dealer_apply_url?: string | null;
  buyer_apply_url?: string | null;

  usage_summary?: string | null;
  usage_method?: string | null;
  usage_timing?: string | null;
  usage_interval?: string | null;
  usage_crops?: string | null;
  caution_text?: string | null;

  calc_base_water_liter?: number | string | null;
  calc_base_product_ml?: number | string | null;
  calc_base_area_pyeong?: number | string | null;

  point_1?: string | null;
  point_2?: string | null;
  point_3?: string | null;

  is_active?: boolean | null;
  status?: string | null;
  sort_order?: number | string | null;

  spec?: ProductSpecPayload | null;
};

type VendorRow = {
  vendor_id?: string | null;
  user_id?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
};

type ProductRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;
};

function jsonError(message: string, status = 400, debug?: unknown) {
  return NextResponse.json(
    { success: false, error: message, debug: debug ?? null },
    { status }
  );
}

function cleanText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanNullableText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    const onlyNumber = value.replace(/[^\d.-]/g, "");
    if (!onlyNumber) return null;
    const n = Number(onlyNumber);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function resolveProductKey(body: Body): string | null {
  const raw = body.product_id ?? body.id ?? null;
  if (raw === null || raw === undefined || raw === "") return null;
  return String(raw);
}

function normalizeSpec(spec?: ProductSpecPayload | null) {
  const input = spec ?? {};

  return {
    application_methods: cleanStringArray(input.application_methods),
    application_method_detail: cleanText(input.application_method_detail),

    dilution_ratio_text: cleanText(input.dilution_ratio_text),
    base_water_liter: cleanNumber(input.base_water_liter),
    base_product_amount: cleanNumber(input.base_product_amount),
    base_product_unit: cleanText(input.base_product_unit, "ml"),
    base_area_pyeong: cleanNumber(input.base_area_pyeong),

    interval_days: cleanNumber(input.interval_days),
    max_cycles: cleanNumber(input.max_cycles),
    best_timing_text: cleanText(input.best_timing_text),

    target_crops: cleanStringArray(input.target_crops),
    growth_stages: cleanStringArray(input.growth_stages),

    seedling_allowed: cleanBoolean(input.seedling_allowed, false),
    seedling_ratio_text: cleanText(input.seedling_ratio_text),
    seedling_interval_days: cleanNumber(input.seedling_interval_days),
    seedling_notes: cleanText(input.seedling_notes),

    soaking_allowed: cleanBoolean(input.soaking_allowed, false),
    soaking_ratio_text: cleanText(input.soaking_ratio_text),
    soaking_duration_minutes: cleanNumber(input.soaking_duration_minutes),
    soaking_target: cleanText(input.soaking_target),
    soaking_notes: cleanText(input.soaking_notes),

    foliar_allowed: cleanBoolean(input.foliar_allowed, false),
    foliar_target_parts: cleanStringArray(input.foliar_target_parts),
    foliar_method_text: cleanText(input.foliar_method_text),

    drench_allowed: cleanBoolean(input.drench_allowed, false),
    drench_method_text: cleanText(input.drench_method_text),
    drench_water_volume_text: cleanText(input.drench_water_volume_text),

    mixable:
      typeof input.mixable === "boolean" || input.mixable === null
        ? input.mixable
        : null,
    mixable_with: cleanStringArray(input.mixable_with),
    non_mixable_with: cleanStringArray(input.non_mixable_with),
    mix_notes: cleanText(input.mix_notes),

    phytotoxicity_warning: cleanText(input.phytotoxicity_warning),
    precautions: cleanText(input.precautions),
    protective_equipment: cleanStringArray(input.protective_equipment),

    ai_summary: cleanText(input.ai_summary),
    ai_enabled: cleanBoolean(input.ai_enabled, false),
    verified_status: cleanText(input.verified_status, "draft"),
  };
}

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { ok: false as const, error: "로그인이 필요합니다.", status: 401 };
  }

  const { data: vendorRows, error: vendorError } = await admin
    .from("vendors")
    .select("vendor_id,user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (vendorError) {
    return {
      ok: false as const,
      error: vendorError.message || "vendor 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const vendor = (vendorRows?.[0] ?? null) as VendorRow | null;

  if (!vendor?.vendor_id) {
    return { ok: false as const, error: "vendor 정보를 찾지 못했습니다.", status: 404 };
  }

  return {
    ok: true as const,
    userId: user.id,
    vendorId: String(vendor.vendor_id),
    admin,
  };
}

async function getOwnedBoothById(params: {
  boothId: string;
  userId: string;
  vendorId: string;
}) {
  const { boothId, userId, vendorId } = params;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .eq("booth_id", boothId)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      error: error.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  const booth = (data ?? null) as BoothRow | null;

  if (!booth?.booth_id) {
    return { ok: false as const, error: "부스를 찾을 수 없습니다.", status: 404 };
  }

  const owned =
    String(booth.vendor_id ?? "") === vendorId ||
    String(booth.vendor_user_id ?? "") === userId;

  if (!owned) {
    return {
      ok: false as const,
      error: "이 부스에 제품을 등록할 권한이 없습니다.",
      status: 403,
    };
  }

  return { ok: true as const, booth };
}

async function findOwnedProduct(params: {
  productKey: string;
  userId: string;
  vendorId: string;
}) {
  const { productKey, userId, vendorId } = params;
  const admin = createSupabaseAdminClient();

  const tryFind = async (column: "product_id" | "id") => {
    const { data, error } = await admin
      .from("expo_products")
      .select("id,product_id,booth_id")
      .eq(column, productKey)
      .maybeSingle();

    if (error) return null;

    const product = (data ?? null) as ProductRow | null;
    if (!product?.booth_id) return null;

    const ownedBooth = await getOwnedBoothById({
      boothId: String(product.booth_id),
      userId,
      vendorId,
    });

    if (!ownedBooth.ok) return null;

    return { product, booth: ownedBooth.booth };
  };

  return (await tryFind("product_id")) || (await tryFind("id"));
}

function buildProductPayload(body: Body, boothId: string) {
  const imageUrl =
    cleanNullableText(body.image_url) ||
    cleanNullableText(body.image_file_url) ||
    cleanNullableText(body.thumbnail_url);

  const catalogUrl =
    cleanNullableText(body.catalog_file_url) ||
    cleanNullableText(body.catalog_url);

  return compactObject({
    booth_id: boothId,

    name: cleanNullableText(body.name),
    title: cleanNullableText(body.title),
    description: cleanNullableText(body.description),

    image_url: imageUrl,
    image_file_url: imageUrl,
    thumbnail_url: imageUrl,

    price_krw: cleanNumber(body.price_krw),
    sale_price_krw: cleanNumber(body.sale_price_krw),
    price_text: cleanNullableText(body.price_text),

    youtube_url: cleanNullableText(body.youtube_url),

    catalog_url: catalogUrl,
    catalog_file_url: catalogUrl,
    catalog_filename: cleanNullableText(body.catalog_filename),

    headline_text: cleanNullableText(body.headline_text),
    urgency_text: cleanNullableText(body.urgency_text),
    cta_text: cleanNullableText(body.cta_text) ?? "지금 구매하기",

    purchase_url: cleanNullableText(body.purchase_url),
    dealer_apply_url: cleanNullableText(body.dealer_apply_url),
    buyer_apply_url: cleanNullableText(body.buyer_apply_url),

    usage_summary: cleanNullableText(body.usage_summary),
    usage_method: cleanNullableText(body.usage_method),
    usage_timing: cleanNullableText(body.usage_timing),
    usage_interval: cleanNullableText(body.usage_interval),
    usage_crops: cleanNullableText(body.usage_crops),
    caution_text: cleanNullableText(body.caution_text),

    calc_base_water_liter: cleanNumber(body.calc_base_water_liter),
    calc_base_product_ml: cleanNumber(body.calc_base_product_ml),
    calc_base_area_pyeong: cleanNumber(body.calc_base_area_pyeong),

    point_1: cleanNullableText(body.point_1),
    point_2: cleanNullableText(body.point_2),
    point_3: cleanNullableText(body.point_3),

    is_active: body.is_active !== false,
    status: cleanText(body.status, "active"),
    sort_order: cleanNumber(body.sort_order),

    updated_at: new Date().toISOString(),
  });
}

async function saveProductSpec(productId: string, body: Body) {
  const admin = createSupabaseAdminClient();
  const normalized = normalizeSpec(body.spec);

  const specPayload = {
    product_id: productId,

    application_methods: normalized.application_methods,
    application_method_detail: normalized.application_method_detail,

    dilution_ratio_text: normalized.dilution_ratio_text,
    base_water_liter: normalized.base_water_liter,
    base_product_amount: normalized.base_product_amount,
    base_product_unit: normalized.base_product_unit,
    base_area_pyeong: normalized.base_area_pyeong,

    interval_days: normalized.interval_days,
    max_cycles: normalized.max_cycles,
    best_timing_text: normalized.best_timing_text,

    target_crops: normalized.target_crops,
    growth_stages: normalized.growth_stages,

    seedling_allowed: normalized.seedling_allowed,
    seedling_ratio_text: normalized.seedling_ratio_text,
    seedling_interval_days: normalized.seedling_interval_days,
    seedling_notes: normalized.seedling_notes,

    soaking_allowed: normalized.soaking_allowed,
    soaking_ratio_text: normalized.soaking_ratio_text,
    soaking_duration_minutes: normalized.soaking_duration_minutes,
    soaking_target: normalized.soaking_target,
    soaking_notes: normalized.soaking_notes,

    foliar_allowed: normalized.foliar_allowed,
    foliar_target_parts: normalized.foliar_target_parts,
    foliar_method_text: normalized.foliar_method_text,

    drench_allowed: normalized.drench_allowed,
    drench_method_text: normalized.drench_method_text,
    drench_water_volume_text: normalized.drench_water_volume_text,

    mixable: normalized.mixable,
    mixable_with: normalized.mixable_with,
    non_mixable_with: normalized.non_mixable_with,
    mix_notes: normalized.mix_notes,

    phytotoxicity_warning: normalized.phytotoxicity_warning,
    precautions: normalized.precautions,
    protective_equipment: normalized.protective_equipment,

    ai_summary: normalized.ai_summary,
    ai_enabled: normalized.ai_enabled,
    verified_status: normalized.verified_status,
  };

  const { data: existingRow, error: existingError } = await admin
    .from("expo_product_specs")
    .select("id,product_id")
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) {
    return {
      ok: false as const,
      error: existingError.message || "제품 상세기준 조회 중 오류가 발생했습니다.",
      status: 400,
    };
  }

  if (existingRow?.id) {
    const { data, error } = await admin
      .from("expo_product_specs")
      .update(specPayload)
      .eq("id", existingRow.id)
      .select("*")
      .single();

    if (error) {
      return {
        ok: false as const,
        error: error.message || "제품 상세기준 수정에 실패했습니다.",
        status: 400,
      };
    }

    return { ok: true as const, spec: data };
  }

  const { data, error } = await admin
    .from("expo_product_specs")
    .insert(specPayload)
    .select("*")
    .single();

  if (error) {
    return {
      ok: false as const,
      error: error.message || "제품 상세기준 저장에 실패했습니다.",
      status: 400,
    };
  }

  return { ok: true as const, spec: data };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthedContext();

    if (!auth.ok) {
      return jsonError(auth.error, auth.status);
    }

    const { userId, vendorId, admin } = auth;

    const body = (await req.json().catch(() => null)) as Body | null;

    if (!body) {
      return jsonError("잘못된 요청 형식입니다.", 400);
    }

    const productKey = resolveProductKey(body);
    const requestedBoothId = cleanText(body.booth_id || body.boothId);

    const name = cleanText(body.name);
    const title = cleanText(body.title);

    if (!name && !title) {
      return jsonError("제품명 또는 제품 한줄 제목을 입력해 주세요.", 400);
    }

    let boothId = requestedBoothId;
    let savedProduct: Record<string, unknown> | null = null;

    if (productKey) {
      const ownedProduct = await findOwnedProduct({
        productKey,
        userId,
        vendorId,
      });

      if (!ownedProduct) {
        return jsonError("이 제품을 수정할 권한이 없습니다.", 403);
      }

      boothId = String(ownedProduct.booth.booth_id ?? "");

      const updatePayload = buildProductPayload(body, boothId);

      const tryUpdate = async (column: "product_id" | "id", value: unknown) => {
        return admin
          .from("expo_products")
          .update(updatePayload)
          .eq(column, value)
          .select("*")
          .maybeSingle();
      };

      let result = await tryUpdate(
        "product_id",
        ownedProduct.product.product_id ?? productKey
      );

      if (result.error || !result.data) {
        result = await tryUpdate("id", ownedProduct.product.id ?? productKey);
      }

      if (result.error || !result.data) {
        return jsonError(
          result.error?.message || "제품 수정에 실패했습니다.",
          500
        );
      }

      savedProduct = result.data;
    } else {
      if (!boothId) {
        return jsonError("booth_id가 필요합니다.", 400);
      }

      const ownedBooth = await getOwnedBoothById({
        boothId,
        userId,
        vendorId,
      });

      if (!ownedBooth.ok) {
        return jsonError(ownedBooth.error, ownedBooth.status);
      }

      const insertPayload = {
        ...buildProductPayload(body, boothId),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await admin
        .from("expo_products")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        return jsonError(error.message || "제품 등록에 실패했습니다.", 500);
      }

      savedProduct = data;
    }

    const savedProductId = String(
      savedProduct?.product_id ?? savedProduct?.id ?? ""
    );

    if (!savedProductId) {
      return jsonError(
        "제품 저장은 되었지만 product_id를 확인하지 못했습니다.",
        500
      );
    }

    const specResult = await saveProductSpec(savedProductId, body);

    if (!specResult.ok) {
      return jsonError(specResult.error, specResult.status);
    }

    const item = {
      ...savedProduct,
      spec: specResult.spec ?? null,
    };

    return NextResponse.json({
      success: true,
      ok: true,
      item,
      product: item,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "제품 저장 중 오류가 발생했습니다.",
      500
    );
  }
}