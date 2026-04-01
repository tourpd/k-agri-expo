import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUS = ["draft", "live", "closed"];

function toNullableTrimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptionalNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  try {
    const ok = await isAdminAuthenticated();

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const keyword = (searchParams.get("keyword") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const visibility = (searchParams.get("visibility") || "").trim();

    let query = supabase
      .from("booths")
      .select(`
        booth_id,
        vendor_id,
        name,
        intro,
        description,
        website_url,
        youtube_url,
        hero_image_url,
        logo_url,
        is_public,
        status,
        sponsor_weight,
        manual_boost,
        is_featured,
        campaign_tag,
        updated_at
      `)
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
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "부스 목록 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ok = await isAdminAuthenticated();

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

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
      sponsor_weight,
      manual_boost,
      is_featured,
      campaign_tag,
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
      sponsor_weight?: number;
      manual_boost?: number;
      is_featured?: boolean;
      campaign_tag?: string;
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "업체명/부스명은 필수입니다." },
        { status: 400 }
      );
    }

    const safeStatus =
      typeof status === "string" && ALLOWED_STATUS.includes(status.trim())
        ? status.trim()
        : "draft";

    const { data, error } = await supabase
      .from("booths")
      .insert({
        name: name.trim(),
        region: region?.trim() || null,
        category_primary: category_primary?.trim() || null,
        intro: intro?.trim() || null,
        description: description?.trim() || null,
        is_public: typeof is_public === "boolean" ? is_public : true,
        logo_url: toNullableTrimmedString(logo_url),
        hero_image_url: toNullableTrimmedString(hero_image_url),
        youtube_url: toNullableTrimmedString(youtube_url),
        website_url: toNullableTrimmedString(website_url),
        status: safeStatus,

        sponsor_weight: toOptionalNumber(sponsor_weight, 0),
        manual_boost: toOptionalNumber(manual_boost, 0),
        is_featured: !!is_featured,
        campaign_tag: toNullableTrimmedString(campaign_tag),
      })
      .select("*")
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
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "부스 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}