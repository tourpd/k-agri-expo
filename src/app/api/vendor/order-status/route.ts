import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalizeString(value: string | null) {
  return (value || "").trim();
}

function onlyDigits(value: string | null) {
  return (value || "").replace(/[^\d]/g, "");
}

export async function GET(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return jsonError("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.", 500);
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.", 500);
    }

    const { searchParams } = new URL(req.url);

    const applicationCode = normalizeString(searchParams.get("application_code"));
    const applicationId = normalizeString(searchParams.get("application_id"));
    const phone = onlyDigits(searchParams.get("phone"));

    if (!applicationCode && !applicationId) {
      return jsonError("신청번호 또는 내부 신청번호가 필요합니다.");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let query = supabase
      .from("vendor_applications_v2")
      .select(`
        application_id,
        application_code,
        company_name,
        representative_name,
        phone,
        email,
        booth_type,
        duration_key,
        amount_krw,
        status,
        payment_confirmed,
        payment_confirmed_at,
        approved_at,
        rejected_at,
        rejection_reason,
        provision_status,
        provision_result,
        provisioned_booth_id,
        created_at
      `);

    if (applicationCode) {
      query = query.eq("application_code", applicationCode);
    } else {
      query = query.eq("application_id", applicationId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return jsonError(error.message || "신청 상태 조회 중 오류가 발생했습니다.", 500);
    }

    if (!data) {
      return jsonError("일치하는 신청 정보를 찾지 못했습니다.", 404);
    }

    const savedPhoneDigits = onlyDigits(data.phone || "");

    if (phone && savedPhoneDigits && phone !== savedPhoneDigits) {
      return jsonError("연락처가 일치하지 않습니다.", 403);
    }

    return Response.json({
      success: true,
      item: {
        application_id: data.application_id,
        application_code: data.application_code,
        company_name: data.company_name,
        representative_name: data.representative_name,
        phone: data.phone,
        email: data.email,
        booth_type: data.booth_type,
        duration_key: data.duration_key,
        amount_krw: data.amount_krw,
        status: data.status,
        payment_confirmed: data.payment_confirmed,
        payment_confirmed_at: data.payment_confirmed_at,
        approved_at: data.approved_at,
        rejected_at: data.rejected_at,
        rejection_reason: data.rejection_reason,
        provision_status: data.provision_status,
        provision_result: data.provision_result,
        provisioned_booth_id: data.provisioned_booth_id,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "신청 상태 조회 중 오류가 발생했습니다.",
      500
    );
  }
}