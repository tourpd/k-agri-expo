import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { analyzeProductForFarmers } from "@/lib/ai-sales/productAnalyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function cleanUrlList(v: unknown) {
  if (!Array.isArray(v)) return [];

  return v
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const productName = cleanText(body.product_name);
    const category = cleanText(body.category);
    const homepageUrl = cleanText(body.homepage_url);
    const youtubeUrl = cleanText(body.youtube_url);
    const videoUrls = cleanUrlList(body.video_urls);

    if (!productName) {
      return NextResponse.json(
        { ok: false, error: "제품명을 입력해주세요." },
        { status: 400 }
      );
    }

    const aiResult = analyzeProductForFarmers({
      product_name: productName,
      category,
      homepage_url: homepageUrl,
      youtube_url: youtubeUrl,
    });

    const salesType = cleanText(
      body.sales_type || aiResult.sales_type || "general_sale"
    );

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_ai_products")
      .insert({
        product_name: productName,
        category,
        homepage_url: homepageUrl,
        youtube_url: youtubeUrl,
        video_urls: videoUrls,

        regular_price: num(body.regular_price),
        sale_price: num(body.sale_price),
        group_buy_price: num(body.group_buy_price),
        shipping_fee: num(body.shipping_fee),
        unit_label: cleanText(body.unit_label),
        sales_type: salesType,

        bank_name: cleanText(body.bank_name),
        bank_account: cleanText(body.bank_account),
        bank_holder: cleanText(body.bank_holder),

        ai_score: aiResult.conversion_score,
        status: "analyzed",
      })
      .select("*")
      .single();

    if (error) {
      console.error("expo_ai_products insert error:", error);

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      product: data,
      ai_result: {
        ...aiResult,
        sales_type: salesType,
      },
    });
  } catch (error: any) {
    console.error("product-analyzer error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "AI 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}