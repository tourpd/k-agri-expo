import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplyBody = {
  booth_type?: string;
  duration_key?: string;
  duration_months?: number;
  amount_krw?: number;
  product_code?: string;

  company_name?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  tax_email?: string;

  business_number?: string;
  open_date?: string;
  business_address?: string;
  biz_type?: string;
  biz_item?: string;

  category_primary?: string;
  company_intro?: string;
  website_url?: string;
  youtube_url?: string;
  brochure_url?: string;

  source_file_name?: string;
  source_file_mime?: string;
  source_extracted_json?: Record<string, unknown> | null;

  business_license_bucket?: string;
  business_license_path?: string;
};

const VALID_PRICE_MAP = {
  free_1m: {
    booth_type: "free",
    duration_key: "1m",
    duration_months: 1,
    amount_krw: 0,
  },
  basic_1m: {
    booth_type: "basic",
    duration_key: "1m",
    duration_months: 1,
    amount_krw: 50000,
  },
  basic_3m: {
    booth_type: "basic",
    duration_key: "3m",
    duration_months: 3,
    amount_krw: 120000,
  },
  premium_1m: {
    booth_type: "premium",
    duration_key: "1m",
    duration_months: 1,
    amount_krw: 150000,
  },
  premium_3m: {
    booth_type: "premium",
    duration_key: "3m",
    duration_months: 3,
    amount_krw: 350000,
  },
} as const;

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function onlyDigits(value: unknown) {
  return typeof value === "string" ? value.replace(/[^\d]/g, "") : "";
}

function validatePricing(body: ApplyBody) {
  const productCode = normalizeString(
    body.product_code
  ) as keyof typeof VALID_PRICE_MAP;
  const expected = VALID_PRICE_MAP[productCode];

  if (!expected) {
    return { ok: false, message: "유효하지 않은 상품 코드입니다." as const };
  }

  const boothType = normalizeString(body.booth_type);
  const durationKey = normalizeString(body.duration_key);
  const durationMonths = Number(body.duration_months || 0);
  const amountKrw = Number(body.amount_krw || 0);

  if (
    boothType !== expected.booth_type ||
    durationKey !== expected.duration_key ||
    durationMonths !== expected.duration_months ||
    amountKrw !== expected.amount_krw
  ) {
    return { ok: false, message: "가격 정보가 올바르지 않습니다." as const };
  }

  return { ok: true, expected };
}

function getDateCodeKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yy = String(kst.getUTCFullYear()).slice(2);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

async function generateApplicationCode(
  supabase: ReturnType<typeof createClient>
) {
  const dateCode = getDateCodeKST();
  const prefix = `V${dateCode}-`;

  const { data, error } = await supabase
    .from("vendor_applications_v2")
    .select("application_code")
    .ilike("application_code", `${prefix}%`);

  if (error) {
    throw new Error(error.message || "신청번호 생성용 조회에 실패했습니다.");
  }

  let maxSeq = 0;

  for (const row of data || []) {
    const code = row.application_code || "";
    const match = code.match(/^V\d{6}-(\d{4})$/);
    if (match?.[1]) {
      const seq = Number(match[1]);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return jsonError("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.", 500);
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.", 500);
    }

    const body = (await req.json()) as ApplyBody;

    const pricingCheck = validatePricing(body);
    if (!pricingCheck.ok) {
      return jsonError(pricingCheck.message, 400);
    }

    const companyName = normalizeString(body.company_name);
    const representativeName = normalizeString(body.representative_name);
    const email = normalizeString(body.email);
    const phone = onlyDigits(body.phone);
    const businessNumber = onlyDigits(body.business_number);
    const businessLicenseBucket = normalizeString(body.business_license_bucket);
    const businessLicensePath = normalizeString(body.business_license_path);

    if (!companyName) return jsonError("회사명은 필수입니다.");
    if (!representativeName) return jsonError("대표자명은 필수입니다.");
    if (!email) return jsonError("담당자 이메일은 필수입니다.");
    if (!phone) return jsonError("담당자 연락처는 필수입니다.");
    if (phone.length < 10 || phone.length > 11) {
      return jsonError("담당자 연락처 형식이 올바르지 않습니다.");
    }

    if (!businessNumber) return jsonError("사업자등록번호는 필수입니다.");
    if (businessNumber.length !== 10) {
      return jsonError("사업자등록번호 형식이 올바르지 않습니다.");
    }

    if (!businessLicenseBucket || !businessLicensePath) {
      return jsonError("사업자등록증 파일 업로드 정보가 없습니다.");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const applicationCode = await generateApplicationCode(supabase);

    const insertPayload = {
      user_id: null,

      application_code: applicationCode,

      booth_type: normalizeString(body.booth_type),
      duration_key: normalizeString(body.duration_key),
      duration_months: Number(body.duration_months || 0),
      amount_krw: Number(body.amount_krw || 0),
      product_code: normalizeString(body.product_code),

      company_name: companyName,
      representative_name: representativeName,
      email,
      phone,
      tax_email: normalizeString(body.tax_email),

      business_number: businessNumber,
      open_date: normalizeString(body.open_date),
      business_address: normalizeString(body.business_address),
      biz_type: normalizeString(body.biz_type),
      biz_item: normalizeString(body.biz_item),

      category_primary: normalizeString(body.category_primary),
      company_intro: normalizeString(body.company_intro),
      website_url: normalizeString(body.website_url),
      youtube_url: normalizeString(body.youtube_url),
      brochure_url: normalizeString(body.brochure_url),

      source_file_name: normalizeString(body.source_file_name),
      source_file_mime: normalizeString(body.source_file_mime),
      source_extracted_json:
        body.source_extracted_json && typeof body.source_extracted_json === "object"
          ? body.source_extracted_json
          : null,

      business_license_bucket: businessLicenseBucket,
      business_license_path: businessLicensePath,

      status: "pending",
    };

    const { data, error } = await supabase
      .from("vendor_applications_v2")
      .insert(insertPayload)
      .select("application_id, application_code, company_name, amount_krw")
      .single();

    if (error) {
      return jsonError(error.message || "DB 저장 중 오류가 발생했습니다.", 500);
    }

    return Response.json({
      success: true,
      application_id: data.application_id,
      application_code: data.application_code,
      company_name: data.company_name,
      amount_krw: data.amount_krw,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "신청 제출 중 오류가 발생했습니다.";
    return jsonError(message, 500);
  }
}