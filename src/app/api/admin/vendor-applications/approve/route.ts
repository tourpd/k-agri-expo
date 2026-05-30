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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const applicationId = safe(body.application_id);

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "application_id가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: app, error: appError } = await supabase
      .from("vendor_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError || !app) {
      return NextResponse.json(
        { success: false, error: appError?.message || "입점 신청서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const companyName =
      safe(app.company_name) ||
      safe(app.brand_name) ||
      safe(app.contact_name) ||
      "새 브랜드";

    const baseSlug = slugify(companyName) || `brand-${applicationId.slice(0, 8)}`;

    let finalSlug = baseSlug;

    for (let i = 0; i < 20; i += 1) {
      const slug = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;

      const { data: exists } = await supabase
        .from("expo_brands")
        .select("id")
        .eq("brand_slug", slug)
        .maybeSingle();

      if (!exists?.id) {
        finalSlug = slug;
        break;
      }
    }

    const { data: brand, error: brandError } = await supabase
      .from("expo_brands")
      .insert({
        brand_slug: finalSlug,
        brand_name: companyName,
        company_name: companyName,
        contact_name: safe(app.contact_name),
        phone: safe(app.phone),
        email: safe(app.email),
        main_category: safe(app.hall_name) || safe(app.preferred_hall) || "미분류",
        main_crops: safe(app.main_crops),
        short_description:
          safe(app.short_description) ||
          safe(app.memo) ||
          `${companyName} 브랜드관입니다.`,
        is_active: true,
        application_id: applicationId,
      })
      .select("*")
      .single();

    if (brandError) {
      return NextResponse.json(
        { success: false, error: brandError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("vendor_applications")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        brand_id: brand.id,
      })
      .eq("id", applicationId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
      brand_url: `/expo/brands/${finalSlug}`,
      message: "입점 승인 및 브랜드관 생성 완료",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "입점 승인 처리 실패" },
      { status: 500 }
    );
  }
}