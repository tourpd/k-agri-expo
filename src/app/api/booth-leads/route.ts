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

// 우선순위
function getPriority(areaText: string) {
  const num = parseInt(areaText.replace(/[^\d]/g, "") || "0", 10);

  if (num >= 1000) return "high";
  if (num >= 300) return "medium";
  return "low";
}

// 수수료
function getCommissionRate(sourceType: string) {
  if (sourceType === "photodoctor_product") return 0.2;
  if (sourceType === "consult") return 0.15;
  return 0.1;
}

// 이름 마스킹
function maskName(name: string) {
  if (name.length <= 2) return name[0] + "O";
  return name[0] + "O".repeat(name.length - 2) + name.slice(-1);
}

// 전화 마스킹
function maskPhone(phone: string) {
  const d = onlyDigits(phone);
  if (d.length < 8) return phone;
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const boothId = normalize(body.booth_id);
    const vendorId = normalize(body.vendor_id);

    const farmerName = normalize(body.farmer_name);
    const farmerPhone = onlyDigits(normalize(body.farmer_phone));

    const cropName = normalize(body.crop_name);
    const areaText = normalize(body.area_text);
    const issueType = normalize(body.issue_type);
    const message = normalize(body.message);

    const sourceType = normalize(body.source_type) || "photodoctor_product";
    const sourceRefId = normalize(body.source_ref_id);

    // 🔥 핵심 추가
    const productName = normalize(body.product_name);

    // 🔥 필수 최소화
    if (!farmerName) return jsonError("이름을 입력해주세요.");
    if (!farmerPhone || farmerPhone.length < 10) {
      return jsonError("연락처를 정확히 입력해주세요.");
    }

    const supabase = createSupabaseAdminClient();

    const priority = getPriority(areaText);
    const commissionRate = getCommissionRate(sourceType);

    const maskedFarmerName = maskName(farmerName);
    const maskedFarmerPhone = maskPhone(farmerPhone);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("booth_leads")
      .insert({
        booth_id: boothId || null,
        vendor_id: vendorId || null,

        farmer_name: farmerName,
        farmer_phone: farmerPhone,

        masked_farmer_name: maskedFarmerName,
        masked_farmer_phone: maskedFarmerPhone,

        crop_name: cropName || null,
        area_text: areaText || null,
        issue_type: issueType || null,

        message: message || null,
        product_name: productName || null, // 🔥 핵심

        source_type: sourceType,
        source_ref_id: sourceRefId || null,

        status: "new",
        priority,

        commission_rate: commissionRate,

        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "상담 저장 실패", 500);
    }

    return Response.json({
      success: true,
      item: data,
    });

  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류",
      500
    );
  }
}