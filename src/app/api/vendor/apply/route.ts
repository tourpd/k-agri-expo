import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BoothType = "free" | "basic" | "premium";
type DurationKey = "1m" | "3m";

type ProductCode =
  | "free_1m"
  | "basic_1m"
  | "basic_3m"
  | "premium_1m"
  | "premium_3m";

type RequestBody = {
  user_id?: string;

  booth_type?: BoothType;
  duration_key?: DurationKey;
  duration_months?: number;
  amount_krw?: number;
  product_code?: ProductCode;
  plan_code?: ProductCode;

  company_name?: string;
  representative_name?: string;
  ceo_name?: string;
  contact_name?: string;

  email?: string;
  contact_email?: string;
  phone?: string;
  contact_phone?: string;
  tax_email?: string;

  business_number?: string;
  open_date?: string;
  business_address?: string;
  address?: string;
  biz_type?: string;
  business_type?: string;
  biz_item?: string;
  business_item?: string;

  preferred_hall_1?: string;
  preferred_hall_2?: string | null;
  preferred_category?: string | null;

  source_file_name?: string;
  source_file_mime?: string;
  source_extracted_json?: Record<string, unknown> | null;

  business_license_bucket?: string;
  business_license_path?: string;
};

const PLAN_AMOUNT_MAP: Record<ProductCode, number> = {
  free_1m: 0,
  basic_1m: 50000,
  basic_3m: 120000,
  premium_1m: 150000,
  premium_3m: 350000,
};

const PLAN_MONTHS_MAP: Record<ProductCode, number> = {
  free_1m: 1,
  basic_1m: 1,
  basic_3m: 3,
  premium_1m: 1,
  premium_3m: 3,
};

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function createSupabaseAdminClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableTrim(value: unknown) {
  const trimmed = safeTrim(value);
  return trimmed.length > 0 ? trimmed : null;
}

function digitsOnly(value: unknown) {
  return typeof value === "string" ? value.replace(/[^\d]/g, "") : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeProductCode(value: unknown): ProductCode | null {
  const allowed: ProductCode[] = [
    "free_1m",
    "basic_1m",
    "basic_3m",
    "premium_1m",
    "premium_3m",
  ];

  if (typeof value !== "string") return null;
  return allowed.includes(value as ProductCode) ? (value as ProductCode) : null;
}

function deriveBoothTypeFromPlan(planCode: ProductCode): BoothType {
  if (planCode.startsWith("free")) return "free";
  if (planCode.startsWith("basic")) return "basic";
  return "premium";
}

function deriveDurationKeyFromPlan(planCode: ProductCode): DurationKey {
  return planCode.endsWith("3m") ? "3m" : "1m";
}

function buildApplicationCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VAP-${yyyy}${mm}${dd}-${rand}`;
}

function buildStoragePublicUrl(bucket: string, filePath: string) {
  return `${getEnv(
    "NEXT_PUBLIC_SUPABASE_URL"
  )}/storage/v1/object/public/${bucket}/${filePath}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = (await req.json()) as RequestBody;

    const planCode =
      normalizeProductCode(body.plan_code) ||
      normalizeProductCode(body.product_code);

    if (!planCode) {
      return NextResponse.json(
        { success: false, error: "상품 코드가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const boothType: BoothType =
      body.booth_type || deriveBoothTypeFromPlan(planCode);

    const durationKey: DurationKey =
      body.duration_key || deriveDurationKeyFromPlan(planCode);

    const durationMonths =
      Number(body.duration_months) || PLAN_MONTHS_MAP[planCode] || 1;

    const amountKrw =
      typeof body.amount_krw === "number"
        ? body.amount_krw
        : PLAN_AMOUNT_MAP[planCode] ?? 0;

    const companyName = safeTrim(body.company_name);

    const representativeName =
      safeTrim(body.representative_name) || safeTrim(body.ceo_name);

    const contactName =
      safeTrim(body.contact_name) || representativeName || companyName;

    const contactEmail = safeTrim(body.contact_email) || safeTrim(body.email);

    const contactPhone =
      digitsOnly(body.contact_phone) || digitsOnly(body.phone);

    const taxEmail =
      nullableTrim(body.tax_email) ||
      nullableTrim(body.contact_email) ||
      nullableTrim(body.email);

    const businessNumber = digitsOnly(body.business_number).slice(0, 10);
    const businessAddress =
      nullableTrim(body.business_address) || nullableTrim(body.address);

    const bizType =
      nullableTrim(body.biz_type) || nullableTrim(body.business_type);

    const bizItem =
      nullableTrim(body.biz_item) || nullableTrim(body.business_item);

    const businessLicenseBucket = nullableTrim(body.business_license_bucket);
    const businessLicensePath = nullableTrim(body.business_license_path);

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: "회사명은 필수입니다." },
        { status: 400 }
      );
    }

    if (!representativeName) {
      return NextResponse.json(
        { success: false, error: "대표자명은 필수입니다." },
        { status: 400 }
      );
    }

    if (!contactEmail || !isValidEmail(contactEmail)) {
      return NextResponse.json(
        { success: false, error: "담당자 이메일 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!contactPhone || contactPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "담당자 연락처가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (taxEmail && !isValidEmail(taxEmail)) {
      return NextResponse.json(
        { success: false, error: "세금계산서 이메일 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!businessNumber || businessNumber.length !== 10) {
      return NextResponse.json(
        { success: false, error: "사업자등록번호를 정확히 입력해주세요." },
        { status: 400 }
      );
    }

    if (!businessAddress) {
      return NextResponse.json(
        { success: false, error: "사업장 주소는 필수입니다." },
        { status: 400 }
      );
    }

    if (!bizType) {
      return NextResponse.json(
        { success: false, error: "업태는 필수입니다." },
        { status: 400 }
      );
    }

    if (!bizItem) {
      return NextResponse.json(
        { success: false, error: "종목은 필수입니다." },
        { status: 400 }
      );
    }

    if (!businessLicenseBucket || !businessLicensePath) {
      return NextResponse.json(
        { success: false, error: "사업자등록증 업로드는 필수입니다." },
        { status: 400 }
      );
    }

    const applicationCode = buildApplicationCode();
    const nowIso = new Date().toISOString();

    const businessLicenseUrl = buildStoragePublicUrl(
      businessLicenseBucket,
      businessLicensePath
    );

    const insertPayload = {
      user_id: nullableTrim(body.user_id),

      application_code: applicationCode,
      order_code: applicationCode,

      booth_type: boothType,
      duration_key: durationKey,
      duration_months: durationMonths,
      amount_krw: amountKrw,
      product_code: planCode,
      plan_code: planCode,

      company_name: companyName,
      representative_name: representativeName,
      ceo_name: representativeName,
      contact_name: contactName,

      email: contactEmail,
      contact_email: contactEmail,
      phone: contactPhone,
      contact_phone: contactPhone,
      tax_email: taxEmail || contactEmail,

      business_number: businessNumber,
      open_date: nullableTrim(body.open_date),
      business_address: businessAddress,

      biz_type: bizType,
      business_type: bizType,
      biz_item: bizItem,
      business_item: bizItem,

      category_primary: nullableTrim(body.preferred_category) || "other",
      company_intro: "입점 신청 단계에서는 회사소개 미입력",
      intro: "입점 신청 단계에서는 회사소개 미입력",

      website_url: null,
      youtube_url: null,
      brochure_url: null,

      source_file_name: nullableTrim(body.source_file_name),
      source_file_mime: nullableTrim(body.source_file_mime),
      source_extracted_json: {
        ...(body.source_extracted_json ?? {}),
        application_type: "vendor_apply",
        onboarding_after_approval: true,
      },

      business_license_bucket: businessLicenseBucket,
      business_license_path: businessLicensePath,
      business_license_url: businessLicenseUrl,

      preferred_hall_1: nullableTrim(body.preferred_hall_1),
      preferred_hall_2: nullableTrim(body.preferred_hall_2),
      preferred_category: nullableTrim(body.preferred_category) || "other",

      placement_preference: "operator_recommended",
      promotion_preference: "standard",
      position_preference: "operator_recommended",
      exposure_preference: "standard",

      status: "pending",
      application_status: "pending",
      payment_status: amountKrw === 0 ? "not_required" : "waiting",
      booth_progress_status: "not_started",
      provision_status: "not_started",

      assigned_hall: null,
      assigned_slot_code: null,
      assigned_booth_id: null,

      payment_confirmed: false,
      payment_confirmed_at: null,
      payment_confirmed_by_email: null,

      approved_at: null,
      approved_by_email: null,
      rejected_at: null,
      rejected_by_email: null,
      rejection_reason: null,

      provision_result: null,
      provisioned_at: null,
      provisioned_vendor_id: null,
      provisioned_booth_id: null,

      admin_note: "K-Agri Expo 입점 신청",
      hall_preference: nullableTrim(body.preferred_hall_1),

      created_at: nowIso,
      updated_at: nowIso,
      reviewed_at: null,
    };

    const { data, error } = await supabase
      .from("vendor_applications_v2")
      .insert(insertPayload)
      .select(
        `
        application_id,
        application_code,
        order_code,
        company_name,
        amount_krw,
        application_status,
        payment_status,
        booth_progress_status,
        user_id
      `
      )
      .single();

    if (error) {
      console.error("[vendor/apply] insert error:", error);
      console.error("[vendor/apply] insert payload:", insertPayload);

      return NextResponse.json(
        {
          success: false,
          error: "입점 신청 저장에 실패했습니다.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ok: true,
        message: "입점 신청이 정상 접수되었습니다.",
        application_id: data?.application_id ?? null,
        application_code:
          data?.application_code || data?.order_code || applicationCode,
        company_name: data?.company_name || companyName,
        amount_krw: data?.amount_krw ?? amountKrw,
        application: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[vendor/apply] unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}