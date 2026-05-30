import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recommendProducts } from "@/lib/recommend/recommendProduct";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const crop = String(body?.crop || "");
    const message = String(body?.message || "");

    const admin = createSupabaseAdminClient();

    const { data: products, error } = await admin
      .from("expo_products")
      .select("product_id,name,title,headline_text,image_url,image_file_url,thumbnail_url,price_krw,sale_price_krw,tags,is_active")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const recommended = recommendProducts(
      { crop, message },
      products || []
    );

    return NextResponse.json({
      ok: true,
      ...recommended,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "추천 상품 조회 실패",
      },
      { status: 500 }
    );
  }
}
