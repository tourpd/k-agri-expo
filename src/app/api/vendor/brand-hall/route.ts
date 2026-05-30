import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(v: string) {
  return (
    String(v || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "") || "brand"
  );
}

export async function GET(req: Request) {
  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(req.url);

  const brandSlug = searchParams.get("brand_slug") || "dof-eagle-five";

  const { data: brand, error: brandError } = await supabase
    .from("expo_brands")
    .select("*")
    .eq("brand_slug", brandSlug)
    .maybeSingle();

  if (brandError) {
    return NextResponse.json(
      { ok: false, error: brandError.message },
      { status: 500 }
    );
  }

  if (!brand) {
    return NextResponse.json({
      ok: true,
      brand: null,
      products: [],
      events: [],
    });
  }

  const [{ data: products, error: productsError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("expo_brand_products")
        .select("*")
        .eq("brand_id", brand.id)
        .order("sort_order", { ascending: true }),

      supabase
        .from("expo_brand_events")
        .select("*")
        .eq("brand_id", brand.id)
        .order("sort_order", { ascending: true }),
    ]);

  if (productsError) {
    return NextResponse.json(
      { ok: false, error: productsError.message },
      { status: 500 }
    );
  }

  if (eventsError) {
    return NextResponse.json(
      { ok: false, error: eventsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    brand,
    products: products ?? [],
    events: events ?? [],
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  const brandName = String(body.brand_name || "").trim();
  const brandSlug = String(body.brand_slug || slugify(brandName)).trim();

  if (!brandName) {
    return NextResponse.json(
      { ok: false, error: "브랜드명을 입력하세요." },
      { status: 400 }
    );
  }

  const brandPayload = {
    id: body.id || undefined,

    hall_key: body.hall_key || "crop-nutrition",
    brand_slug: brandSlug,
    brand_name: brandName,

    logo_url: body.logo_url || null,
    banner_url: body.banner_url || null,
    banner_height: Number(body.banner_height || 260),

    short_description: body.short_description || null,
    main_crops: body.main_crops || null,
    main_category: body.main_category || null,

    youtube_url: body.youtube_url || null,
    homepage_url: body.homepage_url || null,
    instagram_url: body.instagram_url || null,
    facebook_url: body.facebook_url || null,
    blog_url: body.blog_url || null,
    sns_url: body.sns_url || null,

    bank_name: body.bank_name || "기업은행",
    bank_account: body.bank_account || "486-072683-04-011",
    bank_holder: body.bank_holder || "한국농수산TV",

    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };

  const { data: brand, error } = await supabase
    .from("expo_brands")
    .upsert(brandPayload, { onConflict: "brand_slug" })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    brand,
  });
}