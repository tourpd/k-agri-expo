import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const userId = s(body?.userId);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: vendor, error: vendorError } = await admin
      .from("vendors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (vendorError) {
      return NextResponse.json(
        { ok: false, error: vendorError.message || "vendors 조회 실패" },
        { status: 500 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { ok: false, error: "vendor를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: appRow, error: appError } = await admin
      .from("vendor_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      return NextResponse.json(
        { ok: false, error: appError.message || "신청서 조회 실패" },
        { status: 500 }
      );
    }

    if (!appRow) {
      return NextResponse.json(
        { ok: false, error: "입점 신청서가 없습니다." },
        { status: 404 }
      );
    }

    let boothId: string | null = null;

    const { data: existingBooth } = await admin
      .from("booths")
      .select("booth_id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (existingBooth?.booth_id) {
      boothId = existingBooth.booth_id;
    } else {
      const boothName = appRow.company_name || vendor.company_name || "업체 부스";
      const slugBase = slugify(boothName) || `vendor-${userId.slice(0, 8)}`;

      const { data: booth, error: boothError } = await admin
        .from("booths")
        .insert({
          owner_user_id: userId,
          vendor_id: vendor.id ?? null,
          name: boothName,
          slug: `${slugBase}-${userId.slice(0, 6)}`,
          intro: appRow.intro || "",
          category_primary: appRow.category_primary || null,
          status: "active",
        })
        .select("booth_id")
        .single();

      if (boothError) {
        return NextResponse.json(
          { ok: false, error: boothError.message || "부스 생성 실패" },
          { status: 500 }
        );
      }

      boothId = booth.booth_id;
    }

    const { error: vendorUpdateError } = await admin
      .from("vendors")
      .update({
        status: "approved",
        verify_status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (vendorUpdateError) {
      return NextResponse.json(
        { ok: false, error: vendorUpdateError.message || "vendors 승인 처리 실패" },
        { status: 500 }
      );
    }

    const { error: appUpdateError } = await admin
      .from("vendor_applications")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        booth_id: boothId,
        updated_at: new Date().toISOString(),
      })
      .eq("application_id", appRow.application_id);

    if (appUpdateError) {
      return NextResponse.json(
        { ok: false, error: appUpdateError.message || "신청서 승인 처리 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      boothId,
      message: "승인 완료. 부스가 열렸습니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}