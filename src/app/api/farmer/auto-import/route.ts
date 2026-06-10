import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductCandidate = {
  product_name?: string;
  category?: string;
  origin_region?: string;
  unit_label?: string;
  price_krw?: number;
  short_description?: string;
  processing_type?: string;
  storage_method?: string;
  shipping_method?: string;
  selling_point?: string;
  legal_notice?: string;
};

type OpenAiResponseJson = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function fetchWebsiteText(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 K-Agri-Expo-Farmer-AutoImport",
    },
  });

  if (!res.ok) {
    throw new Error(`홈페이지를 읽지 못했습니다. 상태코드: ${res.status}`);
  }

  const html = await res.text();
  return stripHtml(html).slice(0, 40000);
}

async function analyzeWithOpenAi({
  websiteUrl,
  websiteText,
}: {
  websiteUrl: string;
  websiteText: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const prompt = `
너는 K-Agri Expo 농민직거래관의 상품 자동등록 분석가다.

아래 홈페이지 텍스트에서 실제 판매 가능한 상품 후보를 빠짐없이 추출하라.

추출 대상:
- 농산물: 마늘, 양파, 쌀, 고추, 사과, 배, 감귤, 딸기, 감자, 고구마 등
- 가공식품: 즙, 분말, 환, 청, 잼, 장아찌, 김치, 반찬, 소스, 기름, 떡, 한과 등
- 축산물/육류: 한우, 돼지고기, 소고기, 양념육, 불고기, 갈비, 소시지, 육포, 곰탕, 사골, 선물세트 등
- 전통주/막걸리: 막걸리, 약주, 청주, 전통주, 지역주
- 선물세트
- 체험상품
- 정기배송 상품

중요 원칙:
- 회사 소개, 인사말, 공지사항, 메뉴명만 있는 것은 상품으로 만들지 마라.
- 상품명처럼 보이는 항목은 최대한 누락하지 마라.
- 가격, 단위, 원산지, 배송방식, 보관방법이 보이면 반드시 추출하라.
- 육류/축산물은 냉장·냉동 배송 필요 여부를 legal_notice에 적어라.
- 막걸리/전통주는 자동 후보로 추출하되 legal_notice에 "전통주 통신판매 가능 여부 확인 필요"라고 적어라.
- 확실하지 않은 상품은 category를 "AI 확인 필요"로 표시하라.
- 결과는 반드시 JSON만 반환하라.

홈페이지 주소:
${websiteUrl}

홈페이지 텍스트:
${websiteText}

반환 형식:
{
  "products": [
    {
      "product_name": "상품명",
      "category": "농산물 | 가공식품 | 축산물/육류 | 전통주/막걸리 | 선물세트 | 체험상품 | 정기배송 | AI 확인 필요",
      "origin_region": "원산지 또는 지역",
      "unit_label": "예: 5kg, 10kg, 30포, 1박스",
      "price_krw": 0,
      "short_description": "소비자에게 보여줄 한 줄 설명",
      "processing_type": "생물/건조/착즙/발효/냉동/냉장/가공 등",
      "storage_method": "상온/냉장/냉동/직사광선 피함 등",
      "shipping_method": "택배/냉장택배/냉동택배/직접수령 등",
      "selling_point": "소비자가 믿고 살 수 있는 핵심 소구점",
      "legal_notice": "필요 시 표시. 없으면 빈 문자열"
    }
  ]
}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_FARMER_AUTO_IMPORT_MODEL || "gpt-4.1-mini",
      input: prompt,
      temperature: 0.2,
    }),
  });

  const json = (await response.json()) as OpenAiResponseJson;

  if (!response.ok) {
    throw new Error(json.error?.message || "AI 농산물 분석 요청 실패");
  }

  const outputText =
    json.output_text ||
    json.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n") ||
    "";

  const parsed = safeJsonParse(outputText) as { products?: ProductCandidate[] } | null;

  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error("AI 상품 추출 결과를 읽지 못했습니다.");
  }

  return parsed.products;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const websiteUrl = cleanText(body.website_url);
    const importMode = cleanText(body.import_mode) || "farmer_homepage";

    if (!websiteUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "홈페이지 주소가 필요합니다.",
        },
        { status: 400 },
      );
    }

    const websiteText = await fetchWebsiteText(websiteUrl);

    const aiProducts = await analyzeWithOpenAi({
      websiteUrl,
      websiteText,
    });

    const products = aiProducts.map((item, index) => ({
      temp_id: `farmer-temp-${index + 1}`,
      product_name: cleanText(item.product_name) || `상품 후보 ${index + 1}`,
      category: cleanText(item.category) || "AI 확인 필요",
      origin_region: cleanText(item.origin_region),
      unit_label: cleanText(item.unit_label),
      price_krw:
        typeof item.price_krw === "number" && Number.isFinite(item.price_krw)
          ? item.price_krw
          : undefined,
      short_description: cleanText(item.short_description),
      processing_type: cleanText(item.processing_type),
      storage_method: cleanText(item.storage_method),
      shipping_method: cleanText(item.shipping_method),
      selling_point: cleanText(item.selling_point),
      legal_notice: cleanText(item.legal_notice),
      source: "farmer_homepage",
      selected: true,
    }));

    return NextResponse.json({
      ok: true,
      mode: importMode,
      website_url: websiteUrl,
      total: products.length,
      products,
      message: `${products.length}개 농산물·가공식품·지역상품 후보를 발견했습니다.`,
    });
  } catch (error) {
    console.error("[farmer/auto-import] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "농민 상품 자동등록 분석 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}