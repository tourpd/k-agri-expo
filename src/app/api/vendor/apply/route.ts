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

  category_primary?: string;
  company_intro?: string;
  website_url?: string;
  youtube_url?: string;
  brochure_url?: string;

  preferred_hall_1?: string;
  preferred_hall_2?: string | null;
  preferred_category?: string;

  placement_preference?: string;
  placementPreference?: string;
  position_preference?: string;
  positionPreference?: string;

  promotion_preference?: string;
  promotionPreference?: string;
  exposure_preference?: string;
  exposurePreference?: string;
  featured_preference?: string;
  featuredPreference?: string;

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
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSupabaseAdmin() {
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

function buildStoragePublicUrl(bucket: string, path: string) {
  return `${getEnv("NEXT_PUBLIC_SUPABASE_URL")}/storage/v1/object/public/${bucket}/${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
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

    const userId = nullableTrim(body.user_id);

    const companyName = safeTrim(body.company_name);
    const representativeName =
      safeTrim(body.representative_name) || safeTrim(body.ceo_name);
    const contactName =
      safeTrim(body.contact_name) || representativeName || companyName;

    const contactEmail =
      safeTrim(body.contact_email) || safeTrim(body.email);

    const contactPhone =
      digitsOnly(body.contact_phone) || digitsOnly(body.phone);

    const taxEmail =
      nullableTrim(body.tax_email) ||
      nullableTrim(body.contact_email) ||
      nullableTrim(body.email) ||
      "temp@no-email.com";

    const businessNumber = digitsOnly(body.business_number).slice(0, 10);
    const openDate = nullableTrim(body.open_date);

    const businessAddress =
      safeTrim(body.business_address) || safeTrim(body.address);

    const bizType =
      safeTrim(body.biz_type) ||
      safeTrim(body.business_type) ||
      "기타";

    const bizItem =
      nullableTrim(body.biz_item) ||
      nullableTrim(body.business_item) ||
      bizType ||
      "기타";

    const categoryPrimary =
      nullableTrim(body.category_primary) ||
      nullableTrim(body.preferred_category) ||
      "other";

    const companyIntro =
      nullableTrim(body.company_intro) || "회사 소개 미입력";

    const websiteUrl = nullableTrim(body.website_url);
    const youtubeUrl = nullableTrim(body.youtube_url);
    const brochureUrl = nullableTrim(body.brochure_url);

    const preferredHall1 = nullableTrim(body.preferred_hall_1);
    const preferredHall2 = nullableTrim(body.preferred_hall_2);
    const preferredCategory = nullableTrim(body.preferred_category);

    const placementPreference =
      safeTrim(body.placement_preference) ||
      safeTrim(body.placementPreference) ||
      safeTrim(body.position_preference) ||
      safeTrim(body.positionPreference) ||
      "category_cluster";

    const promotionPreference =
      safeTrim(body.promotion_preference) ||
      safeTrim(body.promotionPreference) ||
      safeTrim(body.exposure_preference) ||
      safeTrim(body.exposurePreference) ||
      safeTrim(body.featured_preference) ||
      safeTrim(body.featuredPreference) ||
      "standard";

    const sourceFileName = nullableTrim(body.source_file_name);
    const sourceFileMime = nullableTrim(body.source_file_mime);
    const sourceExtractedJson = body.source_extracted_json ?? null;

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

    if (!taxEmail || !isValidEmail(taxEmail)) {
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

    if (!businessLicenseBucket || !businessLicensePath) {
      return NextResponse.json(
        { success: false, error: "사업자등록증 업로드 정보가 없습니다." },
        { status: 400 }
      );
    }

    const applicationCode = buildApplicationCode();
    const nowIso = new Date().toISOString();

    const insertPayload = {
      // UUID 컬럼 application_id는 넣지 않음
      user_id: userId,

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
      tax_email: taxEmail,

      business_number: businessNumber,
      open_date: openDate,
      business_address: businessAddress,

      biz_type: bizType,
      business_type: bizType,
      biz_item: bizItem,
      business_item: bizItem,

      category_primary: categoryPrimary,
      company_intro: companyIntro,
      intro: companyIntro,

      website_url: websiteUrl,
      youtube_url: youtubeUrl,
      brochure_url: brochureUrl,

      source_file_name: sourceFileName,
      source_file_mime: sourceFileMime,
      source_extracted_json: sourceExtractedJson,

      business_license_bucket: businessLicenseBucket,
      business_license_path: businessLicensePath,
      business_license_url: buildStoragePublicUrl(
        businessLicenseBucket,
        businessLicensePath
      ),

      preferred_hall_1: preferredHall1,
      preferred_hall_2: preferredHall2,
      preferred_category: preferredCategory,

      placement_preference: placementPreference,
      promotion_preference: promotionPreference,
      position_preference: placementPreference,
      exposure_preference: promotionPreference,

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

      admin_note: null,
      hall_preference: null,

      created_at: nowIso,
      updated_at: nowIso,
      reviewed_at: null,
    };

    const { data, error } = await supabase
      .from("vendor_applications_v2")
      .insert(insertPayload)
      .select(`
        application_id,
        application_code,
        order_code,
        company_name,
        amount_krw,
        application_status,
        payment_status,
        booth_progress_status,
        user_id
      `)
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
          error instanceof Error
            ? error.message
            : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}