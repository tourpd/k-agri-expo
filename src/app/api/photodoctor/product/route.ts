import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeProductName(name: string) {
  return String(name || "")
    .replace(/유기농자재/g, "")
    .replace(/친환경자재/g, "")
    .replace(/친환경/g, "")
    .replace(/유기농/g, "")
    .replace(/자재/g, "")
    .replace(/살충제/g, "")
    .replace(/살균제/g, "")
    .replace(/총채벌레/g, "")
    .replace(/유인제/g, "")
    .replace(/추천/g, "")
    .replace(/제품/g, "")
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(name: string) {
  return normalizeProductName(name)
    .toLowerCase()
    .replace(/\s+/g, "");
}

function isSameProductName(a: string, b: string) {
  const aa = normalizeKey(a);
  const bb = normalizeKey(b);

  if (!aa || !bb) return false;

  return aa === bb || aa.includes(bb) || bb.includes(aa);
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map((v) => safe(v)).filter(Boolean)));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const product = safe(searchParams.get("product"));
  const slug = safe(searchParams.get("slug"));

  if (!product && !slug) {
    return NextResponse.json(
      { success: false, error: "product 또는 slug가 필요합니다." },
      { status: 400 }
    );
  }

  const selectFields = `
    product_id,
    name,
    slug,
    vendor_target,
    company_name,
    price_krw,
    shipping_fee_krw,
    unit_label,
    volume_text,
    coverage_per_unit,
    usage_text,
    caution_text,
    image_url,
    product_type,
    active
  `;

  if (slug) {
    const { data, error } = await supabase
      .from("products")
      .select(selectFields)
      .eq("active", true)
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (data) {
      return NextResponse.json({
        success: true,
        product: data,
      });
    }
  }

  const normalizedProduct = normalizeProductName(product);
  const compactProduct = product.replace(/\s+/g, "");
  const compactNormalizedProduct = normalizedProduct.replace(/\s+/g, "");

  const candidates = uniq([
    product,
    normalizedProduct,
    compactProduct,
    compactNormalizedProduct,
  ]);

  for (const name of candidates) {
    const { data, error } = await supabase
      .from("products")
      .select(selectFields)
      .eq("active", true)
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (data) {
      return NextResponse.json({
        success: true,
        product: data,
      });
    }
  }

  for (const name of candidates) {
    const { data, error } = await supabase
      .from("products")
      .select(selectFields)
      .eq("active", true)
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (data) {
      return NextResponse.json({
        success: true,
        product: data,
      });
    }
  }

  const { data: allProducts, error: listError } = await supabase
    .from("products")
    .select(selectFields)
    .eq("active", true);

  if (listError) {
    return NextResponse.json(
      { success: false, error: listError.message },
      { status: 500 }
    );
  }

  const matched = (allProducts || []).find((item: any) =>
    isSameProductName(item.name, product)
  );

  if (!matched) {
    return NextResponse.json(
      {
        success: false,
        error: "상품을 찾지 못했습니다.",
        requested_product: product,
        normalized_product: normalizedProduct,
        candidates,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    product: matched,
  });
}