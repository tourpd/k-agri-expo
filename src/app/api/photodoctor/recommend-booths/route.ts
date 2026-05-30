import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuleRow = {
  id?: string;

  diagnosis_keyword?: string | null;
  crop_name?: string | null;
  issue_type?: string | null;

  product_name?: string | null;
  product_id?: string | null;
  product_slug?: string | null;
  booth_id?: string | null;

  recommend_order?: number | null;
  exposure_priority?: number | null;
  recommend_label?: string | null;
  recommend_reason?: string | null;
  usage_summary?: string | null;

  season?: string | null;
  farming_type?: string | null;
  is_featured?: boolean | null;

  button_text?: string | null;
  button_link?: string | null;

  is_active?: boolean | null;
  created_at?: string | null;
};

function jsonError(message: string, status = 400) {
  return Response.json(
    {
      ok: false,
      success: false,
      error: message,
    },
    { status }
  );
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown) {
  return clean(value).toLowerCase().replace(/\s+/g, "");
}

function includesKeyword(target: string, keyword: string) {
  const t = normalizeText(target);
  const k = normalizeText(keyword);

  if (!t || !k) return false;

  return t.includes(k) || k.includes(t);
}

function optionalMatch(input: string, ruleValue?: string | null) {
  const rule = clean(ruleValue);
  if (!rule) return true;
  if (!input) return true;

  return includesKeyword(input, rule);
}

function productHref(rule: RuleRow) {
  const buttonLink = clean(rule.button_link);
  if (buttonLink) return buttonLink;

  const productName = clean(rule.product_name);

  return `/photodoctor/buy?product=${encodeURIComponent(
    productName
  )}&source=photodoctor`;
}

function toItem(rule: RuleRow, fallbackOrder = 100) {
  const productName = clean(rule.product_name);
  const productSlug = clean(rule.product_slug);
  const productId = clean(rule.product_id);
  const boothId = clean(rule.booth_id);
  const order = Number(rule.recommend_order || fallbackOrder);
  const exposurePriority = Number(rule.exposure_priority || 100);

  const featuredBonus = rule.is_featured ? 5000 : 0;
  const score = featuredBonus + (1000 - exposurePriority) + (1000 - order);

  return {
    id: rule.id,

    diagnosis_keyword: rule.diagnosis_keyword,
    crop_name: rule.crop_name,
    issue_type: rule.issue_type,

    season: rule.season,
    farming_type: rule.farming_type,
    is_featured: !!rule.is_featured,

    product_name: productName,
    product_id: productId || null,
    product_slug: productSlug || null,
    booth_id: boothId || null,

    recommend_order: order,
    exposure_priority: exposurePriority,
    recommend_label: rule.recommend_label,
    recommend_reason: rule.recommend_reason,
    usage_summary: rule.usage_summary,

    button_text: rule.button_text || "구매하기",
    button_link: productHref(rule),

    is_active: rule.is_active,
    score,
  };
}

function uniqueByProductName(items: ReturnType<typeof toItem>[]) {
  const seen = new Set<string>();
  const result: ReturnType<typeof toItem>[] = [];

  for (const item of items) {
    const key = normalizeText(item.product_name);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(item);
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cropName = clean(body.crop_name);
    const issueType = clean(body.issue_type);
    const diagnosisText = clean(body.diagnosis_text || body.issue_type);
    const finalJudgement = clean(body.final_judgement);
    const diagnosis = clean(body.diagnosis);

    const season = clean(body.season);
    const farmingType = clean(body.farming_type);

    const limitRaw = Number(body.limit || 3);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(6, limitRaw))
      : 3;

    const sourceText = [
      cropName,
      issueType,
      diagnosisText,
      finalJudgement,
      diagnosis,
    ]
      .filter(Boolean)
      .join(" ");

    if (!sourceText) {
      return jsonError(
        "crop_name 또는 issue_type 또는 diagnosis_text가 필요합니다."
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("photodoctor_recommend_rules")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("exposure_priority", { ascending: true })
      .order("recommend_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message || "추천 자재 조회 실패", 500);
    }

    const dbRules = (data || []) as RuleRow[];

    const matchedRules = dbRules.filter((rule) => {
      const keyword = clean(rule.diagnosis_keyword);
      if (!keyword) return false;

      const diagnosisMatched = includesKeyword(sourceText, keyword);
      if (!diagnosisMatched) return false;

      const cropMatched =
        !rule.crop_name || includesKeyword(cropName, clean(rule.crop_name));

      const seasonMatched = optionalMatch(season, rule.season);
      const farmingTypeMatched = optionalMatch(farmingType, rule.farming_type);

      return cropMatched && seasonMatched && farmingTypeMatched;
    });

    const items = uniqueByProductName(
      matchedRules
        .map((rule, index) => toItem(rule, index + 1))
        .sort((a, b) => {
          const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
          if (scoreDiff !== 0) return scoreDiff;

          const orderDiff =
            Number(a.recommend_order || 100) -
            Number(b.recommend_order || 100);

          if (orderDiff !== 0) return orderDiff;

          return String(a.product_name).localeCompare(
            String(b.product_name),
            "ko"
          );
        })
    ).slice(0, limit);

    return Response.json({
      ok: true,
      success: true,
      source_text: sourceText,
      filters: {
        crop_name: cropName,
        season,
        farming_type: farmingType,
        limit,
      },
      rule_count: dbRules.length,
      matched_count: matchedRules.length,
      items,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "추천 자재 조회 중 오류",
      500
    );
  }
}