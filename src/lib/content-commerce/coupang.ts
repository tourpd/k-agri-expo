export type Product = {
  id: string;
  name: string;
  crops: string[];
  keywords: string[];
  link: string;
  note?: string;
  approved: boolean;
};
export type RankedProduct = Product & { score: number; reasons: string[] };

const normalize = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const words = (s: string) => normalize(s).split(/\s+/).filter(w => w.length >= 2);
export function isAllowedAffiliateLink(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" &&
      (url.hostname === "link.coupang.com" || url.hostname === "www.coupang.com" || url.hostname === "coupang.com");
  } catch { return false; }
}
export function rankProducts(topic: string, crop: string, products: Product[]): RankedProduct[] {
  const topicText = normalize(topic);
  const topicWords = new Set(words(topic));
  const cropText = normalize(crop);
  return products.filter(p => p.approved && isAllowedAffiliateLink(p.link))
    .map(p => {
      let score = 0;
      let topicRelevance = 0;
      const reasons: string[] = [];
      if (p.crops.some(c => normalize(c) === cropText && cropText)) { score += 5; reasons.push("작물 일치"); }
      for (const kw of p.keywords) {
        const n = normalize(kw);
        if (n.length >= 2 && (topicText.includes(n) || [...topicWords].some(w => w.includes(n) || n.includes(w)))) {
          score += 3; topicRelevance += 3; reasons.push("주제 관련: " + kw);
        }
      }
      if (words(p.name).some(w => topicWords.has(w))) { score += 2; topicRelevance += 2; reasons.push("상품명 관련"); }
      return { ...p, score: topicRelevance >= 2 ? score : 0, reasons };
    }).filter(p => p.score >= 3)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko"))
    .slice(0, 3);
}
export const AFFILIATE_NOTICE = "이 콘텐츠에는 쿠팡파트너스 제휴 링크가 포함되어 있으며, 해당 링크를 통한 구매 시 일정액의 수수료를 제공받을 수 있습니다.";
export function youtubeDescription(topic: string, products: RankedProduct[]): string {
  const lines = [topic.trim(), "", "📌 오늘의 농사정보: 재배환경과 제품 사용조건을 먼저 확인하세요."];
  if (products.length) {
    lines.push("", "🛒 관련 농사용품 (제휴 링크)");
    products.forEach((p, i) => lines.push(`${i + 1}. ${p.name}: ${p.link}`));
    lines.push("", AFFILIATE_NOTICE);
  }
  lines.push("", "※ 쇼츠 설명란의 URL은 클릭되지 않을 수 있습니다. 채널 프로필의 상품 안내 페이지도 활용하세요.");
  return lines.join("\n");
}
