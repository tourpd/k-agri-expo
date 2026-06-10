import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function slugify(v: string) {
  return safe(v)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getPlanType(app: any) {
  return safe(app?.source_extracted_json?.plan_type) || safe(app?.plan_type);
}

function getPlanLabel(planType: string, boothType?: string | null) {
  if (planType === "free") return "무료 체험";
  if (planType === "bronze") return "브론즈";
  if (planType === "silver") return "실버";
  if (planType === "gold") return "골드";
  if (planType === "enterprise") return "엔터프라이즈";

  const booth = safe(boothType);
  if (booth === "free") return "무료 체험";
  if (booth === "basic") return "일반";
  if (booth === "premium") return "프리미엄";

  return "일반";
}

function getBrandDescription(app: any, companyName: string) {
  return (
    safe(app.company_intro) ||
    safe(app.intro) ||
    safe(app.short_description) ||
    `${companyName} 브랜드관입니다.`
  );
}

function getHallKey(app: any) {
  return (
    safe(app.assigned_hall) ||
    safe(app.preferred_hall_1) ||
    "crop-nutrition"
  );
}

async function makeUniqueSlug(
  supabase: any,
  companyName: string,
  applicationId: string
) {
  const baseSlug = slugify(companyName) || `brand-${applicationId.slice(0, 8)}`;

  for (let i = 0; i < 20; i += 1) {
    const slug = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;

    const { data } = await supabase
      .from("expo_brands")
      .select("id")
      .eq("brand_slug", slug)
      .maybeSingle();

    if (!data?.id) return slug;
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const applicationId = safe(body.application_id);

    if (!applicationId) {
      return NextResponse.json(
        { success: false, ok: false, error: "application_id가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: app, error: appError } = await supabase
      .from("vendor_applications_v2")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (appError || !app) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: appError?.message || "입점 신청서를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const companyName =
      safe(app.company_name) ||
      safe(app.brand_name) ||
      safe(app.contact_name) ||
      safe(app.representative_name) ||
      "새 브랜드";

    const finalSlug = await makeUniqueSlug(supabase, companyName, applicationId);

    const planType = getPlanType(app);
    const resolvedPlanLabel = getPlanLabel(planType, app.booth_type);
    const nowIso = new Date().toISOString();

    const brandPayload = {
      vendor_id: app.provisioned_vendor_id || null,
      hall_key: getHallKey(app),

      brand_name: companyName,
      brand_slug: finalSlug,

      logo_url: null,
      banner_url: null,

      short_description: getBrandDescription(app, companyName),

      main_crop: null,
      main_crops: "",
      main_category: safe(app.preferred_category) || "기타",

      youtube_url: safe(app.youtube_url) || null,
      homepage_url: safe(app.website_url) || null,

      is_featured: false,
      is_active: true,
      sort_order: 0,

      vendor_plan: planType || safe(app.booth_type) || "basic",

      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: brand, error: brandError } = await supabase
      .from("expo_brands")
      .insert(brandPayload)
      .select("*")
      .single();

    if (brandError) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: brandError.message,
          payload: brandPayload,
        },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("vendor_applications_v2")
      .update({
        status: "approved",
        application_status: "approved",
        approved_at: nowIso,
        reviewed_at: app.reviewed_at || nowIso,
        booth_progress_status: "assigned",
        provision_status: "completed",
        provisioned_at: nowIso,
        provision_result: `브랜드관 생성 완료: /expo/brands/${finalSlug}`,
        provisioned_booth_id: brand.id,
        updated_at: nowIso,
      })
      .eq("application_id", applicationId);

    if (updateError) {
      return NextResponse.json(
        { success: false, ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ok: true,
      brand,
      brand_url: `/expo/brands/${finalSlug}`,
      plan_type: planType,
      plan_label: resolvedPlanLabel,
      message: "입점 승인 및 브랜드관 생성 완료",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: e?.message || "입점 승인 처리 실패",
      },
      { status: 500 }
    );
  }
}