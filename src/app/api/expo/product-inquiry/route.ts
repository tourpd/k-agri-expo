import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BOOOTH_ID = "4348fa3a-f0f5-4aa2-b680-eff71d8cc98f";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const d = onlyDigits(v);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return v;
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

    const name = safe(body.name);
    const phoneRaw = safe(body.phone);
    const phone = formatPhone(phoneRaw);

    const productName = safe(body.product);
    const cropName = safe(body.crop);
    const issueType = safe(body.issue);
    const diagnosisId = safe(body.diagnosis_id);
    const areaText = safe(body.area_text);
    const extraMessage = safe(body.message);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (onlyDigits(phoneRaw).length < 10) {
      return NextResponse.json(
        { ok: false, error: "전화번호를 정확히 입력해주세요." },
        { status: 400 }
      );
    }

    const routing = getVendorRouting(productName);

    const message = [
      "포토닥터 진단 결과 기반 제품 상담·구매 신청",
      productName ? `제품: ${productName}` : "",
      cropName ? `작물: ${cropName}` : "",
      issueType ? `진단/증상: ${issueType}` : "",
      areaText ? `재배면적: ${areaText}` : "",
      diagnosisId ? `진단ID: ${diagnosisId}` : "",
      routing.vendor_target
        ? `연결업체: ${routing.vendor_target}`
        : "",
      routing.commission_rate
        ? `마진율: ${Math.round(routing.commission_rate * 100)}%`
        : "",
      extraMessage ? `문의내용: ${extraMessage}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("booth_leads")
      .insert({
        booth_id: DEFAULT_BOOOTH_ID,

        farmer_name: name,
        farmer_phone: phone,

        product_name: productName || null,
        crop_name: cropName || null,
        issue_type: issueType || null,
        area_text: areaText || null,

        message,
        source_type: "photodoctor_product",
        source_ref_id: diagnosisId || null,

        vendor_target: routing.vendor_target,
        commission_rate: routing.commission_rate,
        sale_status: "new",

        status: "new",
        priority: routing.vendor_target === "dof" ? "high" : "normal",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
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
            : "제품 상담 신청 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}