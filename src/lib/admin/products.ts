import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminProductRow = {
  id: string;
  booth_id: string | null;
  name: string | null;
  description: string | null;
  sponsor_weight: number | null;
  manual_boost: number | null;
  is_featured: boolean | null;
  campaign_tag: string | null;
  is_active: boolean | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  category_tags?: string[] | null;
};

export async function listAdminProducts() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("booth_products")
    .select(`
      id,
      booth_id,
      name,
      description,
      sponsor_weight,
      manual_boost,
      is_featured,
      campaign_tag,
      is_active,
      crop_tags,
      issue_tags,
      category_tags
    `)
    .order("is_featured", { ascending: false })
    .order("manual_boost", { ascending: false })
    .order("sponsor_weight", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`booth_products 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminProductRow[];
}

export async function updateAdminProductWeights(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("제품 ID가 없습니다.");

  const sponsorWeight = toNumber(formData.get("sponsor_weight"), 0);
  const manualBoost = toNumber(formData.get("manual_boost"), 0);
  const isFeatured = formData.get("is_featured") === "on";
  const campaignTag = nullableString(formData.get("campaign_tag"));

  const { error } = await supabase
    .from("booth_products")
    .update({
      sponsor_weight: sponsorWeight,
      manual_boost: manualBoost,
      is_featured: isFeatured,
      campaign_tag: campaignTag,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`제품 노출 점수 수정 실패: ${error.message}`);
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