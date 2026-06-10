import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function nullable(value: unknown) {
  const s = safe(value);
  return s ? s : null;
}

function slugify(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || `brand-${Date.now()}`;
}

async function findApplication(supabase: any, applicationId: string) {
  const byApplicationId = await supabase
    .from("vendor_applications_v2")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!byApplicationId.error && byApplicationId.data) {
    return byApplicationId.data;
  }

  const byId = await supabase
    .from("vendor_applications_v2")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return byId.data;
  }

  throw new Error(
    byApplicationId.error?.message ||
      byId.error?.message ||
      "신청 데이터를 찾을 수 없습니다."
  );
}

async function makeUniqueSlug(supabase: any, baseSlug: string) {
  let slug = baseSlug;

  for (let i = 0; i < 20; i += 1) {
    const { data, error } = await supabase
      .from("expo_brands")
      .select("brand_id, id, brand_slug")
      .eq("brand_slug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return slug;

    slug = `${baseSlug}-${i + 2}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function findExistingBrand(supabase: any, application: any) {
  const applicationId = safe(application.application_id || application.id);
  const brandSlug = safe(application.brand_slug);
  const provisionedBrandId = safe(application.provisioned_brand_id);

  if (provisionedBrandId) {
    const { data, error } = await supabase
      .from("expo_brands")
      .select("*")
      .or(`brand_id.eq.${provisionedBrandId},id.eq.${provisionedBrandId}`)
      .maybeSingle();

    if (!error && data) return data;
  }

  if (brandSlug) {
    const { data, error } = await supabase
      .from("expo_brands")
      .select("*")
      .eq("brand_slug", brandSlug)
      .maybeSingle();

    if (!error && data) return data;
  }

  if (applicationId) {
    const { data, error } = await supabase
      .from("expo_brands")
      .select("*")
      .eq("vendor_application_id", applicationId)
      .maybeSingle();

    if (!error && data) return data;
  }

  return null;
}

async function createBrand(supabase: any, application: any, brandSlug: string, now: string) {
  const applicationId = safe(application.application_id || application.id);
  const companyName = safe(application.company_name) || "이름없는 업체";

  const fullPayload: Record<string, unknown> = {
    vendor_application_id: applicationId,
    brand_slug: brandSlug,
    brand_name: companyName,
    company_name: companyName,
    short_description:
      nullable(application.company_intro) ||
      nullable(application.intro) ||
      "K-Agri Expo 입점 브랜드입니다.",
    main_category: nullable(application.preferred_category),
    main_crops: nullable(application.main_crops),
    logo_url: nullable(application.logo_url),
    banner_url: nullable(application.banner_url),
    youtube_url: nullable(application.youtube_url),
    homepage_url: nullable(application.homepage_url),
    is_active: true,
    onboarding_status: "needs_setup",
    setup_step: "brand_profile",
    created_at: now,
    updated_at: now,
  };

  const minimalPayload: Record<string, unknown> = {
    brand_slug: brandSlug,
    brand_name: companyName,
    short_description:
      nullable(application.company_intro) ||
      nullable(application.intro) ||
      "K-Agri Expo 입점 브랜드입니다.",
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const first = await supabase
    .from("expo_brands")
    .insert(fullPayload)
    .select("*")
    .single();

  if (!first.error && first.data) {
    return first.data;
  }

  console.error("[approve] expo_brands full insert failed:", first.error);

  const second = await supabase
    .from("expo_brands")
    .insert(minimalPayload)
    .select("*")
    .single();

  if (!second.error && second.data) {
    return second.data;
  }

  throw new Error(
    second.error?.message ||
      first.error?.message ||
      "expo_brands 브랜드관 생성 실패"
  );
}

async function updateApplicationApproved(
  supabase: any,
  application: any,
  brand: any,
  brandSlug: string,
  now: string
) {
  const applicationId = safe(application.application_id || application.id);

  const brandId = brand?.brand_id || brand?.id || null;

  const patch: Record<string, unknown> = {
    application_status: "approved",
    status: "approved",
    approved_at: application.approved_at || now,
    provision_status: "brand_created",
    provisioned_brand_id: brandId,
    brand_slug: brandSlug,
    vendor_next_step: "brand_hall_setup",
    vendor_onboarding_status: "needs_setup",
    vendor_onboarding_message:
      "브랜드관 로고, 배너, 회사소개, 제품, 이벤트를 등록해주세요.",
    updated_at: now,
  };

  const byApplicationId = await supabase
    .from("vendor_applications_v2")
    .update(patch)
    .eq("application_id", applicationId)
    .select("*")
    .maybeSingle();

  if (!byApplicationId.error && byApplicationId.data) {
    return byApplicationId.data;
  }

  const byId = await supabase
    .from("vendor_applications_v2")
    .update(patch)
    .eq("id", applicationId)
    .select("*")
    .maybeSingle();

  if (!byId.error && byId.data) {
    return byId.data;
  }

  throw new Error(
    byApplicationId.error?.message ||
      byId.error?.message ||
      "신청 승인 상태 업데이트에 실패했습니다."
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json();

    const applicationId = safe(body.application_id || body.applicationId);

    if (!applicationId) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "application_id 값이 필요합니다.",
        },
        { status: 400 }
      );
    }

    const application = await findApplication(supabase, applicationId);

    const amount = Number(application.amount_krw || application.amount || 0);
    const isPaid =
      application.payment_status === "confirmed" ||
      application.payment_confirmed === true ||
      amount === 0;

    if (!isPaid) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "유료 신청은 입금 확인 후 승인할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const existingBrand = await findExistingBrand(supabase, application);

    if (existingBrand) {
      const existingSlug = safe(existingBrand.brand_slug || application.brand_slug);
      const updatedApplication = await updateApplicationApproved(
        supabase,
        application,
        existingBrand,
        existingSlug,
        now
      );

      return NextResponse.json(
        {
          ok: true,
          success: true,
          reused: true,
          message: "이미 생성된 브랜드관을 연결하고 승인 처리했습니다.",
          application: updatedApplication,
          brand: existingBrand,
          brand_url: existingSlug ? `/expo/brands/${existingSlug}` : null,
          vendor_next_url: "/vendor/brand-hall",
        },
        { status: 200 }
      );
    }

    const companyName = safe(application.company_name) || "이름없는 업체";
    const baseSlug = slugify(companyName);
    const brandSlug = await makeUniqueSlug(supabase, baseSlug);

    const brand = await createBrand(supabase, application, brandSlug, now);

    const updatedApplication = await updateApplicationApproved(
      supabase,
      application,
      brand,
      brandSlug,
      now
    );

    return NextResponse.json(
      {
        ok: true,
        success: true,
        reused: false,
        message: "승인 및 브랜드관 생성 완료",
        application: updatedApplication,
        brand,
        brand_url: `/expo/brands/${brandSlug}`,
        vendor_next_url: "/vendor/brand-hall",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "승인 및 브랜드관 생성 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}