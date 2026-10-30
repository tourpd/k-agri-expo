import "server-only";

import { createHmac } from "node:crypto";

/**
 * 쿠팡파트너스 공식 Open API (제휴 링크)
 *
 * - 환경변수 COUPANG_PARTNERS_ACCESS_KEY / COUPANG_PARTNERS_SECRET_KEY 가 있어야 동작합니다.
 *   없으면 null을 돌려주고, 화면은 일반 쿠팡 검색 링크(수수료 없음)로 대체합니다.
 * - 상품 검색: GET /v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=..&limit=..
 *   응답의 productUrl 이 제휴 링크입니다.
 * - 결과는 6시간 메모리 캐시 (같은 제품명은 하루 몇 번만 호출)
 */
const HOST = "https://api-gateway.coupang.com";
const SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/products/search";

export type CoupangItem = {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string; // 제휴 링크
  isRocket?: boolean;
};

const cache = new Map<string, { at: number; items: CoupangItem[] }>();
const TTL = 6 * 60 * 60 * 1000;

export function coupangEnabled() {
  return Boolean(process.env.COUPANG_PARTNERS_ACCESS_KEY && process.env.COUPANG_PARTNERS_SECRET_KEY);
}

function signedDate(d = new Date()) {
  // yyMMdd'T'HHmmss'Z' (UTC)
  const p = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function authorization(method: string, path: string, query: string) {
  const access = process.env.COUPANG_PARTNERS_ACCESS_KEY!;
  const secret = process.env.COUPANG_PARTNERS_SECRET_KEY!;
  const date = signedDate();
  const message = date + method + path + query;
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${access}, signed-date=${date}, signature=${signature}`;
}

export async function searchCoupang(keyword: string, limit = 3): Promise<CoupangItem[] | null> {
  if (!coupangEnabled()) return null;
  const key = `${keyword}|${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.items;
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  try {
    const res = await fetch(`${HOST}${SEARCH_PATH}?${query}`, {
      headers: { Authorization: authorization("GET", SEARCH_PATH, query), "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[coupang] search failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as { data?: { productData?: CoupangItem[] } };
    const items = json?.data?.productData ?? [];
    cache.set(key, { at: Date.now(), items });
    return items;
  } catch (error) {
    console.error("[coupang] search error", error);
    return null;
  }
}

const DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";
const linkCache = new Map<string, { at: number; url: string }>();

/** 쿠팡 상품 주소 → 파트너스 제휴 링크 (딥링크 API). 실패하면 null */
export async function deeplink(coupangUrl: string): Promise<string | null> {
  if (!coupangEnabled()) return null;
  const hit = linkCache.get(coupangUrl);
  if (hit && Date.now() - hit.at < TTL) return hit.url;
  try {
    const res = await fetch(`${HOST}${DEEPLINK_PATH}`, {
      method: "POST",
      headers: { Authorization: authorization("POST", DEEPLINK_PATH, ""), "Content-Type": "application/json" },
      body: JSON.stringify({ coupangUrls: [coupangUrl] }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[coupang] deeplink failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as { data?: Array<{ originalUrl: string; shortenUrl: string; landingUrl: string }> };
    const url = json?.data?.[0]?.shortenUrl || json?.data?.[0]?.landingUrl || null;
    if (url) linkCache.set(coupangUrl, { at: Date.now(), url });
    return url;
  } catch (error) {
    console.error("[coupang] deeplink error", error);
    return null;
  }
}

export function coupangProductUrl(p: { productId: number; itemId?: number; vendorItemId?: number }) {
  const q = [p.itemId ? `itemId=${p.itemId}` : "", p.vendorItemId ? `vendorItemId=${p.vendorItemId}` : ""].filter(Boolean).join("&");
  return `https://www.coupang.com/vp/products/${p.productId}${q ? `?${q}` : ""}`;
}

/** 키가 없을 때 쓰는 일반 검색 링크 (수수료 없음) */
export function coupangSearchUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
}
