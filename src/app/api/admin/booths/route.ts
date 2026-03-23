import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = (searchParams.get("keyword") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const visibility = (searchParams.get("visibility") || "").trim();

    let query = supabase
      .from("booths")
      .select("*")
      .order("updated_at", { ascending: false });

    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,region.ilike.%${keyword}%,category_primary.ilike.%${keyword}%,intro.ilike.%${keyword}%,description.ilike.%${keyword}%`
      );
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (visibility === "public") {
      query = query.eq("is_public", true);
    }

    if (visibility === "private") {
      query = query.eq("is_public", false);
    }

    const { data, error } = await query.limit(500);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booths: data || [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "부스 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      region,
      category_primary,
      intro,
      description,
      is_public,
      logo_url,
      hero_image_url,
      youtube_url,
      website_url,
      status,
    }: {
      name?: string;
      region?: string;
      category_primary?: string;
      intro?: string;
      description?: string;
      is_public?: boolean;
      logo_url?: string;
      hero_image_url?: string;
      youtube_url?: string;
      website_url?: string;
      status?: string;
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "업체명/부스명은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("booths")
      .insert({
        name: name.trim(),
        region: region?.trim() || null,
        category_primary: category_primary?.trim() || null,
        intro: intro?.trim() || null,
        description: description?.trim() || null,
        is_public: typeof is_public === "boolean" ? is_public : true,
        logo_url: logo_url?.trim() || null,
        hero_image_url: hero_image_url?.trim() || null,
        youtube_url: youtube_url?.trim() || null,
        website_url: website_url?.trim() || null,
        status: status?.trim() || "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booth: data,
      message: "부스가 생성되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "부스 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}