import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiResult = {
  detail_description?: string;
  target_crops?: string;
  use_season?: string;
  how_to_use?: string;
  dosage_guide?: string;
  cautions?: string;
  base_area_pyeong?: number | null;
  recommended_rounds?: number | null;
  spray_interval?: string;
  use_period?: string;
};

function cleanText(v: unknown) {
  const s = String(v || "").trim();
  return s ? s : null;
}

function cleanNumber(v: unknown) {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isPdfUrl(url?: string | null) {
  return String(url || "").toLowerCase().includes(".pdf");
}

function isImageUrl(url?: string | null) {
  const v = String(url || "").toLowerCase();
  return (
    v.includes(".jpg") ||
    v.includes(".jpeg") ||
    v.includes(".png") ||
    v.includes(".webp") ||
    v.includes(".gif")
  );
}

async function readPdfText(url: string) {
  const res = await fetch(url);

  if (!res.ok) return "";

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const parsed = await parser.getText();
    return String(parsed.text || "").slice(0, 12000);
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

  if (start >= 0 && end >= start) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function fallbackExtract(sourceText: string): AiResult {
  const text = String(sourceText || "");

  const dilution =
    text.match(/(\d{2,5})\s*배/)?.[0] ||
    text.match(/물\s*\d+\s*말[^.\n]*/)?.[0] ||
    "";

  const interval =
    text.match(/\d+\s*[~\-]\s*\d+\s*일\s*간격/)?.[0] ||
    text.match(/\d+\s*일\s*간격/)?.[0] ||
    "";

  const rounds =
    cleanNumber(text.match(/(\d+)\s*회\s*(살포|처리|사용)/)?.[1]) ||
    cleanNumber(text.match(/권장\s*살포\s*횟수[^0-9]*(\d+)/)?.[1]);

  const baseArea =
    cleanNumber(text.match(/1\s*(병|개|통)[^0-9]*(\d{2,6})\s*평/)?.[2]) ||
    cleanNumber(text.match(/(\d{2,6})\s*평/)?.[1]);

  return {
    detail_description: text.slice(0, 600) || "",
    target_crops: ["딸기", "오이", "토마토", "호박", "고추", "마늘", "양파", "배추", "상추", "감자", "고구마", "포도", "배", "사과", "복숭아", "감귤", "단감", "벼", "보리", "밀", "옥수수", "인삼", "드라지", "구기자"]
      .filter((x) => text.includes(x))
      .join(", "),
    use_season: "",
    how_to_use: "",
    dosage_guide: dilution || "",
    cautions: "",
    base_area_pyeong: baseArea,
    recommended_rounds: rounds,
    spray_interval: interval || "",
    use_period: "",
  };
}

async function analyzeWithOpenAI(input: {
  productName: string;
  category?: string | null;
  shortDescription?: string | null;
  sourceText: string;
  imageUrls: string[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackExtract(input.sourceText);
  }

  const model =
    process.env.OPENAI_OCR_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini";

  const content: any[] = [
    {
      type: "text",
      text: `
너는 한국 농자재 상세페이지 분석 담당자다.

아래 제품 카탈로그/설명서 내용을 읽고 K-Agri Expo 제품 상세페이지에 들어갈 값을 JSON으로만 작성해라.

반드시 JSON만 출력:
{
  "detail_description": "제품 특징 요약",
  "target_crops": "추천 작물",
  "use_season": "사용 시기",
  "how_to_use": "사용 방법",
  "dosage_guide": "희석배수와 평수별 사용량",
  "cautions": "주의사항",
  "base_area_pyeong": 숫자 또는 null,
  "recommended_rounds": 숫자 또는 null,
  "spray_interval": "예: 7~10일 간격",
  "use_period": "예: 생육기~수확 전"
}

계산 규칙:
- base_area_pyeong은 1병/1개/1포 기준으로 몇 평을 1회 살포할 수 있는지 추정한다.
- recommended_rounds는 생육기부터 수확 전까지 권장 살포 횟수다.
- 정보가 없으면 억지로 만들지 말고 null 또는 빈 문자열로 둔다.
- 농민이 이해하기 쉽게 짧고 실용적으로 작성한다.

제품명: ${input.productName}
카테고리: ${input.category || ""}
한 줄 설명: ${input.shortDescription || ""}

추출 텍스트:
${input.sourceText || "텍스트 없음"}
      `.trim(),
    },
  ];

  for (const url of input.imageUrls.slice(0, 3)) {
    content.push({
      type: "image_url",
      image_url: {
        url,
      },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  if (!res.ok) {
    const fallback = await res.text();
    console.error("[ai-extract] OpenAI error:", fallback);
    return fallbackExtract(input.sourceText);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(extractJson(text)) as AiResult;
  } catch (e) {
    console.error("[ai-extract] JSON parse failed:", e, text);
    return fallbackExtract(input.sourceText);
  }
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
      .maybeSingle();

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
          if (pdfText) {
            sourceText += `\n\n${pdfText}`;
          }
        } catch (e) {
          console.error("[ai-extract] PDF read failed:", e);
        }
      }
    }

    const imageUrls = fileUrls.filter((url) => isImageUrl(url));

    const ai = await analyzeWithOpenAI({
      productName: product.product_name,
      category: product.category,
      shortDescription: product.short_description,
      sourceText,
      imageUrls,
    });

    const updatePayload = {
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
        cleanNumber(ai.recommended_rounds) ||
        product.recommended_rounds ||
        null,
      spray_interval: cleanText(ai.spray_interval) || product.spray_interval,
      use_period: cleanText(ai.use_period) || product.use_period,

      updated_at: new Date().toISOString(),
    };

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