import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("expo_hall_sections")
    .select("*")
    .eq("hall_key", "crop-nutrition")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  const payload = {
    id: body.id || undefined,
    hall_key: body.hall_key || "crop-nutrition",
    section_type: body.section_type || "issue",
    title: body.title || "",
    subtitle: body.subtitle || null,
    crop: body.crop || null,
    image_url: body.image_url || null,
    link_url: body.link_url || null,
    sort_order: Number(body.sort_order || 0),
    is_active: Boolean(body.is_active),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("expo_hall_sections")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}