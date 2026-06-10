import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SelectedProduct = {
  temp_id?: string;
  product_name?: string;
  category?: string;
  page_hint?: string;
};

type EvidenceImage = {
  image_url?: string;
  image_type?: string;
  reason?: string;
};

type CrawledImage = {
  image_url: string;
  alt: string;
  page_url: string;
};

type OpenAiResponseJson = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ text?: string }>;
  }>;
  error?: { message?: string };
};

function clean(v: unknown) {
  return String(v || "").trim();
}

function compact(v: unknown) {
  return clean(v).toLowerCase().replace(/\s+/g, "");
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

function isUsefulImage(url: string) {
  const u = url.toLowerCase();
  if (!u || u.startsWith("data:")) return false;
  if (u.includes("logo") || u.includes("favicon") || u.includes("icon")) return false;
  if (u.includes("spinner") || u.includes("loading") || u.includes("blank")) return false;

  return (
    u.includes(".jpg") ||
    u.includes(".jpeg") ||
    u.includes(".png") ||
    u.includes(".webp") ||
    u.includes(".gif")
  );
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 K-Agri-Expo-Deep-Analysis" },
  });

  if (!res.ok) {
    throw new Error(`페이지를 읽지 못했습니다. 상태코드: ${res.status}`);
  }

  return res.text();
}

function extractLinks(baseUrl: string, html: string, productNames: string[]) {
  const names = productNames.map(compact).filter(Boolean);

  const hrefLinks = Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
    .map((m) => absoluteUrl(baseUrl, m[1] || ""))
    .filter(Boolean);

  const onclickLinks = Array.from(
    html.matchAll(/(?:location\.href|goUrl|goView|view)\(['"]([^'"]+)['"]/gi),
  )
    .map((m) => absoluteUrl(baseUrl, m[1] || ""))
    .filter(Boolean);

  const links = [...hrefLinks, ...onclickLinks]
    .filter((url) => sameHost(baseUrl, url))
    .filter((url) => {
      const u = decodeURIComponent(url.toLowerCase());
      const cu = compact(u);

      return (
        u.includes("product") ||
        u.includes("goods") ||
        u.includes("item") ||
        u.includes("view") ||
        u.includes("detail") ||
        u.includes("list") ||
        u.includes("cate") ||
        u.includes("idx") ||
        u.includes("seq") ||
        names.some((name) => name && cu.includes(name))
      );
    });

  return Array.from(new Set(links)).slice(0, 120);
}

function extractImages(baseUrl: string, pageUrl: string, html: string): CrawledImage[] {
  const images: CrawledImage[] = [];
  const imgTags = Array.from(html.matchAll(/<img[^>]*>/gi));

  for (const match of imgTags) {
    const tag = match[0] || "";

    const src =
      tag.match(/\ssrc=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-src=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-original=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\sdata-lazy=["']([^"']+)["']/i)?.[1] ||
      "";

    const alt = tag.match(/\salt=["']([^"']*)["']/i)?.[1] || "";
    const imageUrl = absoluteUrl(baseUrl, src);

    if (!imageUrl || !isUsefulImage(imageUrl)) continue;

    images.push({
      image_url: imageUrl,
      alt: clean(alt),
      page_url: pageUrl,
    });
  }

  return images;
}

function scoreImageForProduct(img: CrawledImage, productName: string) {
  const name = compact(productName);
  const url = compact(decodeURIComponent(img.image_url));
  const alt = compact(img.alt);
  const page = compact(decodeURIComponent(img.page_url));

  let score = 0;

  if (name && url.includes(name)) score += 80;
  if (name && alt.includes(name)) score += 70;
  if (name && page.includes(name)) score += 60;

  if (url.includes("product")) score += 20;
  if (url.includes("goods")) score += 20;
  if (url.includes("upload")) score += 15;
  if (url.includes("thumb")) score += 10;
  if (url.includes("view")) score += 10;

  if (url.includes("banner")) score -= 50;
  if (url.includes("visual")) score -= 40;
  if (url.includes("bg")) score -= 30;

  return score;
}

function pickImageForProduct(images: CrawledImage[], productName: string) {
  const ranked = images
    .map((img) => ({
      img,
      score: scoreImageForProduct(img, productName),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  if (!best || best.score < 20) return "";

  return best.img.image_url;
}

async function buildWebsiteContext(websiteUrl: string, selectedProducts: SelectedProduct[]) {
  const mainHtml = await fetchHtml(websiteUrl);
  const productNames = selectedProducts.map((p) => clean(p.product_name)).filter(Boolean);
  const links = extractLinks(websiteUrl, mainHtml, productNames);

  const texts: string[] = [`[MAIN: ${websiteUrl}]\n${stripHtml(mainHtml)}`];
  const images: CrawledImage[] = [...extractImages(websiteUrl, websiteUrl, mainHtml)];

  const subResults = await Promise.allSettled(
    links.map(async (link) => {
      const html = await fetchHtml(link);

      return {
        link,
        text: `[PAGE: ${link}]\n${stripHtml(html)}`,
        images: extractImages(websiteUrl, link, html),
      };
    }),
  );

  for (const result of subResults) {
    if (result.status === "fulfilled") {
      texts.push(result.value.text);
      images.push(...result.value.images);
    }
  }

  const uniqueImages = Array.from(
    new Map(images.map((img) => [img.image_url, img])).values(),
  ).slice(0, 300);

  return {
    crawled_links: links,
    text: texts.join("\n\n").slice(0, 90000),
    images: uniqueImages,
  };
}

function imagesToPromptText(images: CrawledImage[]) {
  return images
    .map(
      (img, index) =>
        `${index + 1}. ${img.image_url}\nALT: ${img.alt || "없음"}\nPAGE: ${img.page_url}`,
    )
    .join("\n\n")
    .slice(0, 30000);
}

function normalizeProduct(item: any, index: number, fixedImageUrl = "") {
  return {
    temp_id: clean(item?.temp_id) || `deep-${index + 1}`,
    product_name: clean(item?.product_name) || `제품 ${index + 1}`,
    category: clean(item?.category) || "AI 확인 필요",
    recommended_hall: clean(item?.recommended_hall) || "AI 확인 필요",
    short_description: clean(item?.short_description),
    ingredients: clean(item?.ingredients),
    usage: clean(item?.usage),
    target_crop: clean(item?.target_crop),
    selling_point: clean(item?.selling_point),
    farmer_pain_point: clean(item?.farmer_pain_point),
    priority: clean(item?.priority) || "중",
    priority_reason: clean(item?.priority_reason),
    proof_needed: clean(item?.proof_needed),
    kafs_tv_strategy: clean(item?.kafs_tv_strategy),
    legal_notice: clean(item?.legal_notice),
    image_url: fixedImageUrl || clean(item?.image_url),
    evidence_images: Array.isArray(item?.evidence_images)
      ? item.evidence_images
          .map((img: EvidenceImage) => ({
            image_url: clean(img?.image_url),
            image_type: clean(img?.image_type) || "기타",
            reason: clean(img?.reason),
          }))
          .filter((img: EvidenceImage) => img.image_url)
          .slice(0, 8)
      : [],
    source: "deep_analysis",
    selected: true,
    needs_deep_analysis: false,
  };
}

async function analyzeWithOpenAi({
  websiteUrl,
  websiteText,
  imageText,
  selectedProducts,
  vendorMemo,
}: {
  websiteUrl: string;
  websiteText: string;
  imageText: string;
  selectedProducts: SelectedProduct[];
  vendorMemo: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const prompt = `
너는 K-Agri Expo 업체 제품 정밀분석 담당자이자 한국농수산TV 농자재 성장 컨설턴트다.

아래 선택 제품만 정밀분석하라.

선택 제품:
${selectedProducts
  .map(
    (p, i) =>
      `${i + 1}. temp_id:${clean(p.temp_id)} / 제품명:${clean(
        p.product_name,
      )} / 기존분류:${clean(p.category)} / 위치힌트:${clean(p.page_hint)}`,
  )
  .join("\n")}

업체 의견:
${vendorMemo || "없음"}

홈페이지:
${websiteUrl}

수집 텍스트:
${websiteText}

수집 이미지:
${imageText || "이미지 없음"}

분석 원칙:
- 선택 제품만 분석하라.
- 제품별 성분, 함량, 사용법, 대상작물, 농민 문제, 구매 소구점을 채워라.
- image_url은 비워도 된다. 대표 이미지는 서버 코드에서 최종 보정한다.
- 성분표, 사용량표, 시험자료, 전후사진은 evidence_images에 넣어라.
- 정보가 불확실하면 지어내지 말고 "자료 보완 필요"라고 써라.
- 한국농수산TV 협업전략은 제품별로 구체적으로 제안하라.
- 결과는 JSON만 반환하라.

반환 형식:
{
  "products": [
    {
      "temp_id": "기존 temp_id",
      "product_name": "제품명",
      "category": "제품 분류",
      "recommended_hall": "추천 전시장",
      "short_description": "제품 한 줄 설명",
      "ingredients": "성분/함량",
      "usage": "사용법/적용작물/사용시기",
      "target_crop": "대상 작물",
      "selling_point": "농민 구매 소구점",
      "farmer_pain_point": "해결하는 농민 문제",
      "priority": "상 | 중 | 하",
      "priority_reason": "우선순위 이유",
      "proof_needed": "추가 확보하면 좋은 자료",
      "kafs_tv_strategy": "한국농수산TV 협업전략",
      "legal_notice": "표시광고/인증 확인사항",
      "image_url": "",
      "evidence_images": []
    }
  ],
  "summary": "정밀분석 요약",
  "kafs_tv_package_suggestion": "선택 제품 기준 협업 패키지 제안"
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
    throw new Error(json.error?.message || "선택 제품 정밀분석 실패");
  }

  const outputText =
    json.output_text ||
    json.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n") ||
    "";

  const parsed = safeJsonParse(outputText) as {
    products?: any[];
    summary?: string;
    kafs_tv_package_suggestion?: string;
  } | null;

  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error("정밀분석 결과를 읽지 못했습니다.");
  }

  return parsed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const websiteUrl = clean(body.website_url);
    const vendorMemo = clean(body.vendor_memo);
    const selectedProducts = Array.isArray(body.products)
      ? (body.products as SelectedProduct[])
      : [];

    if (!websiteUrl) {
      return NextResponse.json(
        { ok: false, error: "홈페이지 주소가 필요합니다." },
        { status: 400 },
      );
    }

    if (selectedProducts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "정밀분석할 제품을 선택해야 합니다." },
        { status: 400 },
      );
    }

    const limitedProducts = selectedProducts.slice(0, 20);
    const context = await buildWebsiteContext(websiteUrl, limitedProducts);

    const analysis = await analyzeWithOpenAi({
      websiteUrl,
      websiteText: context.text,
      imageText: imagesToPromptText(context.images),
      selectedProducts: limitedProducts,
      vendorMemo,
    });

    const products = (analysis.products || []).map((item, index) => {
      const productName = clean(item?.product_name) || clean(limitedProducts[index]?.product_name);
      const fixedImageUrl = pickImageForProduct(context.images, productName);
      return normalizeProduct(item, index, fixedImageUrl);
    });

    return NextResponse.json({
      ok: true,
      source: "deep_analysis",
      total: products.length,
      crawled_links: context.crawled_links,
      crawled_image_count: context.images.length,
      products,
      company_summary: clean(analysis.summary),
      kafs_tv_package_suggestion: clean(analysis.kafs_tv_package_suggestion),
      final_comment:
        "선택 제품 정밀분석이 완료되었습니다. 대표 이미지는 제품명 기준으로 서버에서 보정했습니다.",
      message: `선택한 ${products.length}개 제품의 정밀분석이 완료되었습니다.`,
    });
  } catch (error) {
    console.error("[product-deep-analysis]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "선택 제품 정밀분석 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}