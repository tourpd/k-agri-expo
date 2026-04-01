import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  id?: number | string;
  title?: string;
  description?: string;
  prize_text?: string;
  hero_image_url?: string;
  hero_video_url?: string;
  primary_button_text?: string;
  primary_button_link?: string;
  secondary_button_text?: string;
  secondary_button_link?: string;
  is_active?: boolean;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const supabase = createSupabaseAdminClient();

    const id = Number(body.id || 1);

    const title = clean(body.title);
    const description = clean(body.description) || null;
    const prizeText = clean(body.prize_text) || null;
    const heroImageUrl = clean(body.hero_image_url) || null;
    const heroVideoUrl = clean(body.hero_video_url) || null;
    const primaryButtonText = clean(body.primary_button_text) || null;
    const primaryButtonLink = clean(body.primary_button_link) || null;
    const secondaryButtonText = clean(body.secondary_button_text) || null;
    const secondaryButtonLink = clean(body.secondary_button_link) || null;
    const isActive =
      typeof body.is_active === "boolean" ? body.is_active : true;

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "title is required" },
        { status: 400 }
      );
    }

    const payload = {
      id,
      title,
      description,
      prize_text: prizeText,
      hero_image_url: heroImageUrl,
      hero_video_url: heroVideoUrl,
      primary_button_text: primaryButtonText,
      primary_button_link: primaryButtonLink,
      secondary_button_text: secondaryButtonText,
      secondary_button_link: secondaryButtonLink,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("expo_events")
      .upsert(payload, { onConflict: "id" })
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
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed to update event" },
      { status: 500 }
    );
  }
}