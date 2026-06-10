import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EvidenceImage = {
  image_url?: string;
  image_type?: string;
  reason?: string;
};

type ProductCandidate = {
  product_name?: string;
  category?: string;
  recommended_hall?: string;
  short_description?: string;
  ingredients?: string;
  usage?: string;
  target_crop?: string;
  selling_point?: string;
  priority?: "상" | "중" | "하" | string;
  priority_reason?: string;
  farmer_pain_point?: string;
  proof_needed?: string;
  kafs_tv_strategy?: string;
  legal_notice?: string;
  image_url?: string;
  evidence_images?: EvidenceImage[];
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

type WebsiteImage = {
  image_url: string;
  alt: string;
  page_url: string;
};

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  basic: 3,
  growth: 10,
  premium: 20,
  vip: 50,
};

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function normalizePlan(v: unknown) {
  const plan = cleanText(v).toLowerCase();
  return PLAN_LIMITS[plan] ? plan : "free";
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

function absoluteUrl(baseUrl: string, href: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function sameHost(a: string, b: string) {
  try {
    return new URL(a).hostname === new URL(b).hostname;
  } catch {
    return false;
  }
}

function isLikelyUsefulImage(url: string) {
  const u = url.toLowerCase();

  if (!u) return false;
  if (u.startsWith("data:")) return false;
  if (u.includes("logo")) return false;
  if (u.includes("favicon")) return false;
  if (u.includes("icon")) return false;
  if (u.includes("blank")) return false;
  if (u.includes("spinner")) return false;
  if (u.includes("loading")) return false;

  return (
    u.includes(".jpg") ||
    u.includes(".jpeg") ||
    u.includes(".png") ||
    u.includes(".webp") ||
    u.includes(".gif")
  );
}

function extractImages(baseUrl: string, pageUrl: string, html: string): WebsiteImage[] {
  const images: WebsiteImage[] = [];
  const imgMatches = Array.from(html.matchAll(/<img[^>]*>/gi));

  for (const match of imgMatches) {
    const tag = match[0] || "";

    const src =
      tag.match(/\ssrc=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-src=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-original=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-lazy=["']([^"']+)["']/i)?.[1] ||
      "";

    const alt = tag.match(/\salt=["']([^"']*)["']/i)?.[1] || "";
    const imageUrl = absoluteUrl(baseUrl, src);

    if (!imageUrl) continue;
    if (!isLikelyUsefulImage(imageUrl)) continue;

    images.push({
      image_url: imageUrl,
      alt: cleanText(alt),
      page_url: pageUrl,
    });
  }

  return images;
}

function extractUsefulLinks(baseUrl: string, html: string) {
  const links = Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
    .map((m) => absoluteUrl(baseUrl, m[1] || ""))
    .filter(Boolean)
    .filter((url) => sameHost(baseUrl, url))
    .filter((url) => {
      const u = url.toLowerCase();

      return (
        u.includes("product") ||
        u.includes("shop") ||
        u.includes("goods") ||
        u.includes("item") ||
        u.includes("catalog") ||
        u.includes("solution") ||
        u.includes("brand") ||
        u.includes("fertilizer") ||
        u.includes("nutrition") ||
        u.includes("pesticide") ||
        u.includes("bio") ||
        u.includes("insect") ||
        u.includes("health")
      );
    });

  return Array.from(new Set(links)).slice(0, 18);
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 K-Agri-Expo-Vendor-AutoImport",
    },
  });

  if (!res.ok) {
    throw new Error(`홈페이지를 읽지 못했습니다. 상태코드: ${res.status}`);
  }

  return res.text();
}

async function fetchWebsiteBundle(url: string) {
  const mainHtml = await fetchHtml(url);
  const links = extractUsefulLinks(url, mainHtml);

  const pageTexts: string[] = [];
  const imageList: WebsiteImage[] = [];

  pageTexts.push(`[MAIN PAGE: ${url}]\n${stripHtml(mainHtml)}`);
  imageList.push(...extractImages(url, url, mainHtml));

  const subResults = await Promise.allSettled(
    links.map(async (link) => {
      const html = await fetchHtml(link);

      return {
        link,
        text: `[SUB PAGE: ${link}]\n${stripHtml(html)}`,
        images: extractImages(url, link, html),
      };
    }),
  );

  for (const result of subResults) {
    if (result.status === "fulfilled") {
      pageTexts.push(result.value.text);
      imageList.push(...result.value.images);
    }
  }

  const uniqueImages = Array.from(
    new Map(imageList.map((img) => [img.image_url, img])).values(),
  ).slice(0, 120);

  return {
    links,
    images: uniqueImages,
    text: pageTexts.join("\n\n").slice(0, 70000),
  };
}

function imageListText(images: WebsiteImage[]) {
  return images
    .map(
      (img, index) =>
        `${index + 1}. ${img.image_url}\nALT: ${img.alt || "없음"}\nPAGE: ${
          img.page_url
        }`,
    )
    .join("\n\n")
    .slice(0, 30000);
}

async function analyzeWithOpenAi({
  websiteUrl,
  websiteText,
  websiteImages,
  vendorPlan,
  productLimit,
}: {
  websiteUrl: string;
  websiteText: string;
  websiteImages: WebsiteImage[];
  vendorPlan: string;
  productLimit: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const prompt = `
너는 K-Agri Expo의 업체 자동입점 분석가이자 한국농수산TV 농자재 제품 성장 컨설턴트다.

목표:
홈페이지 텍스트와 이미지 목록을 함께 보고 실제 판매/홍보 가능한 제품 후보를 최대한 빠짐없이 추출하라.
각 제품마다 대표 제품사진과 근거 이미지를 가능한 한 연결하라.

현재 업체 요금제:
- plan: ${vendorPlan}
- 이번 자동등록 권장 최대 제품 수: ${productLimit}개

중요 원칙:
- 회사 소개, 인사말, 공지사항, 메뉴명만 있는 항목은 제품으로 만들지 마라.
- 제품명, 성분, 함량, 사용법, 적용작물, 효능, 시험사례, 인증, 카탈로그 표현이 있는 항목은 제품 후보로 인정하라.
- 제품을 일부러 적게 뽑지 마라. 실제 제품 후보는 최대한 많이 추출하라.
- 단, 우선 등록 추천은 현재 요금제 기준 ${productLimit}개 안에서 가장 팔릴 가능성이 높은 제품만 고르라.
- 상품 수보다 "농민이 살 이유"를 더 중요하게 판단하라.
- 고함량 성분은 강한 차별점으로 인정하라.
- 병해충 제품은 균 실험, 적용병해, 전후사진, 농가사례가 중요하다.
- 영양제/비료 제품은 함량, 사용시기, 작물별 사용법, 엽면/관주 여부가 중요하다.
- 한미양행 같은 건강식품/미래식량 업체는 고소애, 곤충단백질, 건강기능식품, 컨테이너 곤충농장, 교육, 전량수매 모델까지 후보로 인정하라.
- 농기계, 종자, 스마트농업, AI농업 제품도 후보로 인정하라.
- 주류, 의약품, 과장효능, 건강기능식품 표현은 법적 확인 필요성을 legal_notice에 적어라.

이미지 판단 원칙:
- 제품 포장 사진, 제품 병/봉투/박스 사진은 image_url 대표 이미지로 우선 배정하라.
- 성분표, 함량표, 사용량표, 시험결과표, 전후사진, 실험사진은 evidence_images에 넣어라.
- 이미지 URL의 파일명, alt, 해당 페이지 URL을 보고 제품명과 최대한 매칭하라.
- 확실하지 않으면 image_url은 비워도 되지만, 관련 가능성이 있는 이미지는 evidence_images에 "기타"로 넣어라.
- 로고, 아이콘, 배너, 장식 이미지는 제품 이미지로 쓰지 마라.

추천 전시장 분류:
- 작물영양관
- 병해충솔루션관
- 농기계·장비관
- 종자·육묘관
- 스마트농업·AI관
- 미래식량·곤충관
- 건강식품·가공관
- AI 확인 필요

홈페이지 주소:
${websiteUrl}

홈페이지 텍스트:
${websiteText}

수집된 이미지 목록:
${imageListText(websiteImages) || "이미지 없음"}

반환 JSON 형식:
{
  "company_summary": "이 업체가 어떤 업체인지 3문장 요약",
  "recommended_plan": {
    "plan_key": "free | basic | growth | premium | vip",
    "plan_name": "추천 요금제 이름",
    "reason": "이 요금제를 추천하는 이유"
  },
  "products": [
    {
      "product_name": "제품명",
      "category": "제품 분류",
      "recommended_hall": "추천 전시장",
      "short_description": "제품 한 줄 설명",
      "ingredients": "성분/함량/원료 정보",
      "usage": "사용법/적용작물/사용시기",
      "target_crop": "주요 대상 작물",
      "selling_point": "농민에게 어필할 핵심 소구점",
      "farmer_pain_point": "이 제품이 해결하는 농민의 문제",
      "priority": "상 | 중 | 하",
      "priority_reason": "왜 이 우선순위인지",
      "proof_needed": "판매력을 높이기 위해 추가로 필요한 자료",
      "kafs_tv_strategy": "한국농수산TV와 협업하면 좋은 방식",
      "legal_notice": "법적/표시광고/인증 확인 필요사항. 없으면 빈 문자열",
      "image_url": "대표 제품 이미지 URL",
      "evidence_images": [
        {
          "image_url": "근거 이미지 URL",
          "image_type": "제품사진 | 성분표 | 실험사진 | 전후사진 | 사용량표 | 시험자료 | 기타",
          "reason": "왜 이 제품의 근거 이미지인지"
        }
      ]
    }
  ],
  "top_recommendations": [
    "가장 먼저 입점시킬 제품과 이유"
  ],
  "kafs_tv_package_suggestion": "이 업체에게 제안할 한국농수산TV 협업 패키지",
  "final_comment": "업체 담당자가 보면 설득될 수 있는 최종 컨설팅 코멘트"
}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AUTO_IMPORT_MODEL || "gpt-4.1-mini",
      input: prompt,
      temperature: 0.2,
    }),
  });

  const json = (await response.json()) as OpenAiResponseJson;

  if (!response.ok) {
    throw new Error(json.error?.message || "OpenAI 분석 요청 실패");
  }

  const outputText =
    json.output_text ||
    json.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n") ||
    "";

  const parsed = safeJsonParse(outputText) as {
    company_summary?: string;
    recommended_plan?: {
      plan_key?: string;
      plan_name?: string;
      reason?: string;
    };
    products?: ProductCandidate[];
    top_recommendations?: string[];
    kafs_tv_package_suggestion?: string;
    final_comment?: string;
  } | null;

  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error("AI 제품 추출 결과를 읽지 못했습니다.");
  }

  return parsed;
}

function priorityRank(priority?: string) {
  if (priority === "상") return 1;
  if (priority === "중") return 2;
  if (priority === "하") return 3;
  return 9;
}

function cleanEvidenceImages(v: unknown): EvidenceImage[] {
  if (!Array.isArray(v)) return [];

  return v
    .map((item) => ({
      image_url: cleanText(item?.image_url),
      image_type: cleanText(item?.image_type) || "기타",
      reason: cleanText(item?.reason),
    }))
    .filter((item) => item.image_url)
    .slice(0, 8);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const websiteUrl = cleanText(body.website_url);
    const importMode = cleanText(body.import_mode) || "website";
    const vendorPlan = normalizePlan(body.vendor_plan);
    const productLimit = PLAN_LIMITS[vendorPlan] || PLAN_LIMITS.free;

    if (!websiteUrl) {
      return NextResponse.json(
        { ok: false, error: "홈페이지 주소가 필요합니다." },
        { status: 400 },
      );
    }

    const { text: websiteText, links, images } = await fetchWebsiteBundle(websiteUrl);

    const analysis = await analyzeWithOpenAi({
      websiteUrl,
      websiteText,
      websiteImages: images,
      vendorPlan,
      productLimit,
    });

    const rawProducts = analysis.products || [];

    const sortedProducts = rawProducts
      .map((item, index) => ({
        temp_id: `temp-${index + 1}`,
        product_name: cleanText(item.product_name) || `제품 후보 ${index + 1}`,
        category: cleanText(item.category) || "AI 확인 필요",
        recommended_hall: cleanText(item.recommended_hall) || "AI 확인 필요",
        short_description: cleanText(item.short_description),
        ingredients: cleanText(item.ingredients),
        usage: cleanText(item.usage),
        target_crop: cleanText(item.target_crop),
        selling_point: cleanText(item.selling_point),
        farmer_pain_point: cleanText(item.farmer_pain_point),
        priority: cleanText(item.priority) || "중",
        priority_reason: cleanText(item.priority_reason),
        proof_needed: cleanText(item.proof_needed),
        kafs_tv_strategy: cleanText(item.kafs_tv_strategy),
        legal_notice: cleanText(item.legal_notice),
        image_url: cleanText(item.image_url),
        evidence_images: cleanEvidenceImages(item.evidence_images),
        source: "website",
        selected: false,
      }))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

    const products = sortedProducts.map((item, index) => ({
      ...item,
      selected: index < productLimit,
    }));

    const recommendedProducts = products.filter((item) => item.selected);

    return NextResponse.json({
      ok: true,
      mode: importMode,
      website_url: websiteUrl,
      crawled_links: links,
      crawled_image_count: images.length,
      crawled_images: images.slice(0, 60),
      vendor_plan: vendorPlan,
      product_limit: productLimit,
      total: products.length,
      selected_recommend_count: recommendedProducts.length,
      company_summary: cleanText(analysis.company_summary),
      recommended_plan: analysis.recommended_plan || null,
      top_recommendations: Array.isArray(analysis.top_recommendations)
        ? analysis.top_recommendations.map(cleanText).filter(Boolean)
        : [],
      kafs_tv_package_suggestion: cleanText(analysis.kafs_tv_package_suggestion),
      final_comment: cleanText(analysis.final_comment),
      products,
      recommended_products: recommendedProducts,
      message: `${products.length}개 제품 후보를 발견했습니다. 현재 요금제 기준 우선 등록 추천은 ${recommendedProducts.length}개입니다.`,
    });
  } catch (error) {
    console.error("[vendor/auto-import] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 자동입점 분석 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}