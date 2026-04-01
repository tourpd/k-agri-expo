import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(req: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boothId = safe(searchParams.get("booth_id"));

    if (!boothId) {
      return NextResponse.json({ ok: false, error: "booth_id가 없습니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("booths")
      .select(`
        booth_id,
        name,
        category_primary,
        region,
        contact_name,
        phone,
        email,
        intro,
        description,
        youtube_url,
        video_url,
        youtube_link,
        thumbnail_url,
        catalog_url,
        logo_url,
        cover_image_url
      `)
      .eq("booth_id", boothId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "부스를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, booth: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 401 });
    }

    const body = await req.json();

    const boothId = safe(body.booth_id);
    if (!boothId) {
      return NextResponse.json({ ok: false, error: "booth_id가 없습니다." }, { status: 400 });
    }

    const payload = {
      name: safe(body.name) || null,
      category_primary: safe(body.category_primary) || null,
      region: safe(body.region) || null,
      contact_name: safe(body.contact_name) || null,
      phone: safe(body.phone) || null,
      email: safe(body.email) || null,
      intro: safe(body.intro) || null,
      description: safe(body.description) || null,
      youtube_url: safe(body.youtube_url) || null,
      video_url: safe(body.video_url) || null,
      youtube_link: safe(body.youtube_link) || null,
      thumbnail_url: safe(body.thumbnail_url) || null,
      catalog_url: safe(body.catalog_url) || null,
      logo_url: safe(body.logo_url) || null,
      cover_image_url: safe(body.cover_image_url) || null,
    };

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("booths")
      .update(payload)
      .eq("booth_id", boothId)
      .select(`
        booth_id,
        name,
        category_primary,
        region,
        contact_name,
        phone,
        email,
        intro,
        description,
        youtube_url,
        video_url,
        youtube_link,
        thumbnail_url,
        catalog_url,
        logo_url,
        cover_image_url
      `)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      booth: data,
      message: "부스 정보가 저장되었습니다.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 }
    );
  }
}