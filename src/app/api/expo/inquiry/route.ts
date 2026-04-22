import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InquiryBody = {
  booth_id?: string | null;
  vendor_id?: string | null;
  hall_id?: string | null;
  slot_code?: string | null;

  farmer_name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  quantity_text?: string | null;
  inquiry_type?: string | null;
  message?: string | null;

  agree_privacy?: boolean | null;
  source_type?: string | null;
};

type BoothLookupRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
  name?: string | null;
  consult_enabled?: boolean | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
};

type DuplicateInquiryRow = {
  inquiry_id?: string | null;
  created_at?: string | null;
};

type ProductRow = {
  product_id?: string | number | null;
  id?: string | number | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  is_active?: boolean | null;
};

type RecommendedProduct = {
  product_id: string;
  name: string;
};

type RecommendationResult = {
  products: RecommendedProduct[];
  reason: string | null;
};

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
      ...(extra || {}),
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function jsonSuccess(data: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      ...data,
    },
    {
      headers: noStoreHeaders(),
    }
  );
}

function safeString(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function nullableString(v: unknown) {
  const s = safeString(v, "");
  return s || null;
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const digits = onlyDigits(v);

  if (!digits) return "";
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length < 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function isValidPhone(v: string) {
  const digits = onlyDigits(v);
  return digits.length >= 10 && digits.length <= 11;
}

function normalizeInquiryType(v: string) {
  const s = safeString(v, "");
  return s || "가격 문의";
}

function normalizeSourceType(v: string) {
  const s = safeString(v, "");
  return s || "booth_inquiry";
}

function normalizeMessage(v: string) {
  return safeString(v, "").replace(/\s+/g, " ").trim();
}

function normalizeText(v: unknown) {
  return safeString(v, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function detectForeign(region: string, message: string) {
  const text = `${region} ${message}`.toLowerCase();

  const foreignHints = [
    "usa",
    "u.s.",
    "united states",
    "canada",
    "japan",
    "vietnam",
    "india",
    "indonesia",
    "thailand",
    "philippines",
    "taiwan",
    "mongolia",
    "uzbekistan",
    "russia",
    "australia",
    "mexico",
    "brazil",
    "export",
    "import",
    "buyer",
    "overseas",
    "global",
    "foreign",
  ];

  return foreignHints.some((word) => text.includes(word));
}

function buildDetectionSummary(input: {
  quantity_text: string;
  inquiry_type: string;
  message: string;
}) {
  const summary: string[] = [];

  const quantityDetected = !!safeString(input.quantity_text, "");
  const priceDetected =
    input.inquiry_type.includes("가격") ||
    input.inquiry_type.includes("공동구매") ||
    input.inquiry_type.includes("도매") ||
    /가격|단가|원|만원|kg|톤|박스|수량|공급/i.test(input.message);

  if (quantityDetected) summary.push("수량 감지");
  if (priceDetected) summary.push("가격/단가 관심");

  return summary.join(" · ") || null;
}

function toProductId(row: ProductRow) {
  const raw = row.product_id ?? row.id;
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

function toProductName(row: ProductRow) {
  return safeString(row.name ?? row.title, "");
}

function matchAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function recommendProducts(input: {
  crop: string;
  inquiryType: string;
  message: string;
  products: ProductRow[];
}): RecommendationResult {
  const crop = normalizeText(input.crop);
  const inquiryType = normalizeText(input.inquiryType);
  const message = normalizeText(input.message);
  const fullText = `${crop} ${inquiryType} ${message}`.trim();

  const activeProducts = (input.products || []).filter((p) => {
    const productId = toProductId(p);
    const productName = toProductName(p);
    return !!productId && !!productName && (p.is_active == null || p.is_active === true);
  });

  const mapped = activeProducts.map((p) => ({
    row: p,
    product_id: toProductId(p),
    name: toProductName(p),
    haystack: normalizeText(`${toProductName(p)} ${p.description ?? ""}`),
  }));

  function pick(predicate: (item: (typeof mapped)[number]) => boolean) {
    return mapped.filter(predicate).map((item) => ({
      product_id: item.product_id,
      name: item.name,
    }));
  }

  const pestKeywords = ["총채", "응애", "진딧물", "벌레", "해충", "노린재", "나방"];
  const diseaseKeywords = ["병", "곰팡이", "무름", "탄저", "노균", "흰가루", "균", "병해"];
  const rootKeywords = ["활착", "뿌리", "생육", "회복", "초세", "초기생육"];
  const calciumKeywords = ["칼슘", "비대", "열과", "생리장해"];
  const priceKeywords = ["가격", "단가", "공동구매", "도매", "대량", "공급"];

  if (matchAny(fullText, pestKeywords)) {
    const products = pick(
      (item) =>
        item.haystack.includes("싹쓰리충") ||
        item.haystack.includes("해충") ||
        item.haystack.includes("총채")
    ).slice(0, 3);

    if (products.length > 0) {
      return {
        products,
        reason: "해충 피해 가능성이 보여 방제 관련 제품을 우선 추천했습니다.",
      };
    }
  }

  if (matchAny(fullText, diseaseKeywords)) {
    const products = pick(
      (item) =>
        item.haystack.includes("멸규니") ||
        item.haystack.includes("병해") ||
        item.haystack.includes("곰팡이") ||
        item.haystack.includes("살균")
    ).slice(0, 3);

    if (products.length > 0) {
      return {
        products,
        reason: "병해 스트레스 가능성이 보여 병해 관리 제품을 우선 추천했습니다.",
      };
    }
  }

  if (matchAny(fullText, rootKeywords)) {
    const products = pick(
      (item) =>
        item.haystack.includes("켈팍") ||
        item.haystack.includes("활착") ||
        item.haystack.includes("뿌리") ||
        item.haystack.includes("생육")
    ).slice(0, 3);

    if (products.length > 0) {
      return {
        products,
        reason: "활착·생육 회복 관련 문의로 판단되어 회복 보강 제품을 우선 추천했습니다.",
      };
    }
  }

  if (matchAny(fullText, calciumKeywords)) {
    const products = pick(
      (item) =>
        item.haystack.includes("칼슘") ||
        item.haystack.includes("비대") ||
        item.haystack.includes("생리장해")
    ).slice(0, 3);

    if (products.length > 0) {
      return {
        products,
        reason: "비대·칼슘·생리장해 관련 문의로 보여 관련 제품을 추천했습니다.",
      };
    }
  }

  if (matchAny(fullText, priceKeywords)) {
    const products = mapped.slice(0, 3).map((item) => ({
      product_id: item.product_id,
      name: item.name,
    }));

    return {
      products,
      reason: "가격·공동구매·공급 문의 성격으로 대표 판매 제품을 우선 추천했습니다.",
    };
  }

  return {
    products: mapped.slice(0, 3).map((item) => ({
      product_id: item.product_id,
      name: item.name,
    })),
    reason: mapped.length > 0 ? "문의 내용 기준으로 대표 제품을 우선 추천했습니다." : null,
  };
}

async function ensureBoothExists(boothId: string): Promise<BoothLookupRow | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("booths")
      .select(
        "booth_id, vendor_id, vendor_user_id, name, consult_enabled, is_public, is_active, is_published"
      )
      .eq("booth_id", boothId)
      .maybeSingle();

    if (error) {
      console.error("[api/expo/inquiry] booth lookup error:", error);
      return null;
    }

    return (data ?? null) as BoothLookupRow | null;
  } catch (error) {
    console.error("[api/expo/inquiry] booth lookup exception:", error);
    return null;
  }
}

async function loadBoothProducts(boothId: string): Promise<ProductRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_products")
      .select("product_id, id, name, title, description, is_active")
      .eq("booth_id", boothId)
      .order("sort_order", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data as ProductRow[];
    }

    if (error) {
      console.error("[api/expo/inquiry] expo_products load error:", error);
    }

    const fallback = await supabase
      .from("products")
      .select("product_id, id, name, title, description, is_active")
      .eq("booth_id", boothId)
      .order("sort_order", { ascending: true });

    if (!fallback.error && Array.isArray(fallback.data)) {
      return fallback.data as ProductRow[];
    }

    if (fallback.error) {
      console.error("[api/expo/inquiry] products fallback load error:", fallback.error);
    }

    return [];
  } catch (error) {
    console.error("[api/expo/inquiry] loadBoothProducts exception:", error);
    return [];
  }
}

async function findRecentDuplicate(input: {
  boothId: string;
  phone: string;
  message: string;
}): Promise<DuplicateInquiryRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("expo_inquiries")
      .select("inquiry_id, created_at, message")
      .eq("booth_id", input.boothId)
      .eq("phone", input.phone)
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[api/expo/inquiry] duplicate check error:", error);
      return null;
    }

    const rows = Array.isArray(data) ? data : [];
    const found = rows.find(
      (row) => normalizeMessage(String((row as { message?: unknown }).message ?? "")) === input.message
    );

    if (!found) return null;

    return {
      inquiry_id: (found as { inquiry_id?: string | null }).inquiry_id ?? null,
      created_at: (found as { created_at?: string | null }).created_at ?? null,
    };
  } catch (error) {
    console.error("[api/expo/inquiry] duplicate check exception:", error);
    return null;
  }
}

async function insertBoothLeadWithFallback(payload: {
  booth_id: string;
  vendor_id: string | null;
  farmer_name: string;
  phone: string;
  region: string;
  crop: string;
  quantity_text: string | null;
  inquiry_type: string;
  message: string;
  source_type: string;
  is_foreign: boolean;
  quantity_detected: boolean;
  price_detected: boolean;
  detection_summary: string | null;
  recommended_product_ids: string[];
  recommended_reason: string | null;
  now: string;
}) {
  const supabase = createSupabaseAdminClient();

  const richPayload = {
    booth_id: payload.booth_id,
    vendor_id: payload.vendor_id,

    company_name: null,
    contact_name: payload.farmer_name,
    phone: payload.phone,
    email: null,

    message: payload.message,
    translated_message: null,

    source_type: payload.source_type,
    trade_type:
      payload.inquiry_type.includes("도매") || payload.inquiry_type.includes("대량")
        ? "b2b"
        : "domestic",
    inquiry_language: "ko",
    country: "Korea",
    quantity: payload.quantity_text,
    is_foreign: payload.is_foreign,

    lead_score: payload.quantity_detected || payload.price_detected ? 70 : 40,
    priority_rank:
      payload.inquiry_type.includes("공동구매") ||
      payload.inquiry_type.includes("대량") ||
      payload.inquiry_type.includes("도매")
        ? 90
        : payload.quantity_detected
        ? 75
        : 50,

    lead_stage: "new",
    status: "active",
    quote_status: "not_started",

    admin_memo: [
      `문의유형: ${payload.inquiry_type}`,
      `지역: ${payload.region}`,
      `작물: ${payload.crop}`,
      payload.quantity_text ? `수량/면적: ${payload.quantity_text}` : "",
      payload.recommended_reason ? `추천사유: ${payload.recommended_reason}` : "",
      payload.recommended_product_ids.length > 0
        ? `추천제품ID: ${payload.recommended_product_ids.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),

    buyer_level: "domestic_farmer",
    buyer_verification_status: "unverified",

    hot_lead:
      payload.inquiry_type.includes("공동구매") ||
      payload.inquiry_type.includes("대량") ||
      payload.inquiry_type.includes("도매"),
    quantity_detected: payload.quantity_detected,
    price_detected: payload.price_detected,
    detection_summary: payload.detection_summary,
    admin_alert_sent_at: null,

    recommended_product_ids:
      payload.recommended_product_ids.length > 0 ? payload.recommended_product_ids : null,
    recommended_reason: payload.recommended_reason,

    created_at: payload.now,
  };

  const richInsert = await supabase
    .from("booth_leads")
    .insert(richPayload)
    .select("id")
    .maybeSingle();

  if (!richInsert.error) {
    return { ok: true, mode: "rich" as const };
  }

  console.error("[api/expo/inquiry] booth_leads rich insert error:", richInsert.error);

  const minimalPayload = {
    booth_id: payload.booth_id,
    vendor_id: payload.vendor_id,
    contact_name: payload.farmer_name,
    phone: payload.phone,
    message: payload.message,
    source_type: payload.source_type,
    recommended_product_ids:
      payload.recommended_product_ids.length > 0 ? payload.recommended_product_ids : null,
    recommended_reason: payload.recommended_reason,
    created_at: payload.now,
  };

  const minimalInsert = await supabase
    .from("booth_leads")
    .insert(minimalPayload)
    .select("id")
    .maybeSingle();

  if (!minimalInsert.error) {
    return { ok: true, mode: "minimal" as const };
  }

  console.error("[api/expo/inquiry] booth_leads minimal insert error:", minimalInsert.error);

  return { ok: false, mode: "failed" as const };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as InquiryBody;

    const boothId = safeString(body.booth_id, "");
    const vendorId = safeString(body.vendor_id, "");
    const hallId = safeString(body.hall_id, "");
    const slotCode = safeString(body.slot_code, "");

    const farmerName = safeString(body.farmer_name, "");
    const rawPhone = safeString(body.phone, "");
    const phone = formatPhone(rawPhone);

    const region = safeString(body.region, "");
    const crop = safeString(body.crop, "");
    const quantityText = safeString(body.quantity_text, "");
    const inquiryType = normalizeInquiryType(safeString(body.inquiry_type, ""));
    const message = normalizeMessage(safeString(body.message, ""));
    const agreePrivacy = body.agree_privacy === true;
    const sourceType = normalizeSourceType(safeString(body.source_type, ""));

    if (!boothId) {
      return jsonError("booth_id가 필요합니다.", 400);
    }

    if (!farmerName) {
      return jsonError("이름을 입력해주십시오.", 400);
    }

    if (!isValidPhone(phone)) {
      return jsonError("휴대폰 번호를 정확히 입력해주십시오.", 400);
    }

    if (!region) {
      return jsonError("지역을 입력해주십시오.", 400);
    }

    if (!crop) {
      return jsonError("작물명을 입력해주십시오.", 400);
    }

    if (!message || message.length < 8) {
      return jsonError("문의 내용을 조금 더 구체적으로 입력해주십시오.", 400);
    }

    if (!agreePrivacy) {
      return jsonError("개인정보 수집 및 이용 동의가 필요합니다.", 400);
    }

    const booth = await ensureBoothExists(boothId);

    if (!booth?.booth_id) {
      return jsonError("존재하지 않는 부스입니다.", 404);
    }

    if (booth.consult_enabled === false) {
      return jsonError("현재 이 부스는 문의 접수를 받고 있지 않습니다.", 403);
    }

    const duplicate = await findRecentDuplicate({
      boothId,
      phone,
      message,
    });

    if (duplicate?.inquiry_id) {
      return jsonSuccess({
        mode: "duplicate",
        inquiry_id: duplicate.inquiry_id,
        notice: "같은 문의가 이미 접수되어 중복 저장을 막았습니다.",
      });
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const resolvedVendorId =
      vendorId ||
      safeString(booth.vendor_user_id, "") ||
      safeString(booth.vendor_id, "") ||
      null;

    const isForeign = detectForeign(region, message);
    const quantityDetected = !!quantityText;
    const priceDetected =
      inquiryType.includes("가격") ||
      inquiryType.includes("공동구매") ||
      inquiryType.includes("도매") ||
      /가격|단가|원|만원|kg|톤|박스|수량|공급/i.test(message);

    const detectionSummary = buildDetectionSummary({
      quantity_text: quantityText,
      inquiry_type: inquiryType,
      message,
    });

    const boothProducts = await loadBoothProducts(boothId);
    const recommendation = recommendProducts({
      crop,
      inquiryType,
      message,
      products: boothProducts,
    });

    const recommendedProductIds = recommendation.products.map((item) => item.product_id);
    const recommendedReason = recommendation.reason;

    const inquiryPayload = {
      booth_id: boothId,
      vendor_id: resolvedVendorId,
      hall_id: nullableString(hallId),
      slot_code: nullableString(slotCode),

      farmer_name: farmerName,
      phone,
      region,
      crop,
      quantity_text: nullableString(quantityText),
      inquiry_type: inquiryType,
      message,

      agree_privacy: true,
      source_type: sourceType,

      recommended_product_ids:
        recommendedProductIds.length > 0 ? recommendedProductIds : null,
      recommended_reason: recommendedReason,

      status: "new",
      created_at: now,
      updated_at: now,
    };

    const inquiryInsert = await supabase
      .from("expo_inquiries")
      .insert(inquiryPayload)
      .select(
        "inquiry_id, booth_id, vendor_id, recommended_product_ids, recommended_reason"
      )
      .single();

    if (inquiryInsert.error || !inquiryInsert.data) {
      console.error("[api/expo/inquiry] expo_inquiries insert error:", inquiryInsert.error);
      return jsonError(
        inquiryInsert.error?.message || "문의 저장에 실패했습니다.",
        500
      );
    }

    const leadResult = await insertBoothLeadWithFallback({
      booth_id: boothId,
      vendor_id: resolvedVendorId,
      farmer_name: farmerName,
      phone,
      region,
      crop,
      quantity_text: nullableString(quantityText),
      inquiry_type: inquiryType,
      message,
      source_type: sourceType,
      is_foreign: isForeign,
      quantity_detected: quantityDetected,
      price_detected: priceDetected,
      detection_summary: detectionSummary,
      recommended_product_ids: recommendedProductIds,
      recommended_reason: recommendedReason,
      now,
    });

    return jsonSuccess({
      mode: "created",
      inquiry_id: inquiryInsert.data.inquiry_id,
      lead_saved: leadResult.ok,
      lead_mode: leadResult.mode,
      recommended_product_ids: recommendedProductIds,
      recommended_products: recommendation.products,
      recommended_reason: recommendedReason,
      notice: "문의가 정상 접수되었습니다. 관리자가 먼저 확인 후 연결합니다.",
    });
  } catch (error) {
    console.error("[api/expo/inquiry] exception:", error);

    return jsonError(
      error instanceof Error ? error.message : "문의 접수 중 오류가 발생했습니다.",
      500
    );
  }
}

export async function GET() {
  return jsonError("GET은 지원되지 않습니다.", 405);
}