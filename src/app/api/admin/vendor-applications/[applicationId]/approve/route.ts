import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .slice(0, 60);
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await ctx.params;
    const admin = createSupabaseAdminClient();

    const { data: application, error: appError } = await admin
      .from("vendor_applications")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (appError) {
      return NextResponse.json(
        { ok: false, error: appError.message },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { ok: false, error: "입점 신청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (application.status === "approved" && application.booth_id) {
      return NextResponse.json({
        ok: true,
        booth_id: application.booth_id,
        message: "이미 승인된 신청입니다.",
      });
    }

    const boothName = application.company_name;
    const boothSlug = slugify(application.company_name);

    const { data: booth, error: boothError } = await admin
      .from("booths")
      .insert({
        vendor_id: application.user_id,
        owner_user_id: application.user_id,
        name: boothName,
        slug: boothSlug,
        intro: application.company_intro ?? "",
        category_primary: application.category_primary ?? null,
        region: null,
        status: "active",
      })
      .select("booth_id")
      .single();

    if (boothError) {
      return NextResponse.json(
        { ok: false, error: boothError.message },
        { status: 500 }
      );
    }

    const { error: appUpdateError } = await admin
      .from("vendor_applications")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        booth_id: booth.booth_id,
      })
      .eq("application_id", applicationId);

    if (appUpdateError) {
      return NextResponse.json(
        { ok: false, error: appUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      booth_id: booth.booth_id,
      message: "승인 완료. 부스가 자동 생성되었습니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}