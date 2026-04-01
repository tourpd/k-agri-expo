import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "로그인된 업체 계정이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const name = s(body?.name);
    const categoryPrimary = s(body?.category_primary);
    const region = s(body?.region);
    const contactName = s(body?.contact_name);
    const phone = s(body?.phone);
    const email = s(body?.email);
    const intro = s(body?.intro);
    const description = s(body?.description);
    const youtubeUrl = s(body?.youtube_url);
    const websiteUrl = s(body?.website_url);
    const documentUrl = s(body?.document_url);
    const isPublished = !!body?.is_published;

    if (!name) {
      return NextResponse.json({ ok: false, error: "부스명이 필요합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data: vendor } = await admin
      .from("vendors")
      .select("id,user_id,email,company_name,status,verify_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendor?.id) {
      return NextResponse.json(
        { ok: false, error: "vendor 정보가 없습니다. 먼저 입점 신청을 완료해 주세요." },
        { status: 404 }
      );
    }

    const { data: boothExisting } = await admin
      .from("booths")
      .select("booth_id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const payload = {
      name,
      category_primary: categoryPrimary || null,
      region: region || "대한민국",
      contact_name: contactName || null,
      phone: phone || null,
      email: email || vendor.email || null,
      intro: intro || null,
      description: description || null,
      youtube_url: youtubeUrl || null,
      website_url: websiteUrl || null,
      document_url: documentUrl || null,
      is_published: isPublished,
      status: vendor.verify_status === "approved" ? "active" : "pending",
      vendor_id: vendor.id,
      vendor_user_id: user.id,
      owner_user_id: user.id,
    };

    if (boothExisting?.booth_id) {
      const { error } = await admin
        .from("booths")
        .update(payload)
        .eq("booth_id", boothExisting.booth_id);

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message || "부스 수정에 실패했습니다." },
          { status: 500 }
        );
      }
    } else {
      const { error } = await admin.from("booths").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message || "부스 생성에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "부스 정보가 저장되었습니다.",
    });
  } catch (error: any) {
    console.error("[vendor/booth/save][POST]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "부스 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}