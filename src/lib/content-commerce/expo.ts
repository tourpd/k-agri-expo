import type { Product, RankedProduct } from "./coupang";

export type ExpoProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  buyUrl: string;
  boothId: string | null;
  crops: string[];
};

const asText = (v: unknown) => typeof v === "string" ? v.trim() : "";
const allowedUrl = (v: string) => {
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    const url = new URL(v);
    return url.protocol === "https:" ? v : "";
  } catch { return ""; }
};

export function normalizeExpoProducts(raw: unknown): ExpoProduct[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const p = item as Record<string, unknown>;
    const name = asText(p.name);
    const id = String(p.product_id ?? p.id ?? "");
    if (!name || !id) return [];
    return [{
      id, name,
      description: asText(p.description),
      category: asText(p.category),
      buyUrl: allowedUrl(asText(p.buy_url)),
      boothId: asText(p.booth_id) || null,
      crops: Array.isArray(p.crops) ? p.crops.filter((x): x is string => typeof x === "string") : [],
    }];
  });
}

export function matchExpoProducts(topic: string, crop: string, products: ExpoProduct[]): (ExpoProduct & {score: number})[] {
  const text = (topic + " " + crop).toLowerCase();
  const cropText = crop.trim().toLowerCase();
  return products.map(p => {
    let score = 0;
    if (p.crops.some(c => c.toLowerCase() === cropText)) score += 5;
    if (cropText && p.category.toLowerCase().includes(cropText)) score += 2;
    for (const token of p.name.toLowerCase().split(/\s+/).filter(t => t.length >= 2)) {
      if (text.includes(token)) score += 2;
    }
    for (const token of p.description.toLowerCase().split(/\s+/).filter(t => t.length >= 3).slice(0, 12)) {
      if (text.includes(token)) score++;
    }
    return { ...p, score };
  }).filter(p => p.score >= 3).sort((a,b) => b.score-a.score).slice(0,3);
}
// Partner links require explicit publisher verification. EXPO buy_url is never
// transformed into, or represented as, an affiliate tracking URL.
export function toApprovedAffiliateProduct(_p: ExpoProduct): Product | null { return null; }
export type { RankedProduct };
