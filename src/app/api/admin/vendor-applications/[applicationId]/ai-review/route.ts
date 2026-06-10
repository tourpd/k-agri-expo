import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewCode =
  | "auto_approve_possible"
  | "needs_review"
  | "missing_document"
  | "payment_pending"
  | "duplicate_suspected"
  | "reject_recommended"
  | "approved";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function normalizePhone(v: unknown) {
  return safe(v).replace(/\D/g, "");
}

function normalizeBusinessNumber(v: unknown) {
  return safe(v).replace(/\D/g, "");
}

function getAmount(app: any) {
  return Number(app?.amount_krw || app?.amount || 0);
}

function makeResult(params: {
  code: ReviewCode;
  label: string;
  severity: "green" | "blue" | "amber" | "red";
  score: number;
  reasons: string[];
  recommendation: string;
  can_auto_approve: boolean;
  duplicate_count?: number;
  duplicate_items?: any[];
}) {
  return {
    ok: true,
    success: true,
    review: {
      code: params.code,
      label: params.label,
      severity: params.severity,
      score: params.score,
      reasons: params.reasons,
      recommendation: params.recommendation,
      can_auto_approve: params.can_auto_approve,
      duplicate_count: params.duplicate_count || 0,
      duplicate_items: params.duplicate_items || [],
      reviewed_at: new Date().toISOString(),
    },
  };
}

async function findApplication(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  applicationId: string
) {
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

async function findDuplicates(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  app: any
) {
  const applicationId = safe(app.application_id);
  const id = safe(app.id);
  const businessNumber = normalizeBusinessNumber(app.business_number);
  const email = safe(app.contact_email || app.email).toLowerCase();
  const phone = normalizePhone(app.contact_phone || app.phone);
  const companyName = safe(app.company_name);

  const duplicateItems: any[] = [];

  if (businessNumber) {
    const { data } = await supabase
      .from("vendor_applications_v2")
      .select(
        "id, application_id, company_name, business_number, contact_phone, phone, contact_email, email, application_status, created_at"
      )
      .eq("business_number", app.business_number)
      .limit(10);

    if (data?.length) duplicateItems.push(...data);
  }

  if (email) {
    const { data } = await supabase
      .from("vendor_applications_v2")
      .select(
        "id, application_id, company_name, business_number, contact_phone, phone, contact_email, email, application_status, created_at"
      )
      .or(`contact_email.eq.${email},email.eq.${email}`)
      .limit(10);

    if (data?.length) duplicateItems.push(...data);
  }

  if (companyName) {
    const { data } = await supabase
      .from("vendor_applications_v2")
      .select(
        "id, application_id, company_name, business_number, contact_phone, phone, contact_email, email, application_status, created_at"
      )
      .eq("company_name", companyName)
      .limit(10);

    if (data?.length) duplicateItems.push(...data);
  }

  const deduped = new Map<string, any>();

  for (const row of duplicateItems) {
    const rowKey = safe(row.application_id || row.id);
    if (!rowKey) continue;

    if (rowKey === applicationId || rowKey === id) continue;

    const rowPhone = normalizePhone(row.contact_phone || row.phone);
    const rowEmail = safe(row.contact_email || row.email).toLowerCase();
    const rowBiz = normalizeBusinessNumber(row.business_number);
    const rowCompany = safe(row.company_name);

    const matched =
      (businessNumber && rowBiz === businessNumber) ||
      (email && rowEmail === email) ||
      (phone && rowPhone === phone) ||
      (companyName && rowCompany === companyName);

    if (matched) {
      deduped.set(rowKey, row);
    }
  }

  return Array.from(deduped.values());
}

async function saveReviewToApplication(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  applicationId: string,
  review: any
) {
  const patch = {
    ai_review_code: review.code,
    ai_review_label: review.label,
    ai_review_severity: review.severity,
    ai_review_score: review.score,
    ai_review_reasons: review.reasons,
    ai_review_recommendation: review.recommendation,
    ai_can_auto_approve: review.can_auto_approve,
    ai_reviewed_at: review.reviewed_at,
    updated_at: new Date().toISOString(),
  };

  const updateByApplicationId = await supabase
    .from("vendor_applications_v2")
    .update(patch)
    .eq("application_id", applicationId)
    .select("id, application_id")
    .maybeSingle();

  if (!updateByApplicationId.error && updateByApplicationId.data) {
    return;
  }

  await supabase
    .from("vendor_applications_v2")
    .update(patch)
    .eq("id", applicationId)
    .select("id, application_id")
    .maybeSingle();
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;

    if (!applicationId) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "applicationId가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const app = await findApplication(supabase, applicationId);
    const duplicates = await findDuplicates(supabase, app);

    const reasons: string[] = [];
    const amount = getAmount(app);

    if (!safe(app.company_name)) reasons.push("업체명이 없습니다.");
    if (!safe(app.business_number)) reasons.push("사업자등록번호가 없습니다.");
    if (!safe(app.contact_name)) reasons.push("담당자명이 없습니다.");
    if (!safe(app.contact_phone || app.phone)) reasons.push("전화번호가 없습니다.");
    if (!safe(app.contact_email || app.email)) reasons.push("이메일이 없습니다.");
    if (!safe(app.preferred_hall_1)) reasons.push("희망관이 없습니다.");
    if (!safe(app.preferred_category)) reasons.push("희망 카테고리가 없습니다.");

    const hasDocument =
      !!safe(app.source_file_name) ||
      !!safe(app.business_license_path) ||
      !!safe(app.business_license_url);

    if (!hasDocument) reasons.push("사업자등록증이 없습니다.");

    const isPaid =
      app.payment_status === "confirmed" ||
      app.payment_confirmed === true ||
      amount === 0;

    if (!isPaid) reasons.push("입금 확인이 필요합니다.");

    if (duplicates.length > 0) {
      reasons.push(`중복 신청 가능성이 있습니다. (${duplicates.length}건)`);
    }

    let result = makeResult({
      code: "needs_review",
      label: "확인필요",
      severity: "blue",
      score: 70,
      reasons,
      recommendation: "관리자가 내용을 확인한 뒤 승인 여부를 결정하세요.",
      can_auto_approve: false,
      duplicate_count: duplicates.length,
      duplicate_items: duplicates,
    });

    if (app.application_status === "approved") {
      result = makeResult({
        code: "approved",
        label: "승인완료",
        severity: "green",
        score: 100,
        reasons: ["이미 승인된 신청입니다."],
        recommendation: "브랜드관 생성 및 업체 안내 상태를 확인하세요.",
        can_auto_approve: false,
        duplicate_count: duplicates.length,
        duplicate_items: duplicates,
      });
    } else if (!hasDocument) {
      result = makeResult({
        code: "missing_document",
        label: "서류누락",
        severity: "red",
        score: 25,
        reasons,
        recommendation: "사업자등록증 제출을 요청하거나 반려 처리하세요.",
        can_auto_approve: false,
        duplicate_count: duplicates.length,
        duplicate_items: duplicates,
      });
    } else if (duplicates.length > 0) {
      result = makeResult({
        code: "duplicate_suspected",
        label: "중복의심",
        severity: "amber",
        score: 45,
        reasons,
        recommendation: "기존 신청과 같은 업체인지 확인 후 하나만 승인하세요.",
        can_auto_approve: false,
        duplicate_count: duplicates.length,
        duplicate_items: duplicates,
      });
    } else if (!isPaid) {
      result = makeResult({
        code: "payment_pending",
        label: "입금대기",
        severity: "amber",
        score: 60,
        reasons,
        recommendation: "입금 문자 자동 매칭 또는 수동 입금 확인 후 승인하세요.",
        can_auto_approve: false,
        duplicate_count: duplicates.length,
        duplicate_items: duplicates,
      });
    } else if (reasons.length === 0) {
      result = makeResult({
        code: "auto_approve_possible",
        label: "자동승인 가능",
        severity: "green",
        score: 95,
        reasons: ["필수 정보, 서류, 입금 상태가 정상입니다."],
        recommendation: "관리자 최종 확인 후 승인 및 브랜드관 생성을 진행하세요.",
        can_auto_approve: true,
        duplicate_count: duplicates.length,
        duplicate_items: duplicates,
      });
    }

    try {
      await saveReviewToApplication(supabase, applicationId, result.review);
    } catch (saveError) {
      console.error("[ai-review] save failed:", saveError);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 검토 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  return GET(req, context);
}