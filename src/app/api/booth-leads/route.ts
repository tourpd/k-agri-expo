import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

// 우선순위 자동 계산
function getPriority(areaText: string) {
  const num = parseInt(areaText.replace(/[^\d]/g, "") || "0", 10);

  if (num >= 1000) return "high";
  if (num >= 300) return "medium";
  return "low";
}

// 기본 수수료율
function getCommissionRate(sourceType: string) {
  if (sourceType === "photo_doctor") return 0.2;
  if (sourceType === "consult") return 0.15;
  if (sourceType === "booth_inquiry") return 0.1;
  return 0.1;
}

// 이름 마스킹
function maskName(name: string) {
  const value = name.trim();

  if (!value) return "";
  if (value.length === 1) return value;
  if (value.length === 2) return `${value[0]}O`;

  return `${value[0]}${"O".repeat(value.length - 2)}${value[value.length - 1]}`;
}

// 전화번호 마스킹
function maskPhone(phone: string) {
  const digits = onlyDigits(phone);

  if (digits.length < 8) return phone;

  if (digits.length === 10) {
    // 예: 0101234567 → 010-***-4567
    return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`;
  }

  // 예: 01012345678 → 010-****-5678
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const boothId = normalize(body.booth_id);
    let vendorId = normalize(body.vendor_id);
    let hallId = normalize(body.hall_id);
    let slotCode = normalize(body.slot_code);

    const farmerName = normalize(body.farmer_name);
    const farmerPhone = onlyDigits(normalize(body.farmer_phone));
    const farmerEmail = normalize(body.farmer_email);

    const cropName = normalize(body.crop_name);
    const areaText = normalize(body.area_text);
    const issueType = normalize(body.issue_type);
    const message = normalize(body.message);

    const sourceType = normalize(body.source_type) || "booth";
    const sourceRefId = normalize(body.source_ref_id);

    if (!boothId) return jsonError("booth_id가 필요합니다.");
    if (!farmerName) return jsonError("이름을 입력해주세요.");
    if (!farmerPhone || farmerPhone.length < 10) {
      return jsonError("연락처를 정확히 입력해주세요.");
    }
    if (!cropName) return jsonError("작물을 입력해주세요.");

    const supabase = createSupabaseAdminClient();

    // booth 기준으로 vendor/hall/slot 자동 보강
    const { data: booth, error: boothError } = await supabase
      .from("booths")
      .select("booth_id, vendor_id, hall_id, slot_code")
      .eq("booth_id", boothId)
      .single();

    if (boothError || !booth) {
      return jsonError(boothError?.message || "부스 정보를 찾지 못했습니다.", 404);
    }

    vendorId = vendorId || String(booth.vendor_id || "");
    hallId = hallId || String(booth.hall_id || "");
    slotCode = slotCode || String(booth.slot_code || "");

    const priority = getPriority(areaText);
    const commissionRate = getCommissionRate(sourceType);
    const estimatedAmount = 0;
    const commissionAmount = estimatedAmount * commissionRate;

    const maskedFarmerName = maskName(farmerName);
    const maskedFarmerPhone = maskPhone(farmerPhone);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("booth_leads")
      .insert({
        booth_id: boothId,
        vendor_id: vendorId || null,
        hall_id: hallId || null,
        slot_code: slotCode || null,

        farmer_name: farmerName,
        farmer_phone: farmerPhone,
        farmer_email: farmerEmail || null,
        masked_farmer_name: maskedFarmerName,
        masked_farmer_phone: maskedFarmerPhone,

        crop_name: cropName,
        area_text: areaText || null,
        issue_type: issueType || null,
        message: message || null,

        source_type: sourceType,
        source_ref_id: sourceRefId || null,

        status: "new",
        priority,

        estimated_amount_krw: estimatedAmount,
        final_amount_krw: null,
        commission_rate: commissionRate,
        commission_amount_krw: commissionAmount,

        contact_unlocked: false,
        accepted_at: null,
        accepted_by_vendor_id: null,

        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "상담 요청 저장 실패", 500);
    }

    await supabase.from("booth_lead_events").insert({
      lead_id: data.lead_id,
      event_type: "created",
      actor_email: farmerEmail || null,
      note: "포토닥터/부스 상담 요청 생성",
      old_status: null,
      new_status: "new",
      created_at: now,
    });

    return Response.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "상담 요청 처리 중 오류",
      500
    );
  }
}