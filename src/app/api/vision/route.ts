import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";

// ✅ 포토닥터 제품신청 리드를 받을 기본 부스
const DEFAULT_PHOTODOCTOR_BOOTH_ID = "4348fa3a-f0f5-4aa2-b680-eff71d8cc98f";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function safeFileName(name: string) {
  return name
    .replace(/[^\w.\-가-힣]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

async function fileToBase64(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

function normalizeCauses(parsed: any) {
  const raw = Array.isArray(parsed?.possible_causes)
    ? parsed.possible_causes
    : [];

  const causes = raw.slice(0, 3).map((c: any, index: number) => ({
    name: safeText(c?.name) || `${index + 1}순위 의심 원인`,
    probability:
      typeof c?.probability === "number" && Number.isFinite(c.probability)
        ? Math.max(0, Math.min(100, Math.round(c.probability)))
        : 0,
    reason: safeText(c?.reason),
  }));

  while (causes.length < 3) {
    causes.push({
      name: `${causes.length + 1}순위 추가 확인 필요`,
      probability: 0,
      reason: "사진만으로는 추가 원인을 확정하기 어렵습니다.",
    });
  }

  return causes;
}

function recommendProductName(issueType: string) {
  const issue = issueType.toLowerCase();

  if (
    issue.includes("탄저") ||
    issue.includes("노균") ||
    issue.includes("흰가루") ||
    issue.includes("역병") ||
    issue.includes("곰팡이") ||
    issue.includes("병")
  ) {
    return "멸규니";
  }

  if (
    issue.includes("총채") ||
    issue.includes("진딧") ||
    issue.includes("응애") ||
    issue.includes("나방") ||
    issue.includes("벌레") ||
    issue.includes("해충") ||
    issue.includes("충")
  ) {
    return "싹쓰리충";
  }

  return "싹쓰리충 골드";
}

async function uploadDiagnosisImage({
  file,
  diagnosisId,
}: {
  file: File;
  diagnosisId: string;
}) {
  const admin = createSupabaseAdminClient();

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `photodoctor/${diagnosisId}/${Date.now()}-${safeFileName(
    file.name || `diagnosis.${ext}`
  )}`;

  const bytes = await file.arrayBuffer();

  const upload = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const pub = admin.storage.from(BUCKET).getPublicUrl(path);
  return pub.data.publicUrl;
}

async function saveCrmLead({
  diagnosisId,
  imageUrl,
  crop,
  province,
  city,
  finalData,
}: {
  diagnosisId: string;
  imageUrl: string;
  crop: string;
  province: string;
  city: string;
  finalData: any;
}) {
  try {
    const admin = createSupabaseAdminClient();

    const firstCause = finalData?.possible_causes?.[0];
    const issueType =
      safeText(firstCause?.name) ||
      safeText(finalData?.diagnosis) ||
      safeText(finalData?.final_judgement);

    const productName = recommendProductName(issueType);

    const { data: booth } = await admin
      .from("booths")
      .select("booth_id, vendor_id, hall_id, slot_code, title")
      .eq("booth_id", DEFAULT_PHOTODOCTOR_BOOTH_ID)
      .maybeSingle();

    const boothId = booth?.booth_id || DEFAULT_PHOTODOCTOR_BOOTH_ID;

    await admin.from("booth_leads").insert({
      lead_id: crypto.randomUUID(),
      booth_id: boothId,
      vendor_id: booth?.vendor_id || null,
      hall_id: booth?.hall_id || null,
      slot_code: booth?.slot_code || null,

      farmer_name: "포토닥터 진단 농민",
      farmer_phone: "미입력",
      farmer_email: null,

      product_name: productName,
      crop_name: finalData?.crop || crop || null,
      issue_type: issueType || null,
      area_text: null,

      message: [
        finalData?.final_judgement || "",
        province || city ? `지역: ${province} ${city}`.trim() : "",
        imageUrl ? `사진: ${imageUrl}` : "",
        diagnosisId ? `진단ID: ${diagnosisId}` : "",
      ]
        .filter(Boolean)
        .join("\n"),

      source_type: "photodoctor_product",
      source_ref_id: diagnosisId,

      status: "new",
      priority: "high",

      estimated_amount_krw: 0,
      final_amount_krw: null,
      commission_rate: 0,
      commission_amount_krw: 0,
      contact_unlocked: false,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[vision] booth_leads insert failed:", error);
  }
}

async function getRecommendedItems({
  req,
  crop,
  diagnosisId,
  finalData,
}: {
  req: Request;
  crop: string;
  diagnosisId: string;
  finalData: any;
}) {
  try {
    const firstCause = finalData?.possible_causes?.[0];

    const baseUrl = new URL(req.url).origin;

    const issueType =
      safeText(firstCause?.name) ||
      safeText(finalData?.diagnosis) ||
      safeText(finalData?.final_judgement);

    const diagnosisText = [
      safeText(firstCause?.name),
      safeText(finalData?.diagnosis),
      safeText(finalData?.final_judgement),
    ]
      .filter(Boolean)
      .join(" ");

    if (!issueType && !diagnosisText) return [];

    const res = await fetch(`${baseUrl}/api/photodoctor/recommend-booths`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        crop_name: crop || finalData?.crop || "",
        issue_type: issueType,
        diagnosis_text: diagnosisText,
        diagnosis: safeText(finalData?.diagnosis),
        final_judgement: safeText(finalData?.final_judgement),
        diagnosis_id: diagnosisId,
        limit: 3,
      }),
    });

    const json = await res.json().catch(() => null);

    if (json?.success && Array.isArray(json.items)) {
      return json.items;
    }

    return [];
  } catch (error) {
    console.error("[vision] recommend items failed:", error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const image = formData.get("image");
    const crop = safeText(formData.get("crop"));
    const province = safeText(formData.get("province"));
    const city = safeText(formData.get("city"));

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { ok: false, error: "진단할 이미지가 없습니다." },
        { status: 400 }
      );
    }

    const diagnosisId = `PD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const imageUrl = await uploadDiagnosisImage({
      file: image,
      diagnosisId,
    });

    const mimeType = image.type || "image/jpeg";
    const base64 = await fileToBase64(image);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const prompt = `
당신은 한국 농민을 돕는 작물 병해충 진단 보조 시스템입니다.

입력 정보:
- 작물: ${crop || "미입력"}
- 지역: ${province || "미입력"} ${city || ""}

반드시 JSON만 반환하세요.
마크다운, 설명문, 코드블록은 절대 쓰지 마세요.

중요:
- possible_causes는 반드시 3개를 반환하세요.
- 가능성이 높은 순서대로 정렬하세요.
- 각 probability는 0~100 숫자입니다.
- diagnosis와 final_judgement는 1순위 진단 기준으로 작성하세요.

JSON 형식:
{
  "ok": true,
  "crop": "작물명",
  "province": "도",
  "city": "시군",
  "diagnosis": "1순위 병해충명 또는 생육 문제",
  "final_judgement": "농민에게 보여줄 쉬운 진단 문장",
  "confidence": 0,
  "possible_causes": [
    {
      "name": "1순위 가능 원인",
      "probability": 0,
      "reason": "사진에서 그렇게 본 이유"
    },
    {
      "name": "2순위 가능 원인",
      "probability": 0,
      "reason": "사진에서 그렇게 본 이유"
    },
    {
      "name": "3순위 가능 원인",
      "probability": 0,
      "reason": "사진에서 그렇게 본 이유"
    }
  ],
  "symptoms": ["사진에서 보이는 증상"],
  "do_now": ["지금 바로 할 일"],
  "do_not": ["하지 말아야 할 일"],
  "must_check": ["농민이 추가로 확인할 것"]
}

주의:
- 확신이 낮으면 단정하지 말고 '의심'으로 표현하세요.
- 농약 제품명을 임의로 추천하지 마세요.
- 병해는 하루아침에 끝나지 않습니다. 관찰과 반복 확인이 필요하다는 취지를 포함하세요.
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";

    let parsed: any;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        ok: true,
        crop,
        province,
        city,
        diagnosis: "진단 결과 파싱 실패",
        final_judgement: content,
        confidence: 0,
        possible_causes: [],
        symptoms: [],
        do_now: [],
        do_not: [],
        must_check: [],
      };
    }

    const possibleCauses = normalizeCauses(parsed);
    const firstCause = possibleCauses[0];

    const finalData = {
      ok: true,
      ...parsed,
      crop: parsed?.crop || crop,
      province: parsed?.province || province,
      city: parsed?.city || city,
      diagnosis: parsed?.diagnosis || firstCause.name,
      final_judgement:
        parsed?.final_judgement ||
        `${firstCause.name} 가능성이 가장 높습니다. 사진과 농장 상황을 함께 확인해 주세요.`,
      confidence:
        typeof parsed?.confidence === "number" && Number.isFinite(parsed.confidence)
          ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
          : firstCause.probability,
      possible_causes: possibleCauses,
      diagnosis_id: diagnosisId,
      image_url: imageUrl,
    };

    const admin = createSupabaseAdminClient();

    const logInsert = await admin
      .from("photodoctor_raw_logs")
      .insert({
        diagnosis_id: diagnosisId,
        crop: finalData.crop,
        province: finalData.province,
        city: finalData.city,
        image_url: imageUrl,
        diagnosis: finalData.diagnosis,
        final_judgement: finalData.final_judgement,
        confidence: finalData.confidence,
        possible_causes: finalData.possible_causes,
        symptoms: finalData.symptoms || [],
        do_now: finalData.do_now || [],
        do_not: finalData.do_not || [],
        must_check: finalData.must_check || [],
        source: "k_agri_expo_ai_consult",
      })
      .select("id")
      .single();

    await saveCrmLead({
      diagnosisId,
      imageUrl,
      crop,
      province,
      city,
      finalData,
    });

    const recommended_items = await getRecommendedItems({
      req,
      crop,
      diagnosisId,
      finalData,
    });

    return NextResponse.json({
      ...finalData,
      recommended_items,
      raw_log_id: logInsert.data?.id || null,
      raw_log_error: logInsert.error?.message || null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "포토닥터 진단 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}