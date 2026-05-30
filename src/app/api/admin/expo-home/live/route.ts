import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_home_slots")
      .select("*")
      .eq("section_key", "live_show")
      .order("slot_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[expo-home/live][GET]", error);
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data || null });
  } catch (error) {
    console.error("[expo-home/live][GET fatal]", error);
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
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const payload = {
      title: safe(body.title) || "K-Agri 월간 라이브 쇼",
      subtitle: safe(body.subtitle),
      description: safe(body.description),

      featured_title: safe(body.featured_title),
      featured_desc: safe(body.featured_desc),
      featured_video_url: safe(body.featured_video_url),

      date_text: safe(body.date_text),
      participant_text: safe(body.participant_text),

      cta_label: safe(body.cta_label) || "라이브쇼 상세 보기",
      cta_link: safe(body.cta_link) || "/expo/live",

      secondary_cta_label: safe(body.secondary_cta_label) || "이벤트 참여하기",
      secondary_cta_link: safe(body.secondary_cta_link) || "/expo/event",

      section_key: "live_show",
      is_active: true,
    };

    const { data: existing, error: findError } = await supabase
      .from("expo_home_slots")
      .select("id")
      .eq("section_key", "live_show")
      .order("slot_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("[expo-home/live][findError]", findError);
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
        console.error("[expo-home/live][updateError]", error);
        return NextResponse.json(
          { ok: false, error: error.message, detail: error },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, item: data });
    }

    const { data, error } = await supabase
      .from("expo_home_slots")
      .insert({
        ...payload,
        slot_order: 1,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[expo-home/live][insertError]", error);
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error("[expo-home/live][POST fatal]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "저장 실패",
      },
      { status: 500 }
    );
  }
}