// src/lib/expoFeatureSlots.ts
export type FeatureTargetType = "booth" | "deal" | "hall" | "custom" | "none" | null;

export type ExpoFeatureSlot = {
  slot_id: string;
  slot_group: string;
  slot_order: number;

  booth_id: string | null;
  deal_id: string | null;

  title_override: string | null;
  subtitle_override: string | null;

  cover_image_url: string | null;
  logo_url: string | null;

  primary_cta_text: string | null;
  primary_target_type: FeatureTargetType;
  primary_target_value: string | null;

  secondary_cta_text: string | null;
  secondary_target_type: FeatureTargetType;
  secondary_target_value: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function resolveFeatureHref(
  targetType: FeatureTargetType,
  targetValue: string | null
) {
  if (!targetType || targetType === "none") return null;
  if (!targetValue?.trim()) return null;

  if (targetType === "booth") {
    return `/expo/booths/${targetValue}`;
  }

  if (targetType === "deal") {
    return `/expo/deals/${targetValue}`;
  }

  if (targetType === "hall") {
    return `/expo/hall/${targetValue}`;
  }

  if (targetType === "custom") {
    return targetValue;
  }

  return null;
}