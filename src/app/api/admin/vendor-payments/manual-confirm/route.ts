import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function toNumber(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const applicationId = safe(body.application_id);
    const depositAmount = toNumber(body.deposit_amount);
    const depositorName = safe(body.depositor_name);
    const rawText = safe(body.raw_text);

    if (!applicationId) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "application_id가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: app, error: appError } = await supabase
      .from("vendor_applications_v2")
      .select(
        `
        application_id,
        application_code,
        company_name,
        contact_phone,
        phone,
        amount_krw,
        payment_status
        `
      )
      .eq("application_id", applicationId)
      .maybeSingle();

    if (appError) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: appError.message,
        },
        { status: 500 }
      );
    }

    if (!app) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "입점 신청서를 찾지 못했습니다.",
        },
        { status: 404 }
      );
    }

    if (app.payment_status === "confirmed") {
      return NextResponse.json({
        ok: true,
        success: true,
        already_confirmed: true,
        item: {
          application_id: app.application_id,
          application_code: app.application_code,
          company_name: app.company_name,
          contact_phone: app.contact_phone || app.phone,
          amount_krw: app.amount_krw || 0,
          payment_status: app.payment_status,
        },
        message: "이미 입금확인된 신청입니다.",
      });
    }

    const nowIso = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("vendor_applications_v2")
      .update({
        payment_status: "confirmed",
        payment_confirmed: true,
        payment_confirmed_at: nowIso,
        payment_match_source: "manual_sms",
        payment_match_text: rawText || null,
        payment_match_depositor: depositorName || null,
        payment_match_amount: depositAmount || null,
        updated_at: nowIso,
      })
      .eq("application_id", applicationId)
      .select(
        `
        application_id,
        application_code,
        company_name,
        contact_phone,
        phone,
        amount_krw,
        payment_status,
        payment_confirmed_at
        `
      )
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      already_confirmed: false,
      item: {
        application_id: updated?.application_id || app.application_id,
        application_code: updated?.application_code || app.application_code,
        company_name: updated?.company_name || app.company_name,
        contact_phone:
          updated?.contact_phone ||
          updated?.phone ||
          app.contact_phone ||
          app.phone,
        amount_krw: updated?.amount_krw || app.amount_krw || 0,
        payment_status: updated?.payment_status || "confirmed",
        payment_confirmed_at: updated?.payment_confirmed_at || nowIso,
      },
      message: "수동 입금확정 처리되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "수동 입금확정 처리 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}