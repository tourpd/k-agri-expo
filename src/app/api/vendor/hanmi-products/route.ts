import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANMI_AJAX_URL = "https://hanminutrition.com/wp-admin/admin-ajax.php";

function clean(v: unknown) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string) {
  try {
    return new URL(href, "https://hanminutrition.com").toString();
  } catch {
    return "";
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractProductsFromHtml(html: string, pageNumber: number) {
  const blocks = html.split("premium-blog-post-outer-container");
  const products: any[] = [];

  for (const block of blocks) {
    const href =
      block.match(/href=["']([^"']+)["']/i)?.[1] ||
      block.match(/data-link=["']([^"']+)["']/i)?.[1] ||
      "";

    const img =
      block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
      block.match(/data-src=["']([^"']+)["']/i)?.[1] ||
      "";

    const title =
      block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1] ||
      block.match(/title=["']([^"']+)["']/i)?.[1] ||
      "";

    const text = stripHtml(title || block);
    const productName = clean(text).slice(0, 120);

    if (!productName) continue;
    if (productName.length < 2) continue;

    products.push({
      product_name: productName,
      image_url: absoluteUrl(img),
      detail_url: absoluteUrl(href),
      source_page: pageNumber,
      source: "hanmi_ajax",
    });
  }

  return products;
}

function guessFarmerCategory(name: string) {
  const n = name.toLowerCase();

  if (n.includes("단백") || n.includes("프로틴") || n.includes("근력") || n.includes("아미노")) {
    return "근력감소·근감소증";
  }

  if (n.includes("관절") || n.includes("msm") || n.includes("보스웰") || n.includes("연골")) {
    return "관절·연골";
  }

  if (n.includes("루테인") || n.includes("지아잔틴") || n.includes("눈")) {
    return "눈 건강·눈침침";
  }

  if (n.includes("오메가") || n.includes("혈행") || n.includes("코엔자임") || n.includes("혈압")) {
    return "혈행개선·혈압";
  }

  if (n.includes("기억") || n.includes("인지") || n.includes("은행잎") || n.includes("포스파티딜")) {
    return "기억력·인지건강";
  }

  if (n.includes("유산균") || n.includes("프로바이오") || n.includes("장")) {
    return "장 건강";
  }

  if (n.includes("밀크씨슬") || n.includes("간") || n.includes("피로")) {
    return "간 건강·피로";
  }

  if (n.includes("홍삼") || n.includes("면역") || n.includes("아연") || n.includes("비타민c")) {
    return "면역력";
  }

  if (n.includes("칼슘") || n.includes("비타민d") || n.includes("뼈")) {
    return "뼈 건강·칼슘";
  }

  if (n.includes("고소애") || n.includes("갈색거저리") || n.includes("곤충")) {
    return "곤충단백질·미래식량";
  }

  return "AI 확인 필요";
}

async function fetchHanmiPage(pageNumber: number) {
  const body = new URLSearchParams();
  body.set("action", "pa_get_posts");
  body.set("page_id", "1524");
  body.set("widget_id", "849188f");
  body.set("page_number", String(pageNumber));

  const res = await fetch(HANMI_AJAX_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 K-Agri-Expo-Hanmi-Crawler",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://hanminutrition.com/",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`한미양행 ${pageNumber}페이지 요청 실패: ${res.status}`);
  }

  const json = await res.json();
  const postsHtml = String(json?.data?.posts || "");
  const products = extractProductsFromHtml(postsHtml, pageNumber);

  return products;
}

function dedupeProducts(products: any[]) {
  const map = new Map<string, any>();

  for (const item of products) {
    const key = clean(item.product_name).toLowerCase().replace(/\s+/g, "");
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        farmer_category: guessFarmerCategory(item.product_name),
      });
    }
  }

  return Array.from(map.values());
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const maxPages = Math.min(Number(url.searchParams.get("pages") || 5), 120);

    const allProducts: any[] = [];
    const failedPages: string[] = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const products = await fetchHanmiPage(page);

        if (products.length === 0 && page > 3) break;

        allProducts.push(...products);
      } catch (error) {
        failedPages.push(
          `${page}페이지: ${error instanceof Error ? error.message : "실패"}`
        );
      }
    }

    const products = dedupeProducts(allProducts);

    const categorySummary = products.reduce((acc: Record<string, number>, item) => {
      const key = item.farmer_category || "AI 확인 필요";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      source: "hanminutrition.com",
      crawled_pages: maxPages,
      failed_pages: failedPages,
      total: products.length,
      category_summary: categorySummary,
      products,
      message: `한미양행 제품 ${products.length}개를 수집했습니다.`,
    });
  } catch (error) {
    console.error("[hanmi-products]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "한미양행 제품 수집 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}