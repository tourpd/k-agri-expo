import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(v: unknown) {
  const s = String(v || "").trim();
  return s ? s : null;
}

function cleanNumber(v: unknown) {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeYoutubeUrls(v: unknown) {
  if (Array.isArray(v)) {
    return v.map((x) => String(x || "").trim()).filter(Boolean);
  }

  if (typeof v === "string") {
    return v
      .split(/\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const brandId = String(body.brand_id || "").trim();
    const productName = String(body.product_name || "").trim();

    if (!brandId) {
      return NextResponse.json(
        { ok: false, error: "brand_id가 없습니다." },
        { status: 400 }
      );
    }

    if (!productName) {
      return NextResponse.json(
        { ok: false, error: "제품명을 입력하세요." },
        { status: 400 }
      );
    }

    const youtubeUrls = normalizeYoutubeUrls(body.youtube_urls);
    const firstYoutubeUrl = cleanText(body.youtube_url) || youtubeUrls[0] || null;

    const payload = {
      id: cleanText(body.id) || undefined,
      brand_id: brandId,

      product_name: productName,
      category: cleanText(body.category),
      short_description: cleanText(body.short_description),
      image_url: cleanText(body.image_url),

      youtube_url: firstYoutubeUrl,
      youtube_urls: youtubeUrls,

      detail_description: cleanText(body.detail_description),
      target_crops: cleanText(body.target_crops),
      use_season: cleanText(body.use_season),
      how_to_use: cleanText(body.how_to_use),
      dosage_guide: cleanText(body.dosage_guide),
      cautions: cleanText(body.cautions),

      catalog_url: cleanText(body.catalog_url),
      manual_url: cleanText(body.manual_url),

      price_krw: cleanNumber(body.price_krw),
      shipping_fee_krw: cleanNumber(body.shipping_fee_krw),
      unit_label: cleanText(body.unit_label),

      base_area_pyeong: cleanNumber(body.base_area_pyeong),
      recommended_rounds: cleanNumber(body.recommended_rounds),
      spray_interval: cleanText(body.spray_interval),
      use_period: cleanText(body.use_period),

      link_url: cleanText(body.link_url),
      is_active: body.is_active !== false,
      sort_order: Number(body.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("expo_brand_products")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "제품 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}