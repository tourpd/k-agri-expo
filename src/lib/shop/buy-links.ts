import "server-only";

import { coupangEnabled, coupangProductUrl, coupangSearchUrl, deeplink, searchCoupang } from "./coupang-partners";

/**
 * 구매 버튼 순서: 우리 쇼핑몰 > 쿠팡(파트너스) > 기업 전화
 * - 우리 쇼핑몰(kaftv24)에 올라 있는 제품만 1번에 둡니다. (목록은 아래 OUR_SHOP — 대표님이 알려 주신 것만)
 * - 쿠팡은 파트너스 키가 있으면 제휴 링크(수수료), 없으면 일반 검색 링크.
 * - 농약(sellable=false)은 온라인 구매 버튼을 만들지 않습니다.
 */
export type BuyLink = { label: string; href: string; kind: "ours" | "coupang" | "company"; sub?: string };

export const OUR_SHOP_BASE = "https://kaftv24.cafe24.com";

/** 우리 쇼핑몰에서 파는 제품 (제품명 포함어 → 상품 주소. 주소를 모르면 검색 주소) */
const OUR_SHOP: Array<{ match: string[]; href?: string }> = [
  { match: ["아미65", "아미 65"] },
];

export function ourShopUrl(name: string): string | null {
  const n = name.replace(/\s/g, "").toLowerCase();
  const hit = OUR_SHOP.find((o) => o.match.some((m) => n.includes(m.replace(/\s/g, "").toLowerCase())));
  if (!hit) return null;
  return hit.href ?? `${OUR_SHOP_BASE}/product/search.html?keyword=${encodeURIComponent(name)}`;
}

export async function buildBuyLinks(opts: {
  name: string;
  companyName?: string | null;
  phone?: string | null;
  sellable?: boolean;
  /** 쿠팡 검색어 (기본 제품명) */
  keyword?: string;
  /** 고정 쿠팡 상품 (있으면 검색보다 우선) */
  coupang?: { productId: number; itemId?: number; vendorItemId?: number; label?: string; priceKrw?: number };
}): Promise<BuyLink[]> {
  const out: BuyLink[] = [];
  const sellable = opts.sellable !== false;

  if (sellable) {
    const ours = ourShopUrl(opts.name);
    if (ours) out.push({ label: "한국농수산TV 쇼핑몰에서 사기", href: ours, kind: "ours", sub: "택배 발송" });

    const kw = opts.keyword ?? opts.name;
    if (opts.coupang) {
      const plain = coupangProductUrl(opts.coupang);
      const aff = await deeplink(plain);
      out.push({
        label: "쿠팡에서 사기",
        href: aff ?? plain,
        kind: "coupang",
        sub: [opts.coupang.label, opts.coupang.priceKrw ? `${opts.coupang.priceKrw.toLocaleString("ko-KR")}원` : ""].filter(Boolean).join(" · ") || undefined,
      });
    } else if (coupangEnabled()) {
      const items = await searchCoupang(kw, 1);
      const best = items?.[0];
      if (best) {
        out.push({
          label: "쿠팡에서 사기",
          href: best.productUrl,
          kind: "coupang",
          sub: best.productPrice ? `${best.productPrice.toLocaleString("ko-KR")}원${best.isRocket ? " · 로켓" : ""}` : undefined,
        });
      } else {
        out.push({ label: "쿠팡에서 찾기", href: coupangSearchUrl(kw), kind: "coupang" });
      }
    } else {
      out.push({ label: "쿠팡에서 찾기", href: coupangSearchUrl(kw), kind: "coupang" });
    }
  }

  if (opts.phone) {
    const tel = opts.phone.replace(/[^\d+]/g, "");
    out.push({ label: `${opts.companyName ?? "기업"}에 전화해 사기`, href: `tel:${tel}`, kind: "company", sub: opts.phone });
  }
  return out;
}

/**
 * 목록(문제 페이지·포토닥터 카드)에 붙는 '바로 사기' 버튼 하나
 * - 우리 쇼핑몰 > 고정 쿠팡 상품(제휴) > 쿠팡 검색 결과 페이지(제휴 딥링크)
 * - 검색 API는 시간당 호출 제한이 있어 목록에서는 쓰지 않고, 검색 '페이지'를 제휴 링크로 바꿉니다.
 *   (1순위 상품이 엉뚱한 제품일 위험도 없음 — 농민이 쿠팡에서 직접 고름)
 * - 농약(sellable=false)은 null
 */
export async function quickBuyLink(opts: {
  name: string;
  companyName?: string | null;
  sellable?: boolean;
  coupang?: { productId: number; itemId?: number; vendorItemId?: number; label?: string; priceKrw?: number };
}): Promise<BuyLink | null> {
  if (opts.sellable === false) return null;
  const ours = ourShopUrl(opts.name);
  if (ours) return { label: "쇼핑몰에서 사기", href: ours, kind: "ours", sub: "한국농수산TV" };
  if (opts.coupang) {
    const plain = coupangProductUrl(opts.coupang);
    const aff = await deeplink(plain);
    return { label: "쿠팡에서 사기", href: aff ?? plain, kind: "coupang", sub: opts.coupang.priceKrw ? `${opts.coupang.priceKrw.toLocaleString("ko-KR")}원` : undefined };
  }
  const kw = [opts.companyName && opts.companyName !== "참여 기업" ? opts.companyName : "", opts.name.replace(/-/g, "")].filter(Boolean).join(" ");
  const plain = coupangSearchUrl(kw);
  const aff = await deeplink(plain);
  return { label: "쿠팡에서 보기", href: aff ?? plain, kind: "coupang" };
}

/** 쿠팡파트너스 필수 안내 문구 */
export const COUPANG_NOTICE = "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

/** 공시 제품 → 쿠팡 검색(회사+상표명) 제휴 링크 */
export async function certifiedBuyLink(short: string, name: string): Promise<BuyLink> {
  const kw = `${short} ${name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim()}`;
  const plain = coupangSearchUrl(kw);
  const aff = await deeplink(plain);
  return { label: "쿠팡에서 보기", href: aff ?? plain, kind: "coupang" };
}
