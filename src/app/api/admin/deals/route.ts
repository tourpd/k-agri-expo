import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const active = (searchParams.get("active") || "").trim();

    let query = supabase
      .from("booth_deals")
      .select(`
        id,
        booth_id,
        title,
        description,
        deal_url,
        is_active,
        sponsor_weight,
        manual_boost,
        is_featured,
        campaign_tag,
        crop_tags,
        issue_tags,
        category_tags,
        updated_at
      `)
      .order("updated_at", { ascending: false });

    if (keyword) {
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,booth_id.ilike.%${keyword}%,campaign_tag.ilike.%${keyword}%`
      );
    }

    if (active === "active") {
      query = query.eq("is_active", true);
    }

    if (active === "inactive") {
      query = query.eq("is_active", false);
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
      deals: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "딜 목록 조회 중 오류가 발생했습니다.",
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
      booth_id,
      title,
      description,
      deal_url,
      is_active,
      sponsor_weight,
      manual_boost,
      is_featured,
      campaign_tag,
    }: {
      booth_id?: string;
      title?: string;
      description?: string;
      deal_url?: string;
      is_active?: boolean;
      sponsor_weight?: number;
      manual_boost?: number;
      is_featured?: boolean;
      campaign_tag?: string;
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "딜 제목은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("booth_deals")
      .insert({
        booth_id: booth_id?.trim() || null,
        title: title.trim(),
        description: description?.trim() || null,
        deal_url: toNullableTrimmedString(deal_url),
        is_active: typeof is_active === "boolean" ? is_active : true,
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
      deal: data,
      message: "딜이 생성되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "딜 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}