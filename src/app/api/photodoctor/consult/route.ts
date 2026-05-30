import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const d = onlyDigits(v);

  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  return v;
}

function isValidKoreanMobile(v: string) {
  const d = onlyDigits(v);
  return /^010\d{8}$/.test(d);
}

function extractNumber(v: string) {
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getPriority(issue: string) {
  const text = issue.toLowerCase();

  if (
    text.includes("시들") ||
    text.includes("탄저") ||
    text.includes("역병") ||
    text.includes("흰가루") ||
    text.includes("노균") ||
    text.includes("총채") ||
    text.includes("진딧") ||
    text.includes("응애") ||
    text.includes("고사") ||
    text.includes("썩음")
  ) {
    return "high";
  }

  return "medium";
}

function getVendorRouting(productName: string) {
  const p = productName.replace(/\s+/g, "");

  if (p.includes("싹쓰리충")) {
    return {
      vendor_target: "dof",
      commission_rate: 0.25,
    };
  }

  if (p.includes("멸규니")) {
    return {
      vendor_target: "dof",
      commission_rate: 0.3,
    };
  }

  return {
    vendor_target: "unassigned",
    commission_rate: 0,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const farmerName = safe(body.name);
    const farmerPhoneRaw = safe(body.phone);
    const farmerPhone = formatPhone(farmerPhoneRaw);

    const cropName = safe(body.crop);
    const province = safe(body.province);
    const city = safe(body.city);
    const issueType = safe(body.issue);
    const diagnosisId = safe(body.diagnosis_id);
    const productName = safe(body.product);
    const areaText = safe(body.area_text);
    const imageUrl = safe(body.image_url);
    const extraMessage = safe(body.message);

    // 앞으로 농기계/장비 상담 때 같이 받을 수 있는 확장 필드
    const tractorBrand = safe(body.tractor_brand);
    const tractorModel = safe(body.tractor_model);
    const tractorHpText = safe(body.tractor_hp);
    const equipmentInterest = safe(body.equipment_interest);

    if (!farmerName) {
      return NextResponse.json(
        { ok: false, error: "이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!isValidKoreanMobile(farmerPhoneRaw)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "전화번호는 010으로 시작하는 11자리 번호로 입력해주세요. 예: 010-1234-5678",
        },
        { status: 400 }
      );
    }

    const routing = getVendorRouting(productName);
    const now = new Date().toISOString();
    const regionText = [province, city].filter(Boolean).join(" ");

    const areaPyeong = extractNumber(areaText);
    const tractorHp = extractNumber(tractorHpText);

    const message = [
      "포토닥터 진단 결과 전문가 상담 요청",
      productName ? `제품: ${productName}` : "",
      cropName ? `작물: ${cropName}` : "",
      issueType ? `진단/증상: ${issueType}` : "",
      province || city ? `지역: ${province} ${city}`.trim() : "",
      areaText ? `재배면적: ${areaText}` : "",
      areaPyeong ? `재배면적 숫자: ${areaPyeong}평` : "",
      tractorBrand ? `트랙터 제조사: ${tractorBrand}` : "",
      tractorModel ? `트랙터 모델: ${tractorModel}` : "",
      tractorHp ? `트랙터 마력: ${tractorHp}마력` : "",
      equipmentInterest ? `관심 장비: ${equipmentInterest}` : "",
      diagnosisId ? `진단ID: ${diagnosisId}` : "",
      imageUrl ? `사진URL: ${imageUrl}` : "",
      routing.vendor_target !== "unassigned"
        ? `연결업체: ${routing.vendor_target}`
        : "연결업체: 관리자 확인 필요",
      routing.commission_rate
        ? `예상 마진율: ${Math.round(routing.commission_rate * 100)}%`
        : "",
      extraMessage ? `문의내용: ${extraMessage}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("photodoctor_consults")
      .insert({
        name: farmerName,
        phone: farmerPhone,

        crop: cropName || null,
        province: province || null,
        city: city || null,

        issue: issueType || null,
        diagnosis_id: diagnosisId || null,

        product_name: productName || null,
        area_text: areaText || null,
        image_url: imageUrl || null,
        message,

        vendor_target: routing.vendor_target,
        commission_rate: routing.commission_rate,
        priority:
          routing.vendor_target === "dof" ? "high" : getPriority(issueType),

        status: "new",
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("photodoctor_consults insert error:", error);

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const farmerPayload: Record<string, unknown> = {
      name: farmerName,
      phone: farmerPhone,

      province: province || null,
      city: city || null,
      region: regionText || null,

      main_crop: cropName || null,
      last_crop: cropName || null,
      last_issue: issueType || null,

      farm_size_text: areaText || null,
      farm_size_pyeong: areaPyeong,
      farm_size_source: areaText ? "photodoctor_consult" : null,

      last_product_interest: productName || null,
      last_order_area_text: areaText || null,

      tractor_brand: tractorBrand || null,
      tractor_model: tractorModel || null,
      tractor_hp: tractorHp,

      source: "photodoctor",
      last_seen_at: now,
      updated_at: now,
    };

    if (equipmentInterest) {
      farmerPayload.equipment_interests = [equipmentInterest];
    }

    const { error: farmerError } = await supabase.from("farmers").upsert(
      farmerPayload,
      {
        onConflict: "phone",
      }
    );

    if (farmerError) {
      console.error("farmers upsert error:", farmerError);
    }

    const { error: countError } = await supabase.rpc(
      "increment_farmer_consult",
      {
        target_phone: farmerPhone,
      }
    );

    if (countError) {
      console.error("increment_farmer_consult error:", countError);
    }

    return NextResponse.json({
      ok: true,
      item: data,
      routing,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "상담 요청 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}