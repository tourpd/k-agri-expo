import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Problem } from "./catalog";
import { companyPhoneByText } from "./company-phones";
import { partnerCompany, partnerProductsForProblem, type PartnerProduct } from "./partner-catalog";
import { submissionsForProblem, submissionToPartner, type SubmissionRow } from "@/lib/submissions/products";

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
  /** 어느 표에서 왔나 (partner = 카탈로그에서 확인한 참여 기업 제품) */
  source: "brand" | "booth" | "partner" | "submission";
  /** partner일 때 카탈로그 출처 표기 */
  sourceLabel?: string;
  partnerId?: string;
  /** 상세 화면 주소 */
  href: string;
  sponsored?: boolean;
  /** 기업 전화번호 (부스 phone → 입점 신청서 전화). 없으면 null */
  phone: string | null;
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

type Db = ReturnType<typeof createSupabaseAdminClient>;

function cleanPhone(v: unknown): string | null {
  const t = text(v).replace(/[^\d+]/g, "");
  return t.length >= 9 ? t : null;
}

/** 부스 id → 부스 전화 */
async function boothPhones(supabase: Db, boothIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!boothIds.length) return map;
  try {
    const { data } = await supabase.from("booths").select("booth_id, id, phone").in("booth_id", boothIds);
    for (const b of (data ?? []) as Array<Record<string, unknown>>) {
      const ph = cleanPhone(b.phone);
      if (ph) map.set(text(b.booth_id ?? b.id), ph);
    }
  } catch (error) {
    console.error("[problems/products] booth phone error:", error);
  }
  return map;
}

/** 입점기업 id → 전화 (그 기업 부스 전화 → 입점 신청서 전화) */
async function vendorPhones(supabase: Db, vendorIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!vendorIds.length) return map;
  try {
    const { data } = await supabase.from("booths").select("vendor_id, phone").in("vendor_id", vendorIds);
    for (const b of (data ?? []) as Array<Record<string, unknown>>) {
      const ph = cleanPhone(b.phone);
      if (ph && !map.has(text(b.vendor_id))) map.set(text(b.vendor_id), ph);
    }
  } catch (error) {
    console.error("[problems/products] vendor booth phone error:", error);
  }
  const missing = vendorIds.filter((v) => !map.has(v));
  if (missing.length) {
    try {
      const { data } = await supabase.from("vendor_applications").select("provisioned_vendor_id, phone, contact_phone").in("provisioned_vendor_id", missing);
      for (const a of (data ?? []) as Array<Record<string, unknown>>) {
        const ph = cleanPhone(a.phone) ?? cleanPhone(a.contact_phone);
        if (ph && !map.has(text(a.provisioned_vendor_id))) map.set(text(a.provisioned_vendor_id), ph);
      }
    } catch (error) {
      console.error("[problems/products] vendor application phone error:", error);
    }
  }
  return map;
}

export function partnerToAnswer(p: PartnerProduct): AnswerProduct {
  const c = partnerCompany(p);
  return {
    id: p.id,
    name: p.name,
    brandName: c.name,
    brandSlug: null,
    boothId: null,
    priceKrw: null,
    imageUrl: null,
    shortDescription: p.feature,
    source: "partner",
    sourceLabel: `${p.source.label} p.${p.source.page}`,
    partnerId: p.id,
    href: `/yakbaksa?p=${encodeURIComponent(p.id)}`,
    phone: c.phone.replace(/[^\d+]/g, ""),
  };
}

export function submissionToAnswer(r: SubmissionRow): AnswerProduct {
  const p = submissionToPartner(r);
  return {
    id: p.id,
    name: p.name,
    brandName: p.companyName,
    brandSlug: null,
    boothId: null,
    priceKrw: r.price_krw ?? null,
    imageUrl: p.imageUrl,
    shortDescription: p.feature || null,
    source: "submission",
    sourceLabel: `${p.companyName} 등록`,
    partnerId: p.id,
    href: `/yakbaksa?p=${encodeURIComponent(p.id)}`,
    phone: p.companyPhone.replace(/[^\d+]/g, "") || null,
  };
}

export async function findAnswerProducts(problem: Problem, limit = 2): Promise<AnswerProduct[]> {
  if (problem.noProducts) return [];
  // 1) DB에 등록된 제품 — 핵심 단어(mustKeywords)가 설명에 있어야만 붙습니다.
  const fromDb = problem.productKeywords.length
    ? await findProductsByKeywords(problem.productKeywords, limit, problem.mustKeywords ?? problem.productKeywords)
    : [];
  if (fromDb.length >= limit) return fromDb;
  const names = new Set(fromDb.map((x) => x.name.replace(/\s/g, "")));
  // 2) 기업이 직접 올려 승인된 제품
  const subs = (await submissionsForProblem(problem.slug, limit))
    .map(submissionToAnswer)
    .filter((p) => !names.has(p.name.replace(/\s/g, "")));
  for (const p of subs) names.add(p.name.replace(/\s/g, ""));
  // 3) 빈칸은 카탈로그에서 확인한 참여 기업 제품으로
  const partners = partnerProductsForProblem(problem.slug, limit)
    .filter((p) => !names.has(p.name.replace(/\s/g, "")))
    .map(partnerToAnswer);
  return [...fromDb, ...subs, ...partners].slice(0, limit);
}

/** 키워드로 제품 찾기 (문제 페이지·준비물 페이지 공용). must: 이 중 하나는 반드시 포함 */
export async function findProductsByKeywords(keywords: string[], limit = 5, must?: string[]): Promise<AnswerProduct[]> {
  if (!keywords.length) return [];
  const problem = { productKeywords: keywords } as Pick<Problem, "productKeywords">;
  const mustList = must && must.length ? must : null;
  const passes = (hay: string) => !mustList || hit(hay, mustList) > 0;

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
    const brandMap = new Map<string, { name: string | null; slug: string | null; vendorId: string | null }>();
    if (brandIds.length) {
      const { data: brands } = await supabase
        .from("expo_brands")
        .select("id, brand_name, slug, vendor_id")
        .in("id", brandIds);
      for (const b of (brands ?? []) as Array<Record<string, unknown>>) {
        brandMap.set(text(b.id), { name: text(b.brand_name) || null, slug: text(b.slug) || null, vendorId: text(b.vendor_id) || null });
      }
    }
    const vendorPhone = await vendorPhones(supabase, Array.from(brandMap.values()).map((b) => b.vendorId).filter(Boolean) as string[]);

    for (const r of rows) {
      const hay = [r.product_name, r.short_description, r.detail_description, r.target_crops, r.category].map(text).join(" ");
      if (!passes(hay)) continue;
      const score = hit(hay, problem.productKeywords) + hit(hay, mustList ?? []) * 3;
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
        phone: (brand?.vendorId && vendorPhone.get(brand.vendorId)) || companyPhoneByText(brand?.name, text(r.product_name), text(r.short_description), text(r.detail_description)),
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

    const boothRows = (boothProducts ?? []) as Array<Record<string, unknown>>;
    const boothPhone = await boothPhones(supabase, Array.from(new Set(boothRows.map((r) => text(r.booth_id)).filter(Boolean))));

    for (const r of boothRows) {
      const name = text(r.name ?? r.title ?? r.product_name);
      if (!name || /입점권|부스/.test(name)) continue;
      const hay = [name, r.short_description, r.description, r.target_crops, r.category, r.tags].map(text).join(" ");
      if (!passes(hay)) continue;
      const score = hit(hay, problem.productKeywords) + hit(hay, mustList ?? []) * 3;
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
        phone: boothPhone.get(text(r.booth_id)) ?? companyPhoneByText(text(r.vendor_name ?? r.company_name), name, text(r.short_description), text(r.description)),
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
