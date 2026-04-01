import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConsultAnalysis = {
  cropKey: string | null;
  issueKey: string | null;
  categoryHints: string[];
  issueTopic: string;
  seasonKey: string;
  monthKey: number;
};

export type RecommendedBooth = {
  booth_key: string;
  booth_name: string;
  booth_url: string;
  reason: string;
  score: number;
};

export type RecommendedProduct = {
  product_name: string;
  product_url: string;
  reason: string;
  score: number;
};

export type RecommendedDeal = {
  deal_id: string;
  deal_title: string;
  deal_url: string;
  reason: string;
  score: number;
};

type BoothRow = {
  booth_id?: string | null;
  name?: string | null;
  intro?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  category_tags?: string[] | null;
  sponsor_weight?: number | null;
  manual_boost?: number | null;
  is_featured?: boolean | null;
  campaign_tag?: string | null;
};

type ProductRow = {
  id?: string | null;
  product_id?: string | null;
  booth_id?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  category_tags?: string[] | null;
  product_url?: string | null;
  sponsor_weight?: number | null;
  manual_boost?: number | null;
  is_featured?: boolean | null;
  campaign_tag?: string | null;
};

type DealRow = {
  id?: string | null;
  deal_id?: string | null;
  booth_deal_id?: string | null;
  booth_id?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  category_tags?: string[] | null;
  deal_url?: string | null;
  sponsor_weight?: number | null;
  manual_boost?: number | null;
  is_featured?: boolean | null;
  campaign_tag?: string | null;
};

const MIN_RELEVANCE_SCORE = 20;

function includesAny(text: string, keywords: string[]) {
  return keywords.some((k) => text.includes(k));
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter(Boolean);
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeStr(value: unknown, fallback = "") {
  const s = typeof value === "string" ? value.trim() : "";
  return s || fallback;
}

function currentSeason(month: number) {
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "fall";
  return "winter";
}

function isRowActive(row: { is_active?: boolean | null; status?: string | null }) {
  if (typeof row.is_active === "boolean") return row.is_active;
  if (typeof row.status === "string") return row.status !== "closed";
  return true;
}

function getBoothId(row: BoothRow) {
  return safeStr(row.booth_id, "");
}

function getProductId(row: ProductRow) {
  return safeStr(row.id || row.product_id, "");
}

function getDealId(row: DealRow) {
  return safeStr(row.id || row.deal_id || row.booth_deal_id, "");
}

function buildCampaignHints(analysis: ConsultAnalysis) {
  const hints = new Set<string>();

  hints.add(analysis.seasonKey);
  hints.add(`${analysis.seasonKey}_push`);
  hints.add(`${analysis.seasonKey}_campaign`);
  hints.add(`${analysis.monthKey}month`);
  hints.add(`month_${analysis.monthKey}`);

  if (analysis.cropKey) {
    hints.add(analysis.cropKey);
    hints.add(`${analysis.cropKey}_campaign`);
    hints.add(`${analysis.cropKey}_${analysis.seasonKey}`);
  }

  if (analysis.issueKey) {
    hints.add(analysis.issueKey);
    hints.add(`${analysis.issueKey}_campaign`);
    hints.add(`${analysis.issueKey}_${analysis.seasonKey}`);
  }

  return Array.from(hints);
}

function campaignBonus(
  campaignTag: string | null | undefined,
  analysis: ConsultAnalysis
) {
  const tag = String(campaignTag ?? "").trim().toLowerCase();
  if (!tag) return 0;

  const hints = buildCampaignHints(analysis);
  if (hints.includes(tag)) return 18;

  if (analysis.issueKey && tag.includes(analysis.issueKey)) return 14;
  if (analysis.cropKey && tag.includes(analysis.cropKey)) return 12;
  if (tag.includes(analysis.seasonKey)) return 8;

  return 0;
}

export function analyzeConsultText(input: string): ConsultAnalysis {
  const text = input.toLowerCase();

  let cropKey: string | null = null;
  let issueKey: string | null = null;
  let issueTopic = "general";
  const categoryHints: string[] = [];

  if (includesAny(text, ["고추"])) cropKey = "pepper";
  else if (includesAny(text, ["마늘"])) cropKey = "garlic";
  else if (includesAny(text, ["딸기"])) cropKey = "strawberry";
  else if (includesAny(text, ["오이"])) cropKey = "cucumber";
  else if (includesAny(text, ["벼", "쌀"])) cropKey = "rice";

  if (includesAny(text, ["총채"])) {
    issueKey = "thrips";
    issueTopic = "thrips";
    categoryHints.push("pesticide", "eco");
  } else if (includesAny(text, ["노균"])) {
    issueKey = "downy_mildew";
    issueTopic = "downy_mildew";
    categoryHints.push("fungicide", "eco");
  } else if (includesAny(text, ["비대"])) {
    issueKey = "enlargement";
    issueTopic = "enlargement";
    categoryHints.push("nutrient", "fertilizer");
  } else if (includesAny(text, ["생육", "세력", "웃자람"])) {
    issueKey = "growth";
    issueTopic = "growth";
    categoryHints.push("nutrient", "fertilizer");
  } else if (includesAny(text, ["진딧물"])) {
    issueKey = "aphid";
    issueTopic = "aphid";
    categoryHints.push("pesticide", "eco");
  } else if (includesAny(text, ["칼슘"])) {
    issueKey = "calcium";
    issueTopic = "calcium";
    categoryHints.push("nutrient");
  }

  const monthKey = new Date().getMonth() + 1;
  const seasonKey = currentSeason(monthKey);

  return {
    cropKey,
    issueKey,
    categoryHints,
    issueTopic,
    seasonKey,
    monthKey,
  };
}

export async function recommendFromDb(analysis: ConsultAnalysis) {
  const supabase = await createSupabaseServerClient();

  const [boothsRes, productsRes, dealsRes] = await Promise.all([
    supabase
      .from("booths")
      .select("*")
      .eq("is_public", true)
      .limit(200),

    supabase
      .from("booth_products")
      .select("*")
      .limit(300),

    supabase
      .from("booth_deals")
      .select("*")
      .limit(300),
  ]);

  if (boothsRes.error) {
    throw new Error(`booths 조회 실패: ${boothsRes.error.message}`);
  }
  if (productsRes.error) {
    throw new Error(`booth_products 조회 실패: ${productsRes.error.message}`);
  }
  if (dealsRes.error) {
    throw new Error(`booth_deals 조회 실패: ${dealsRes.error.message}`);
  }

  const booths = ((boothsRes.data ?? []) as BoothRow[]).filter(
    (b) => !!getBoothId(b) && isRowActive(b) && b.is_public !== false
  );

  const products = ((productsRes.data ?? []) as ProductRow[]).filter(
    (p) => !!getProductId(p) && isRowActive(p)
  );

  const deals = ((dealsRes.data ?? []) as DealRow[]).filter(
    (d) => !!getDealId(d) && isRowActive(d)
  );

  const boothRecommendations = scoreBooths(booths, deals, products, analysis);
  const dealRecommendations = scoreDeals(deals, analysis);
  const productRecommendations = scoreProducts(products, analysis);

  return {
    booths:
      boothRecommendations.length > 0
        ? boothRecommendations.slice(0, 3)
        : buildFallbackBooths(analysis),
    products:
      productRecommendations.length > 0
        ? productRecommendations.slice(0, 3)
        : buildFallbackProducts(analysis),
    deals:
      dealRecommendations.length > 0
        ? dealRecommendations.slice(0, 3)
        : buildFallbackDeals(analysis),
  };
}

function scoreBooths(
  booths: BoothRow[],
  deals: DealRow[],
  products: ProductRow[],
  analysis: ConsultAnalysis
): RecommendedBooth[] {
  return booths
    .map((booth) => {
      const boothId = getBoothId(booth);
      if (!boothId) return null;

      const cropTags = normalizeTags(booth.crop_tags);
      const issueTags = normalizeTags(booth.issue_tags);
      const categoryTags = normalizeTags(booth.category_tags);

      const relatedDeals = deals.filter(
        (d) => safeStr(d.booth_id, "") === boothId
      );
      const relatedProducts = products.filter(
        (p) => safeStr(p.booth_id, "") === boothId
      );

      let relevanceScore = 0;

      if (analysis.cropKey && cropTags.includes(analysis.cropKey)) relevanceScore += 30;
      if (analysis.issueKey && issueTags.includes(analysis.issueKey)) relevanceScore += 35;

      for (const hint of analysis.categoryHints) {
        if (categoryTags.includes(hint)) relevanceScore += 12;
      }

      if (relatedDeals.length > 0) relevanceScore += 8;
      if (relatedProducts.length > 0) relevanceScore += 6;

      if (relevanceScore < MIN_RELEVANCE_SCORE) return null;

      let operationScore = 0;
      operationScore += num(booth.sponsor_weight, 0);
      operationScore += num(booth.manual_boost, 0);
      if (booth.is_featured) operationScore += 10;
      operationScore += campaignBonus(booth.campaign_tag, analysis);

      const totalScore = relevanceScore + operationScore;

      const reasons: string[] = [];
      if (analysis.cropKey && cropTags.includes(analysis.cropKey)) reasons.push("작물 일치");
      if (analysis.issueKey && issueTags.includes(analysis.issueKey)) reasons.push("문제 일치");
      if (relatedDeals.length > 0) reasons.push("연결 딜 보유");
      if (booth.is_featured) reasons.push("대표 노출");
      if (num(booth.sponsor_weight, 0) > 0) reasons.push("협찬 반영");
      if (num(booth.manual_boost, 0) > 0) reasons.push("운영 부스트");
      if (campaignBonus(booth.campaign_tag, analysis) > 0) reasons.push("캠페인 반영");

      return {
        booth_key: boothId,
        booth_name: safeStr(booth.name, "부스"),
        booth_url: `/expo/booths/${boothId}`,
        reason: reasons.length
          ? reasons.join(" · ")
          : "입력 내용과 관련성이 높은 부스입니다.",
        score: totalScore,
      };
    })
    .filter((v): v is RecommendedBooth => !!v)
    .sort((a, b) => b.score - a.score);
}

function scoreProducts(
  products: ProductRow[],
  analysis: ConsultAnalysis
): RecommendedProduct[] {
  return products
    .map((product) => {
      const productId = getProductId(product);
      if (!productId) return null;

      const cropTags = normalizeTags(product.crop_tags);
      const issueTags = normalizeTags(product.issue_tags);
      const categoryTags = normalizeTags(product.category_tags);

      let relevanceScore = 0;

      if (analysis.cropKey && cropTags.includes(analysis.cropKey)) relevanceScore += 30;
      if (analysis.issueKey && issueTags.includes(analysis.issueKey)) relevanceScore += 40;

      for (const hint of analysis.categoryHints) {
        if (categoryTags.includes(hint)) relevanceScore += 12;
      }

      if (relevanceScore < MIN_RELEVANCE_SCORE) return null;

      let operationScore = 0;
      operationScore += num(product.sponsor_weight, 0);
      operationScore += num(product.manual_boost, 0);
      if (product.is_featured) operationScore += 10;
      operationScore += campaignBonus(product.campaign_tag, analysis);

      const totalScore = relevanceScore + operationScore;

      const reasons: string[] = [];
      if (analysis.cropKey && cropTags.includes(analysis.cropKey)) reasons.push("작물 일치");
      if (analysis.issueKey && issueTags.includes(analysis.issueKey)) reasons.push("문제 일치");
      if (product.is_featured) reasons.push("대표 노출");
      if (num(product.sponsor_weight, 0) > 0) reasons.push("협찬 반영");
      if (num(product.manual_boost, 0) > 0) reasons.push("운영 부스트");
      if (campaignBonus(product.campaign_tag, analysis) > 0) reasons.push("캠페인 반영");

      return {
        product_name: safeStr(product.name || product.title, "제품"),
        product_url:
          safeStr(product.product_url, "") ||
          `/expo/booths/${safeStr(product.booth_id, "")}`,
        reason: reasons.length
          ? reasons.join(" · ")
          : "입력 내용과 관련성이 높은 제품입니다.",
        score: totalScore,
      };
    })
    .filter((v): v is RecommendedProduct => !!v)
    .sort((a, b) => b.score - a.score);
}

function scoreDeals(
  deals: DealRow[],
  analysis: ConsultAnalysis
): RecommendedDeal[] {
  return deals
    .map((deal) => {
      const realDealId = getDealId(deal);
      if (!realDealId) return null;

      const cropTags = normalizeTags(deal.crop_tags);
      const issueTags = normalizeTags(deal.issue_tags);
      const categoryTags = normalizeTags(deal.category_tags);

      let relevanceScore = 0;

      if (analysis.cropKey && cropTags.includes(analysis.cropKey)) relevanceScore += 28;
      if (analysis.issueKey && issueTags.includes(analysis.issueKey)) relevanceScore += 38;

      for (const hint of analysis.categoryHints) {
        if (categoryTags.includes(hint)) relevanceScore += 12;
      }

      if (relevanceScore < MIN_RELEVANCE_SCORE) return null;

      let operationScore = 0;
      operationScore += num(deal.sponsor_weight, 0);
      operationScore += num(deal.manual_boost, 0);
      if (deal.is_featured) operationScore += 10;
      operationScore += campaignBonus(deal.campaign_tag, analysis);

      const totalScore = relevanceScore + operationScore;

      const reasons: string[] = [];
      if (analysis.cropKey && cropTags.includes(analysis.cropKey)) reasons.push("작물 일치");
      if (analysis.issueKey && issueTags.includes(analysis.issueKey)) reasons.push("문제 일치");
      if (deal.is_featured) reasons.push("대표 노출");
      if (num(deal.sponsor_weight, 0) > 0) reasons.push("협찬 반영");
      if (num(deal.manual_boost, 0) > 0) reasons.push("운영 부스트");
      if (campaignBonus(deal.campaign_tag, analysis) > 0) reasons.push("캠페인 반영");

      return {
        deal_id: realDealId,
        deal_title: safeStr(deal.title || deal.name, "추천 딜"),
        deal_url:
          safeStr(deal.deal_url, "") ||
          `/expo/booths/${safeStr(deal.booth_id, "")}`,
        reason: reasons.length
          ? reasons.join(" · ")
          : "입력 내용과 관련성이 높은 딜입니다.",
        score: totalScore,
      };
    })
    .filter((v): v is RecommendedDeal => !!v)
    .sort((a, b) => b.score - a.score);
}

function buildFallbackBooths(analysis: ConsultAnalysis): RecommendedBooth[] {
  return [
    {
      booth_key: "fallback",
      booth_name: "한국농수산TV 추천 부스",
      booth_url: "/expo/booths",
      reason: analysis.issueKey
        ? "입력된 문제와 가까운 기본 추천 부스입니다."
        : "기본 추천 부스입니다.",
      score: 1,
    },
  ];
}

function buildFallbackProducts(analysis: ConsultAnalysis): RecommendedProduct[] {
  return [
    {
      product_name: "추천 제품 모아보기",
      product_url: "/expo/consult",
      reason: analysis.issueKey
        ? "입력된 문제와 가까운 기본 추천 제품 경로입니다."
        : "기본 추천 제품 경로입니다.",
      score: 1,
    },
  ];
}

function buildFallbackDeals(analysis: ConsultAnalysis): RecommendedDeal[] {
  return [
    {
      deal_id: "fallback",
      deal_title: analysis.issueKey ? "추천 딜 보기" : "진행 중 특가 보기",
      deal_url: "/expo/deals",
      reason: analysis.issueKey
        ? "입력된 문제와 가까운 기본 추천 딜 경로입니다."
        : "현재 운영 중인 대표 딜 경로입니다.",
      score: 1,
    },
  ];
}