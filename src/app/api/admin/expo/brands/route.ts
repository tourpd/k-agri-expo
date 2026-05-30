import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(v: string) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("expo_brands")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  const brandName = String(body.brand_name || "").trim();
  const brandSlug = String(body.brand_slug || slugify(brandName)).trim();

  const payload = {
    id: body.id || undefined,
    hall_key: body.hall_key || "crop-nutrition",
    brand_slug: brandSlug,
    brand_name: brandName,
    logo_url: body.logo_url || null,
    banner_url: body.banner_url || null,
    short_description: body.short_description || null,
    main_crops: body.main_crops || null,
    main_category: body.main_category || null,
    youtube_url: body.youtube_url || null,
    homepage_url: body.homepage_url || null,
    is_featured: Boolean(body.is_featured),
    is_active: body.is_active !== false,
    sort_order: Number(body.sort_order || 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("expo_brands")
    .upsert(payload, { onConflict: "brand_slug" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}
