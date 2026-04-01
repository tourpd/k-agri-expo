import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalizeString(value: string | null) {
  return (value || "").trim();
}

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return jsonError("관리자 로그인이 필요합니다.", 401);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!adminEmail || session.email.toLowerCase() !== adminEmail) {
      return jsonError("관리자 권한이 없습니다.", 403);
    }

    const { searchParams } = new URL(req.url);
    const status = normalizeString(searchParams.get("status"));
    const q = normalizeString(searchParams.get("q"));
    const payment = normalizeString(searchParams.get("payment"));

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("vendor_applications_v2")
      .select(`
        application_id,
        application_code,
        company_name,
        representative_name,
        email,
        phone,
        tax_email,
        business_number,
        open_date,
        business_address,
        biz_type,
        biz_item,
        booth_type,
        duration_key,
        duration_months,
        amount_krw,
        product_code,
        category_primary,
        company_intro,
        website_url,
        youtube_url,
        brochure_url,
        source_file_name,
        source_file_mime,
        business_license_bucket,
        business_license_path,
        status,
        admin_note,
        rejection_reason,
        payment_confirmed,
        payment_confirmed_at,
        payment_confirmed_by_email,
        approved_at,
        approved_by_email,
        rejected_at,
        rejected_by_email,
        provision_status,
        provision_result,
        provisioned_vendor_id,
        provisioned_booth_id,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    if (payment === "paid") {
      query = query.eq("payment_confirmed", true);
    }

    if (payment === "unpaid") {
      query = query.eq("payment_confirmed", false);
    }

    if (q) {
      query = query.or(
        [
          `application_code.ilike.%${q}%`,
          `company_name.ilike.%${q}%`,
          `representative_name.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
          `business_number.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data, error } = await query.limit(300);

    if (error) {
      return jsonError(error.message || "신청 목록 조회 중 오류가 발생했습니다.", 500);
    }

    return Response.json({
      success: true,
      items: data || [],
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "신청 목록 조회 중 오류가 발생했습니다.",
      500
    );
  }
}