import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyBusinessOfficial } from "@/lib/bizVerify";

function looksValidBizNo(v: string) {
  return /^\d{10}$/.test((v || "").replace(/\D/g, ""));
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const applicationId = String(body?.application_id || "").trim();

    if (!applicationId) {
      return Response.json(
        { ok: false, error: "application_id required" },
        { status: 400 }
      );
    }

    const { data: app, error: appError } = await supabase
      .from("vendor_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      return Response.json(
        { ok: false, error: appError?.message || "신청서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const basicPass =
      looksValidBizNo(app.biz_no) &&
      !!String(app.company_name || "").trim() &&
      !!String(app.ceo_name || "").trim() &&
      !!String(app.business_license_file_url || "").trim();

    if (!basicPass) {
      const verificationResult = {
        basic_pass: false,
        checked_at: new Date().toISOString(),
        note: "기본 입력값 검증 실패",
      };

      await supabase
        .from("vendor_applications")
        .update({
          verification_source: "basic-validator",
          verification_result: verificationResult,
          review_status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      return Response.json({
        ok: true,
        review_status: "rejected",
        verification_result: verificationResult,
      });
    }

    const mode = process.env.BIZ_VERIFY_MODE || "official";

    if (mode === "official") {
      const official = await verifyBusinessOfficial({
        bizNo: app.biz_no,
        ceoName: app.ceo_name,
        openDate: app.open_date || "",
      });

      const reviewStatus = official.ok ? "auto_verified" : "manual_review";

      const verificationResult = {
        basic_pass: true,
        official_ok: official.ok,
        status: official.status || "",
        tax_type: official.taxType || "",
        valid_match: official.validMatch || false,
        checked_at: new Date().toISOString(),
        reason: official.reason || null,
        raw: official.raw,
      };

      await supabase
        .from("vendor_applications")
        .update({
          verification_source: official.source,
          verification_result: verificationResult,
          review_status: reviewStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      return Response.json({
        ok: true,
        review_status: reviewStatus,
        verification_result: verificationResult,
      });
    }

    const verificationResult = {
      basic_pass: true,
      checked_at: new Date().toISOString(),
      note: "공식 검증 비활성화 상태. 수동 검토로 보냄.",
    };

    await supabase
      .from("vendor_applications")
      .update({
        verification_source: "basic-validator",
        verification_result: verificationResult,
        review_status: "manual_review",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    return Response.json({
      ok: true,
      review_status: "manual_review",
      verification_result: verificationResult,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "검증 오류" },
      { status: 500 }
    );
  }
}