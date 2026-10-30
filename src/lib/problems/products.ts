import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Problem } from "./catalog";

/**
 * 문제 페이지에 붙는 '해답 제품' 찾기
 *
 * 1주차: 제품명·설명·대상작물에 문제 키워드가 들어 있으면 매칭 (DB 변경 없음)
 * 2주차: expo_problem_products 표로 기업이 직접 연결 + 후원 자리
 */
export type AnswerProduct = {
  id: string;
  name: string;
  brandName: string | null;
  brandSlug: string | null;
  boothId: string | null;
  priceKrw: number | null;
  imageUrl: string | null;
  shortDescription: string | null;
  /** 어느 표에서 왔나 */
  source: "brand" | "booth";
  /** 상세 화면 주소 */
  href: string;
  sponsored?: boolean;
};

function text(v: unknown): string {
  return typeof v === "string" ? v : Array.isArray(v) ? v.join(" ") : v == null ? "" : String(v);
}

function hit(haystack: string, keywords: string[]): number {
  const h = haystack.toLowerCase();
  let score = 0;
  for (const k of keywords) {
    if (k && h.includes(k.toLowerCase())) score += 1;
  }
  return score;
}

export async function findAnswerProducts(problem: Problem, limit = 5): Promise<AnswerProduct[]> {
  if (problem.noProducts || problem.productKeywords.length === 0) return [];
  return findProductsByKeywords(problem.productKeywords, limit);
}

/** 키워드로 제품 찾기 (문제 페이지·준비물 페이지 공용) */
export async function findProductsByKeywords(keywords: string[], limit = 5): Promise<AnswerProduct[]> {
  if (!keywords.length) return [];
  const problem = { productKeywords: keywords } as Pick<Problem, "productKeywords">;

  const supabase = createSupabaseAdminClient();
  const out: Array<AnswerProduct & { score: number }> = [];

  // 1) 브랜드 제품
  try {
    const { data: brandProducts } = await supabase
      .from("expo_brand_products")
      .select("id, brand_id, product_name, short_description, detail_description, target_crops, category, price_krw, image_url, is_active")
      .eq("is_active", true)
      .limit(400);

    const rows = (brandProducts ?? []) as Array<Record<string, unknown>>;
    const brandIds = Array.from(new Set(rows.map((r) => text(r.brand_id)).filter(Boolean)));
    const brandMap = new Map<string, { name: string | null; slug: string | null }>();
    if (brandIds.length) {
      const { data: brands } = await supabase
        .from("expo_brands")
        .select("id, brand_name, slug")
        .in("id", brandIds);
      for (const b of (brands ?? []) as Array<Record<string, unknown>>) {
        brandMap.set(text(b.id), { name: text(b.brand_name) || null, slug: text(b.slug) || null });
      }
    }

    for (const r of rows) {
      const hay = [r.product_name, r.short_description, r.detail_description, r.target_crops, r.category].map(text).join(" ");
      const score = hit(hay, problem.productKeywords);
      if (score === 0) continue;
      const brand = brandMap.get(text(r.brand_id));
      out.push({
        id: text(r.id),
        name: text(r.product_name) || "제품",
        brandName: brand?.name ?? null,
        brandSlug: brand?.slug ?? null,
        boothId: null,
        priceKrw: typeof r.price_krw === "number" ? r.price_krw : null,
        imageUrl: text(r.image_url) || null,
        shortDescription: text(r.short_description) || null,
        source: "brand",
        href: `/expo/brand-products/${text(r.id)}`,
        score,
      });
    }
  } catch (error) {
    console.error("[problems/products] brand products error:", error);
  }

  // 2) 부스 제품
  try {
    const { data: boothProducts } = await supabase
      .from("expo_products")
      .select("*")
      .eq("is_active", true)
      .limit(400);

    for (const r of (boothProducts ?? []) as Array<Record<string, unknown>>) {
      const name = text(r.name ?? r.title ?? r.product_name);
      if (!name || /입점권|부스/.test(name)) continue;
      const hay = [name, r.short_description, r.description, r.target_crops, r.category, r.tags].map(text).join(" ");
      const score = hit(hay, problem.productKeywords);
      if (score === 0) continue;
      const id = text(r.id ?? r.product_id);
      out.push({
        id,
        name,
        brandName: text(r.vendor_name ?? r.company_name) || null,
        brandSlug: null,
        boothId: text(r.booth_id) || null,
        priceKrw: typeof r.price_krw === "number" ? r.price_krw : typeof r.sale_price_krw === "number" ? r.sale_price_krw : null,
        imageUrl: text(r.image_url ?? r.thumbnail_url) || null,
        shortDescription: text(r.short_description) || null,
        source: "booth",
        href: `/expo/product/${id}`,
        score,
      });
    }
  } catch (error) {
    console.error("[problems/products] booth products error:", error);
  }

  out.sort((a, b) => b.score - a.score);
  // 같은 제품명 중복 제거
  const seen = new Set<string>();
  return out
    .filter((p) => {
      const k = p.name.replace(/\s+/g, "").toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit)
    .map(({ score: _s, ...p }) => p);
}

/** 쇼핑몰 검색 주소 (제품별 직접 링크가 생기기 전까지) */
export function shopSearchUrl(name: string): string {
  return `https://kaftv24.cafe24.com/product/search.html?keyword=${encodeURIComponent(name)}`;
}
