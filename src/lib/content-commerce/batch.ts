import { rankProducts, youtubeDescription, type Product } from "./coupang";
import { matchExpoProducts, type ExpoProduct } from "./expo";

export type ShortsBrief = { id: string; crop: string; topic: string };
export type ShortsCommerceResult = ShortsBrief & {
  affiliateProducts: ReturnType<typeof rankProducts>;
  expoProducts: ReturnType<typeof matchExpoProducts>;
  youtubeDescription: string;
  requiresReview: true;
};
export function buildDailyShortsCommerce(
  briefs: ShortsBrief[], affiliateProducts: Product[], expoProducts: ExpoProduct[]
): ShortsCommerceResult[] {
  return briefs.slice(0, 5).filter(b => !!b.id.trim() && !!b.topic.trim()).map(brief => {
    const affiliate = rankProducts(brief.topic, brief.crop, affiliateProducts);
    return {
      ...brief,
      affiliateProducts: affiliate,
      expoProducts: matchExpoProducts(brief.topic, brief.crop, expoProducts),
      youtubeDescription: youtubeDescription(brief.topic, affiliate),
      requiresReview: true as const,
    };
  });
}
