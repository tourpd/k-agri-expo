import "server-only";

import { coupangEnabled, coupangSearchUrl, searchCoupang } from "./coupang-partners";

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
}): Promise<BuyLink[]> {
  const out: BuyLink[] = [];
  const sellable = opts.sellable !== false;

  if (sellable) {
    const ours = ourShopUrl(opts.name);
    if (ours) out.push({ label: "한국농수산TV 쇼핑몰에서 사기", href: ours, kind: "ours", sub: "택배 발송" });

    const kw = opts.keyword ?? opts.name;
    if (coupangEnabled()) {
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
