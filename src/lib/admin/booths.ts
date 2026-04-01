import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminBoothRow = {
  booth_id: string;
  name: string | null;
  intro: string | null;
  sponsor_weight: number | null;
  manual_boost: number | null;
  is_featured: boolean | null;
  campaign_tag: string | null;
  is_active: boolean | null;
  is_public: boolean | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  category_tags?: string[] | null;
};

export async function listAdminBooths() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("booths")
    .select(`
      booth_id,
      name,
      intro,
      sponsor_weight,
      manual_boost,
      is_featured,
      campaign_tag,
      is_active,
      is_public,
      crop_tags,
      issue_tags,
      category_tags
    `)
    .order("is_featured", { ascending: false })
    .order("manual_boost", { ascending: false })
    .order("sponsor_weight", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`booths 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminBoothRow[];
}

export async function updateAdminBoothWeights(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const boothId = String(formData.get("booth_id") ?? "").trim();
  if (!boothId) throw new Error("부스 ID가 없습니다.");

  const sponsorWeight = toNumber(formData.get("sponsor_weight"), 0);
  const manualBoost = toNumber(formData.get("manual_boost"), 0);
  const isFeatured = formData.get("is_featured") === "on";
  const campaignTag = nullableString(formData.get("campaign_tag"));

  const { error } = await supabase
    .from("booths")
    .update({
      sponsor_weight: sponsorWeight,
      manual_boost: manualBoost,
      is_featured: isFeatured,
      campaign_tag: campaignTag,
    })
    .eq("booth_id", boothId);

  if (error) {
    throw new Error(`부스 노출 제어 수정 실패: ${error.message}`);
  }
}

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const s = String(value ?? "").trim();
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function nullableString(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}