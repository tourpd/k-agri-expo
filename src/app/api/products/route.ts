import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        product_id,
        booth_id,
        name,
        crops,
        effects,
        description,
        status,
        created_at,
        is_live,
        live_price,
        live_until,
        deleted_at,
        deleted_by,
        buy_url,
        price_number,
        code,
        price_krw,
        category
      `)
      .is("deleted_at", null)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "상품 조회 실패",
        },
        { status: 500 }
      );
    }

    const products = (data || []).map((row: any) => {
      const fallbackCategory =
        Array.isArray(row?.effects) && row.effects.length > 0
          ? String(row.effects[0])
          : Array.isArray(row?.crops) && row.crops.length > 0
          ? String(row.crops[0])
          : "booth";

      const category = safeText(row?.category, fallbackCategory);

      const livePrice =
        typeof row?.live_price === "number" && Number.isFinite(row.live_price)
          ? row.live_price
          : null;

      const basePrice =
        typeof row?.price_krw === "number" && Number.isFinite(row.price_krw)
          ? row.price_krw
          : safeNumber(row?.price_number, 0);

      const finalPrice =
        row?.is_live && livePrice !== null ? livePrice : basePrice;

      return {
        id: row.product_id,
        code: safeText(row?.code, String(row.product_id)),
        product_id: row.product_id,
        booth_id: row.booth_id ?? null,
        name: safeText(row?.name),
        description: safeText(row?.description),
        category,
        price_krw: finalPrice,
        price_number: safeNumber(row?.price_number, 0),
        is_live: !!row?.is_live,
        live_price: livePrice,
        buy_url: safeText(row?.buy_url, "/vendor/apply"),
      };
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}