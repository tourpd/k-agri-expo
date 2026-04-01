import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("expo_feature_slots")
    .select("*")
    .order("slot_group", { ascending: true })
    .order("slot_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    items: data ?? [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const payload = {
    slot_group: String(body.slot_group ?? ""),
    slot_order: Number(body.slot_order ?? 1),

    booth_id: body.booth_id || null,
    deal_id: body.deal_id || null,

    title_override: body.title_override || null,
    subtitle_override: body.subtitle_override || null,

    cover_image_url: body.cover_image_url || null,
    logo_url: body.logo_url || null,

    primary_cta_text: body.primary_cta_text || null,
    primary_target_type: body.primary_target_type || "booth",
    primary_target_value: body.primary_target_value || null,

    secondary_cta_text: body.secondary_cta_text || null,
    secondary_target_type: body.secondary_target_type || null,
    secondary_target_value: body.secondary_target_value || null,

    is_active: Boolean(body.is_active ?? true),
  };

  if (!payload.slot_group) {
    return NextResponse.json(
      { ok: false, error: "slot_group이 필요합니다." },
      { status: 400 }
    );
  }

  if (body.slot_id) {
    const { data, error } = await supabase
      .from("expo_feature_slots")
      .update(payload)
      .eq("slot_id", body.slot_id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  }

  const { data, error } = await supabase
    .from("expo_feature_slots")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    item: data,
  });
}