import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fallbackAgriExtract } from "@/lib/expo/ai-extractors/agri-inputs";
import { fallbackFutureFoodExtract } from "@/lib/expo/ai-extractors/future-food-insect";
import type {
  AiExtractInput,
  AiExtractResult,
} from "@/lib/expo/ai-extractors/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMP_PRODUCT_NAME = "AI 분석 대기 제품";

type ProductRow = {
  id: string;
  product_name?: string | null;
  category?: string | null;
  short_description?: string | null;
  detail_description?: string | null;
  target_crops?: string | null;
  use_season?: string | null;
  how_to_use?: string | null;
  dosage_guide?: string | null;
  cautions?: string | null;
  base_area_pyeong?: number | null;
  recommended_rounds?: number | null;
  spray_interval?: string | null;
  use_period?: string | null;
  catalog_url?: string | null;
  manual_url?: string | null;
  image_url?: string | null;
  hall_key?: string | null;
  hall_id?: string | null;
  preferred_hall_1?: string | null;
  future_business_type?: string | null;
  container_farm_spec?: string | null;
  education_program?: string | null;
  buyback_terms?: string | null;
  healing_program?: string | null;
  functional_food_info?: string | null;
  patent_info?: string | null;
  target_customer?: string | null;
};

type ExtendedAiResult = AiExtractResult & {
  product_name?: string | null;
  category?: string | null;
  short_description?: string | null;
};

function cleanText(v: unknown) {
  const s = String(v || "").trim();
  return s ? s : null;
}

function cleanNumber(v: unknown) {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isTempName(v?: string | null) {
  const s = String(v || "").trim();
  return !s || s === TEMP_PRODUCT_NAME;
}

function isPdfUrl(url?: string | null) {
  return String(url || "").toLowerCase().includes(".pdf");
}

function isImageUrl(url?: string | null) {
  const v = String(url || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((x) =>
    v.includes(x)
  );
}

function normalizeHallKey(product: ProductRow) {
  const raw = String(
    product.hall_key ||
      product.hall_id ||
      product.preferred_hall_1 ||
      product.category ||
      ""
  ).toLowerCase();

  if (
    raw.includes("future_food_insect") ||
    raw.includes("future_insect") ||
    raw.includes("미래") ||
    raw.includes("곤충")
  ) {
    return "future_food_insect";
  }

  return "agri_inputs";
}

async function readPdfText(url: string) {
  const res = await fetch(url);
  if (!res.ok) return "";

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    return String(parsed.text || "").slice(0, 15000);
  } finally {
    await parser.destroy();
  }
}

function extractJson(text: string) {
  const raw = String(text || "").trim();

  const cleaned = raw
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end >= start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function guessProductNameFromText(sourceText: string) {
  const text = String(sourceText || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const badWords = [
    "제품명",
    "카탈로그",
    "사용방법",
    "주의사항",
    "농자재",
    "비료",
    "성분",
    "보증성분",
  ];

  const candidates = text
    .slice(0, 40)
    .map((x) => x.replace(/^[-•●○\s]+/, "").trim())
    .filter((x) => x.length >= 2 && x.length <= 30)
    .filter((x) => !badWords.some((b) => x === b))
    .filter((x) => !/^\d+$/.test(x));

  return candidates[0] || "";
}

async function analyzeWithOpenAI(input: {
  hallKey: string;
  productName: string;
  category: string;
  shortDescription: string;
  sourceText: string;
  imageUrls: string[];
}): Promise<ExtendedAiResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model =
    process.env.OPENAI_OCR_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const systemText =
    input.hallKey === "future_food_insect"
      ? "너는 K-Agri Expo 미래식량·곤충관 사업정보 분석 담당자다. 반드시 JSON만 출력한다."
      : "너는 한국 농자재 카탈로그 분석 담당자다. 제품 이미지, 카탈로그 이미지, PDF 내용을 보고 농민이 이해하기 쉽게 제품 정보를 분류한다. 반드시 JSON만 출력한다.";

  const prompt = `
기존 제품명: ${input.productName}
기존 카테고리: ${input.category}
기존 한 줄 설명: ${input.shortDescription}

아래 자료를 분석해서 JSON으로만 작성해라.

{
  "product_name": "제품명",
  "category": "제품 분류",
  "short_description": "농민용 한 줄 설명",
  "detail_description": "제품 특징 요약",
  "target_crops": "추천 작물",
  "use_season": "사용 시기",
  "how_to_use": "사용 방법",
  "dosage_guide": "사용량 또는 희석배수",
  "cautions": "주의사항",
  "base_area_pyeong": 숫자 또는 null,
  "recommended_rounds": 숫자 또는 null,
  "spray_interval": "살포 간격",
  "use_period": "사용 가능 시기",
  "future_business_type": "",
  "container_farm_spec": "",
  "education_program": "",
  "buyback_terms": "",
  "healing_program": "",
  "functional_food_info": "",
  "patent_info": "",
  "target_customer": ""
}

규칙:
- 기존 제품명이 "${TEMP_PRODUCT_NAME}"이면 반드시 카탈로그/이미지에서 실제 제품명을 찾아 product_name에 넣는다.
- 제품명은 제목, 포장 앞면, 상단 큰 글씨, 제품 라벨에서 우선 추출한다.
- 카테고리는 자료 성격에 맞게 넣는다. 예: 완효성 비료, 유기농자재, 살균제, 살충제, 영양제.
- 한 줄 설명은 농민이 바로 이해할 수 있게 짧게 쓴다.
- 자료에 표가 있으면 사용방법과 사용량에 반드시 반영한다.
- 정보가 없으면 억지로 만들지 말고 빈 문자열 또는 null로 둔다.
- 농자재 제품이면 미래식량 관련 필드는 빈 문자열로 둔다.

자료:
${input.sourceText || "텍스트 없음"}
`.trim();

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: `${systemText}\n\n${prompt}` }];

  for (const url of input.imageUrls.slice(0, 4)) {
    content.push({ type: "image_url", image_url: { url } });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    console.error("[ai-extract] OpenAI error:", await res.text());
    return null;
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(extractJson(text)) as ExtendedAiResult;
  } catch (error) {
    console.error("[ai-extract] JSON parse failed:", error, text);
    return null;
  }
}

function buildUpdatePayload(
  ai: ExtendedAiResult,
  product: ProductRow,
  sourceText: string
) {
  const guessedName = guessProductNameFromText(sourceText);
  const aiName = cleanText(ai.product_name);

  return {
    product_name: isTempName(product.product_name)
      ? aiName || guessedName || product.product_name
      : aiName || product.product_name,

    category: cleanText(ai.category) || product.category,
    short_description:
      cleanText(ai.short_description) || product.short_description,

    detail_description:
      cleanText(ai.detail_description) || product.detail_description,
    target_crops: cleanText(ai.target_crops) || product.target_crops,
    use_season: cleanText(ai.use_season) || product.use_season,
    how_to_use: cleanText(ai.how_to_use) || product.how_to_use,
    dosage_guide: cleanText(ai.dosage_guide) || product.dosage_guide,
    cautions: cleanText(ai.cautions) || product.cautions,

    base_area_pyeong:
      cleanNumber(ai.base_area_pyeong) || product.base_area_pyeong || null,
    recommended_rounds:
      cleanNumber(ai.recommended_rounds) || product.recommended_rounds || null,
    spray_interval: cleanText(ai.spray_interval) || product.spray_interval,
    use_period: cleanText(ai.use_period) || product.use_period,

    future_business_type:
      cleanText(ai.future_business_type) || product.future_business_type,
    container_farm_spec:
      cleanText(ai.container_farm_spec) || product.container_farm_spec,
    education_program:
      cleanText(ai.education_program) || product.education_program,
    buyback_terms: cleanText(ai.buyback_terms) || product.buyback_terms,
    healing_program: cleanText(ai.healing_program) || product.healing_program,
    functional_food_info:
      cleanText(ai.functional_food_info) || product.functional_food_info,
    patent_info: cleanText(ai.patent_info) || product.patent_info,
    target_customer: cleanText(ai.target_customer) || product.target_customer,

    updated_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body.product_id || "").trim();

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "product_id가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: product, error: productError } = await supabase
      .from("expo_brand_products")
      .select("*")
      .eq("id", productId)
      .maybeSingle<ProductRow>();

    if (productError) {
      return NextResponse.json(
        { ok: false, error: productError.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "제품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    let sourceText = [
      product.product_name,
      product.category,
      product.short_description,
      product.detail_description,
      product.how_to_use,
      product.dosage_guide,
      product.cautions,
      product.container_farm_spec,
      product.education_program,
      product.buyback_terms,
      product.healing_program,
      product.functional_food_info,
      product.patent_info,
      product.target_customer,
    ]
      .filter(Boolean)
      .join("\n\n");

    const fileUrls = [
      product.catalog_url,
      product.manual_url,
      product.image_url,
    ].filter(Boolean) as string[];

    for (const url of fileUrls) {
      if (isPdfUrl(url)) {
        try {
          const pdfText = await readPdfText(url);
          if (pdfText) sourceText += `\n\n${pdfText}`;
        } catch (error) {
          console.error("[ai-extract] PDF read failed:", error);
        }
      }
    }

    const input: AiExtractInput = {
      productName: product.product_name || "",
      category: product.category || "",
      shortDescription: product.short_description || "",
      sourceText,
      imageUrls: fileUrls.filter((url) => isImageUrl(url)),
    };

    const hallKey = normalizeHallKey(product);

    const aiFromOpenAI = await analyzeWithOpenAI({
      hallKey,
      productName: input.productName,
      category: input.category || "other",
      shortDescription: input.shortDescription || "",
      sourceText: input.sourceText || "",
      imageUrls: input.imageUrls || [],
    });

    const fallback =
      hallKey === "future_food_insect"
        ? fallbackFutureFoodExtract(input)
        : fallbackAgriExtract(input);

    const ai: ExtendedAiResult = {
      ...fallback,
      ...(aiFromOpenAI || {}),
    };

    const updatePayload = buildUpdatePayload(ai, product, sourceText);

    const { data: updated, error: updateError } = await supabase
      .from("expo_brand_products")
      .update(updatePayload)
      .eq("id", productId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      hall_key: hallKey,
      item: updated,
    });
  } catch (error) {
    console.error("[ai-extract] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 제품정보 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}