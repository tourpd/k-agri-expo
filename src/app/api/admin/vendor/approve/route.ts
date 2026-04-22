import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

type ApproveRequestBody = {

  vendor_id?: string;

  status?: string;

};

function safeText(value: unknown) {

  return typeof value === "string" ? value.trim() : "";

}

export async function POST(req: NextRequest) {

  try {

    const supabase = await createSupabaseServerClient();

    const {

      data: { user },

      error: authError,

    } = await supabase.auth.getUser();

    if (authError || !user) {

      return NextResponse.json(

        { ok: false, error: "관리자 로그인이 필요합니다." },

        { status: 401 }

      );

    }

    const body = (await req.json().catch(() => ({}))) as ApproveRequestBody;

    const vendorId = safeText(body.vendor_id);

    const status = safeText(body.status) || "approved";

    if (!vendorId) {

      return NextResponse.json(

        { ok: false, error: "vendor_id가 필요합니다." },

        { status: 400 }

      );

    }

    const admin = createSupabaseAdminClient();

    const now = new Date().toISOString();

    const { data: vendor, error: vendorFindError } = await admin

      .from("vendors")

      .select("id, user_id, email, company_name")

      .eq("id", vendorId)

      .maybeSingle();

    if (vendorFindError) {

      return NextResponse.json(

        { ok: false, error: vendorFindError.message },

        { status: 500 }

      );

    }

    if (!vendor) {

      return NextResponse.json(

        { ok: false, error: "해당 업체를 찾지 못했습니다." },

        { status: 404 }

      );

    }

    const { error: vendorUpdateError } = await admin

      .from("vendors")

      .update({

        status,

        verify_status: "approved",

        approved_at: now,

        updated_at: now,

      })

      .eq("id", vendorId);

    if (vendorUpdateError) {

      return NextResponse.json(

        { ok: false, error: vendorUpdateError.message },

        { status: 500 }

      );

    }

    if (vendor.user_id) {

      const { error: profileError } = await admin

        .from("profiles")

        .upsert(

          {

            user_id: vendor.user_id,

            email: vendor.email ?? null,

            role: "vendor",

            company_name: vendor.company_name ?? null,

            updated_at: now,

          },

          { onConflict: "user_id" }

        );

      if (profileError) {

        return NextResponse.json(

          { ok: false, error: profileError.message },

          { status: 500 }

        );

      }

    }

    return NextResponse.json({

      ok: true,

      message: "업체 승인 처리 완료",

      vendor_id: vendorId,

      status,

    });

  } catch (error: unknown) {

    const message = error instanceof Error ? error.message : "unknown error";

    return NextResponse.json(

      { ok: false, error: message },

      { status: 500 }

    );

  }

}

export async function GET() {

  return NextResponse.json({

    ok: true,

    message: "vendors approve route alive",

  });

}
