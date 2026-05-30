import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeContent(v: unknown) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as Record<string, any>;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionKey = safe(searchParams.get("key"));

    if (!sectionKey) {
      return NextResponse.json(
        { ok: false, error: "section_key가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_home_slots")
      .select("*")
      .eq("section_key", sectionKey)
      .eq("is_active", true)
      .order("slot_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item: data || null,
        content: data?.content || null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "조회 실패",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const sectionKey = safe(body.section_key);
    const content = normalizeContent(body.content);

    if (!sectionKey) {
      return NextResponse.json(
        { ok: false, error: "section_key가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const payload = {
      section_key: sectionKey,
      slot_type: sectionKey,
      slot_order: Number(body.slot_order || 1),
      is_active: true,

      title: safe(content.title) || null,
      subtitle: safe(content.subtitle) || null,
      description: safe(content.description) || null,
      image_url: safe(content.image_url || content.prize_image_url) || null,
      link_url: safe(content.cta_link) || null,
      badge: safe(content.event_badge || content.badge) || null,
      meta_1: safe(content.sponsor_name || content.meta_1) || null,
      meta_2: safe(content.partner_name || content.meta_2) || null,

      content: {
        ...content,
        section_key: sectionKey,
        slot_type: sectionKey,
        is_active: true,
      },
    };

    const { data: existing, error: findError } = await supabase
      .from("expo_home_slots")
      .select("id")
      .eq("section_key", sectionKey)
      .order("slot_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { ok: false, error: findError.message, detail: findError },
        { status: 500 }
      );
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from("expo_home_slots")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message, detail: error },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, item: data, content: data.content });
    }

    const { data, error } = await supabase
      .from("expo_home_slots")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data, content: data.content });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "저장 실패",
      },
      { status: 500 }
    );
  }
}