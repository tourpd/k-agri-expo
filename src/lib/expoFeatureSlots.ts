import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabasePublic = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type FeatureTargetType = "booth" | "deal" | "hall" | "custom" | "none" | null;

export type ExpoFeatureSlotResolved = {
  slot_id: string;
  slot_group: string;
  slot_order: number;

  booth_id: string | null;
  deal_id: string | null;

  title: string | null;
  subtitle: string | null;

  cover_image_url: string | null;
  logo_url: string | null;

  primary_cta_text: string | null;
  primary_target_type: FeatureTargetType;
  primary_target_value: string | null;

  secondary_cta_text: string | null;
  secondary_target_type: FeatureTargetType;
  secondary_target_value: string | null;

  is_active: boolean;

  booth_name: string | null;
  booth_intro: string | null;
  booth_region: string | null;
  booth_category_primary: string | null;
};

export function resolveFeatureHref(
  targetType: FeatureTargetType,
  targetValue: string | null
) {
  if (!targetType || targetType === "none") return null;
  if (!targetValue?.trim()) return null;

  if (targetType === "booth") return `/expo/booths/${targetValue}`;
  if (targetType === "deal") return `/expo/deals/${targetValue}`;
  if (targetType === "hall") return `/expo/hall/${targetValue}`;
  if (targetType === "custom") return targetValue;

  return null;
}

export async function getFeatureSlots(slotGroup: string, limit = 5) {
  const { data, error } = await supabasePublic
    .from("expo_feature_slots")
    .select(
      `
      slot_id,
      slot_group,
      slot_order,
      booth_id,
      deal_id,
      title_override,
      subtitle_override,
      cover_image_url,
      logo_url,
      primary_cta_text,
      primary_target_type,
      primary_target_value,
      secondary_cta_text,
      secondary_target_type,
      secondary_target_value,
      is_active,
      booths:booth_id (
        booth_id,
        name,
        intro,
        region,
        category_primary,
        logo_url,
        cover_image_url
      )
      `
    )
    .eq("slot_group", slotGroup)
    .eq("is_active", true)
    .order("slot_order", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const booth = row.booths ?? null;

    return {
      slot_id: row.slot_id,
      slot_group: row.slot_group,
      slot_order: row.slot_order,

      booth_id: row.booth_id ?? null,
      deal_id: row.deal_id ?? null,

      title: row.title_override ?? booth?.name ?? null,
      subtitle: row.subtitle_override ?? booth?.intro ?? null,

      cover_image_url: row.cover_image_url ?? booth?.cover_image_url ?? booth?.logo_url ?? null,
      logo_url: row.logo_url ?? booth?.logo_url ?? null,

      primary_cta_text: row.primary_cta_text ?? "자세히 보기",
      primary_target_type: row.primary_target_type ?? "booth",
      primary_target_value: row.primary_target_value ?? row.booth_id ?? null,

      secondary_cta_text: row.secondary_cta_text ?? null,
      secondary_target_type: row.secondary_target_type ?? null,
      secondary_target_value: row.secondary_target_value ?? null,

      is_active: row.is_active ?? true,

      booth_name: booth?.name ?? null,
      booth_intro: booth?.intro ?? null,
      booth_region: booth?.region ?? null,
      booth_category_primary: booth?.category_primary ?? null,
    };
  }) as ExpoFeatureSlotResolved[];
}