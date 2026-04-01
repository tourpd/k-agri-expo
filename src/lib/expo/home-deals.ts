import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ExpoHomeDealItem = {
  deal_id: string;
  booth_id: string | null;
  title: string | null;
  description: string | null;
  regular_price_text: string | null;
  expo_price_text: string | null;
  stock_text: string | null;
  deadline_at: string | null;
  buy_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  booth_name?: string | null;
};

function scoreDeal(item: ExpoHomeDealItem) {
  let score = 0;

  if (item.is_active) score += 100;

  if (item.deadline_at) {
    const diff = new Date(item.deadline_at).getTime() - Date.now();
    if (diff > 0) {
      const hours = diff / (1000 * 60 * 60);
      if (hours <= 24) score += 50;
      else if (hours <= 72) score += 30;
      else if (hours <= 168) score += 10;
    }
  }

  if (item.created_at) {
    const diff = Date.now() - new Date(item.created_at).getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days <= 3) score += 20;
    else if (days <= 7) score += 10;
  }

  return score;
}

export async function getHomeDeals(limit = 6): Promise<ExpoHomeDealItem[]> {
  const admin = createSupabaseAdminClient();

  const { data: deals, error } = await admin
    .from("expo_deals")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !deals || deals.length === 0) {
    return [];
  }

  const boothIds = Array.from(
    new Set(deals.map((d: any) => d.booth_id).filter(Boolean))
  );

  let boothMap = new Map<string, string>();

  if (boothIds.length > 0) {
    const { data: booths } = await admin
      .from("booths")
      .select("booth_id,name,status,is_published")
      .in("booth_id", boothIds)
      .eq("status", "active")
      .eq("is_published", true);

    boothMap = new Map(
      (booths ?? []).map((b: any) => [b.booth_id, b.name || "참가 부스"])
    );
  }

  const normalized: ExpoHomeDealItem[] = deals
    .filter((item: any) => !item.booth_id || boothMap.has(item.booth_id))
    .map((item: any) => ({
      deal_id: item.deal_id,
      booth_id: item.booth_id,
      title: item.title,
      description: item.description,
      regular_price_text: item.regular_price_text,
      expo_price_text: item.expo_price_text,
      stock_text: item.stock_text,
      deadline_at: item.deadline_at,
      buy_url: item.buy_url,
      is_active: item.is_active,
      created_at: item.created_at,
      booth_name: item.booth_id ? boothMap.get(item.booth_id) || "참가 부스" : "참가 부스",
    }));

  return normalized
    .sort((a, b) => scoreDeal(b) - scoreDeal(a))
    .slice(0, limit);
}

export async function getAllActiveDeals(limit = 60): Promise<ExpoHomeDealItem[]> {
  const admin = createSupabaseAdminClient();

  const { data: deals, error } = await admin
    .from("expo_deals")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !deals || deals.length === 0) {
    return [];
  }

  const boothIds = Array.from(
    new Set(deals.map((d: any) => d.booth_id).filter(Boolean))
  );

  let boothMap = new Map<string, string>();

  if (boothIds.length > 0) {
    const { data: booths } = await admin
      .from("booths")
      .select("booth_id,name,status,is_published")
      .in("booth_id", boothIds)
      .eq("status", "active")
      .eq("is_published", true);

    boothMap = new Map(
      (booths ?? []).map((b: any) => [b.booth_id, b.name || "참가 부스"])
    );
  }

  return deals
    .filter((item: any) => !item.booth_id || boothMap.has(item.booth_id))
    .map((item: any) => ({
      deal_id: item.deal_id,
      booth_id: item.booth_id,
      title: item.title,
      description: item.description,
      regular_price_text: item.regular_price_text,
      expo_price_text: item.expo_price_text,
      stock_text: item.stock_text,
      deadline_at: item.deadline_at,
      buy_url: item.buy_url,
      is_active: item.is_active,
      created_at: item.created_at,
      booth_name: item.booth_id ? boothMap.get(item.booth_id) || "참가 부스" : "참가 부스",
    }))
    .sort((a, b) => scoreDeal(b) - scoreDeal(a));
}