import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ConsultLeadInput = {
  region?: string | null;
  crop?: string | null;
  category?: string | null;
};

type VendorRow = {
  id: string;
  company_name: string | null;
  plan_type: string | null;
  sponsor_score: number | null;
  response_score: number | null;
  conversion_score: number | null;
  is_lead_enabled: boolean | null;
  lead_regions: string[] | null;
  lead_crops: string[] | null;
  lead_categories: string[] | null;
};

export type RankedVendor = {
  vendor_id: string;
  company_name: string | null;
  rank_no: number;
  match_score: number;
  sponsor_score: number;
  performance_score: number;
  final_score: number;
};

function normalize(v?: string | null) {
  return (v || "").trim().toLowerCase();
}

function includesNormalized(arr?: string[] | null, value?: string | null) {
  const needle = normalize(value);
  if (!needle) return false;
  return (arr || []).map(normalize).includes(needle);
}

function calcMatchScore(vendor: VendorRow, lead: ConsultLeadInput) {
  let score = 0;

  if (lead.crop && includesNormalized(vendor.lead_crops, lead.crop)) score += 20;
  if (lead.category && includesNormalized(vendor.lead_categories, lead.category)) score += 20;
  if (lead.region && includesNormalized(vendor.lead_regions, lead.region)) score += 10;

  return score;
}

function calcSponsorScore(vendor: VendorRow) {
  if (typeof vendor.sponsor_score === "number") return vendor.sponsor_score;

  switch ((vendor.plan_type || "basic").toLowerCase()) {
    case "premium":
      return 30;
    case "standard":
      return 20;
    default:
      return 10;
  }
}

function clamp(v: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, v));
}

function calcPerformanceScore(vendor: VendorRow) {
  return clamp(vendor.response_score ?? 0) + clamp(vendor.conversion_score ?? 0);
}

export async function rankVendorsForLead(
  lead: ConsultLeadInput,
  topN = 3
): Promise<RankedVendor[]> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("vendors")
    .select(`
      id,
      company_name,
      plan_type,
      sponsor_score,
      response_score,
      conversion_score,
      is_lead_enabled,
      lead_regions,
      lead_crops,
      lead_categories
    `)
    .eq("is_lead_enabled", true);

  if (error || !data) return [];

  return (data as VendorRow[])
    .map((vendor) => {
      const match_score = calcMatchScore(vendor, lead);
      if (match_score <= 0) return null;

      const sponsor_score = calcSponsorScore(vendor);
      const performance_score = calcPerformanceScore(vendor);
      const final_score = match_score + sponsor_score + performance_score;

      return {
        vendor_id: vendor.id,
        company_name: vendor.company_name,
        match_score,
        sponsor_score,
        performance_score,
        final_score,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.final_score - a.final_score)
    .slice(0, topN)
    .map((row: any, idx: number) => ({
      ...row,
      rank_no: idx + 1,
    }));
}