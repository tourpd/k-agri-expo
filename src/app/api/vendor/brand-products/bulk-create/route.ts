import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductInput = {
  product_name?: string;
  category?: string;
  recommended_hall?: string;
  short_description?: string;
  ingredients?: string;
  usage?: string;
  target_crop?: string;
  selling_point?: string;
  farmer_pain_point?: string;
  priority?: string;
  priority_reason?: string;
  proof_needed?: string;
  kafs_tv_strategy?: string;
  legal_notice?: string;
};

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  basic: 10,
  growth: 30,
  premium: 100,
  vip: 300,
};

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function normalizePlan(v: unknown) {
  const plan = cleanText(v).toLowerCase();
  return PLAN_LIMITS[plan] ? plan : "free";
}

function makeDescription(item: ProductInput) {
  const parts = [
    cleanText(item.short_description),
    cleanText(item.ingredients) ? `성분·함량: ${cleanText(item.ingredients)}` : "",
    cleanText(item.usage) ? `사용법·적용작물: ${cleanText(item.usage)}` : "",
    cleanText(item.selling_point) ? `농민 소구점: ${cleanText(item.selling_point)}` : "",
    cleanText(item.kafs_tv_strategy)
      ? `한국농수산TV 협업전략: ${cleanText(item.kafs_tv_strategy)}`
      : "",
  ].filter(Boolean);

  return parts.join("\n\n").slice(0, 4000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const brandSlug = cleanText(body.brand_slug) || "dof-eagle-five";
    const vendorPlan = normalizePlan(body.vendor_plan);
    const maxCount = PLAN_LIMITS[vendorPlan] || PLAN_LIMITS.free;

    const products = Array.isArray(body.products)
      ? (body.products as ProductInput[])
      : [];

    if (products.length === 0) {
      return NextResponse.json(
        { ok: false, error: "등록할 제품이 없습니다." },
        { status: 400 },
      );
    }

    const selectedProducts = products
      .filter((item) => cleanText(item.product_name))
      .slice(0, maxCount);

    if (selectedProducts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "제품명이 있는 제품이 없습니다." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: brand, error: brandError } = await supabase
      .from("expo_brands")
      .select("id, brand_slug, brand_name")
      .eq("brand_slug", brandSlug)
      .maybeSingle();

    if (brandError) {
      return NextResponse.json(
        { ok: false, error: brandError.message },
        { status: 500 },
      );
    }

    if (!brand?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: `브랜드를 찾을 수 없습니다. brand_slug=${brandSlug}`,
        },
        { status: 404 },
      );
    }

    const created: any[] = [];
    const updated: any[] = [];
    const skipped: any[] = [];

    for (const item of selectedProducts) {
      const productName = cleanText(item.product_name);
      const category =
        cleanText(item.category) ||
        cleanText(item.recommended_hall) ||
        "AI 자동분류";

      const shortDescription = makeDescription(item);

      const { data: existing, error: existingError } = await supabase
        .from("expo_brand_products")
        .select("id, product_name")
        .eq("brand_id", brand.id)
        .eq("product_name", productName)
        .maybeSingle();

      if (existingError) {
        skipped.push({
          product_name: productName,
          reason: existingError.message,
        });
        continue;
      }

      const payload = {
        brand_id: brand.id,
        product_name: productName,
        category,
        short_description: shortDescription,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { data, error } = await supabase
          .from("expo_brand_products")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          skipped.push({
            product_name: productName,
            reason: error.message,
          });
        } else {
          updated.push(data);
        }

        continue;
      }

      const { data, error } = await supabase
        .from("expo_brand_products")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        skipped.push({
          product_name: productName,
          reason: error.message,
        });
      } else {
        created.push(data);
      }
    }

    return NextResponse.json({
      ok: true,
      brand,
      vendor_plan: vendorPlan,
      limit: maxCount,
      requested_count: products.length,
      saved_count: created.length + updated.length,
      created_count: created.length,
      updated_count: updated.length,
      skipped_count: skipped.length,
      created,
      updated,
      skipped,
      message: `${created.length + updated.length}개 제품을 브랜드관에 저장했습니다.`,
    });
  } catch (error) {
    console.error("[vendor/brand-products/bulk-create] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 자동입점 제품 저장 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}