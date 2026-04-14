import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ExpoSlotType = "new" | "featured" | "hero";

type AutoPlaceExpoOptions = {
  promotionPreference?: string | null;
  slotType?: ExpoSlotType | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveSlotType(options?: AutoPlaceExpoOptions): ExpoSlotType {
  const explicit = normalizeString(options?.slotType);
  if (explicit === "hero" || explicit === "featured" || explicit === "new") {
    return explicit;
  }

  const promotionPreference = normalizeString(options?.promotionPreference);
  if (promotionPreference === "new_product_focus") {
    return "featured";
  }

  return "new";
}

function pickTitle(slotType: ExpoSlotType, value?: string | null) {
  const title = normalizeString(value);
  if (title) return title;

  if (slotType === "hero") return "추천 브랜드";
  if (slotType === "featured") return "이달의 신제품";
  return "신규 입점 업체";
}

function pickSubtitle(slotType: ExpoSlotType, value?: string | null) {
  const subtitle = normalizeString(value);
  if (subtitle) return subtitle;

  if (slotType === "hero") return "지금 가장 먼저 확인할 업체";
  if (slotType === "featured") return "새롭게 주목할 제품을 확인하세요";
  return "지금 확인하세요";
}

async function getNextOrder(slotType: ExpoSlotType) {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from("expo_home_slots")
    .select("*", { count: "exact", head: true })
    .eq("slot_type", slotType);

  if (error) {
    throw new Error(error.message || "expo_home_slots 순번 계산 실패");
  }

  return (count || 0) + 1;
}

export async function autoPlaceExpo(
  boothId: string,
  options?: AutoPlaceExpoOptions
) {
  const supabase = getSupabaseAdmin();

  if (!boothId) {
    throw new Error("boothId가 필요합니다.");
  }

  const slotType = resolveSlotType(options);
  const title = pickTitle(slotType, options?.title);
  const subtitle = pickSubtitle(slotType, options?.subtitle);
  const imageUrl = normalizeString(options?.imageUrl) || null;
  const linkUrl = normalizeString(options?.linkUrl) || null;

  const { data: existing, error: existingError } = await supabase
    .from("expo_home_slots")
    .select("id, slot_type, slot_order")
    .eq("booth_id", boothId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message || "기존 홈 슬롯 조회 실패");
  }

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      slot_type: slotType,
      title,
      subtitle,
      image_url: imageUrl,
      link_url: linkUrl,
      is_active: true,
    };

    if (!existing.slot_order) {
      patch.slot_order = await getNextOrder(slotType);
    }

    const { data, error } = await supabase
      .from("expo_home_slots")
      .update(patch)
      .eq("id", existing.id)
      .select("id, booth_id, slot_type, slot_order")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "기존 홈 슬롯 업데이트 실패");
    }

    return {
      id: data.id,
      boothId: data.booth_id,
      slotType: data.slot_type,
      slotOrder: data.slot_order,
      mode: "updated",
    };
  }

  const nextOrder = await getNextOrder(slotType);

  const { data, error } = await supabase
    .from("expo_home_slots")
    .insert({
      booth_id: boothId,
      slot_type: slotType,
      slot_order: nextOrder,
      title,
      subtitle,
      image_url: imageUrl,
      link_url: linkUrl,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select("id, booth_id, slot_type, slot_order")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Expo 홈 자동 배치 실패");
  }

  return {
    id: data.id,
    boothId: data.booth_id,
    slotType: data.slot_type,
    slotOrder: data.slot_order,
    mode: "inserted",
  };
}

export async function removeExpoPlacement(boothId: string) {
  const supabase = getSupabaseAdmin();

  if (!boothId) {
    throw new Error("boothId가 필요합니다.");
  }

  const { error } = await supabase
    .from("expo_home_slots")
    .update({
      slot_type: "new",
      title: "신규 입점 업체",
      subtitle: "지금 확인하세요",
      is_active: true,
    })
    .eq("booth_id", boothId);

  if (error) {
    throw new Error(error.message || "Expo 홈 슬롯 원복 실패");
  }

  return { ok: true };
}