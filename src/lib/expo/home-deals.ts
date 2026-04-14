import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

function normalizeDeals(
  deals: any[],
  boothMap: Map<string, string>
): ExpoHomeDealItem[] {
  return deals
    .filter((item: any) => !item.booth_id || boothMap.has(item.booth_id))
    .map((item: any) => ({
      deal_id: String(item.deal_id ?? item.id ?? ""),
      booth_id: item.booth_id ?? null,
      title: item.title ?? null,
      description: item.description ?? null,
      regular_price_text: item.regular_price_text ?? null,
      expo_price_text: item.expo_price_text ?? null,
      stock_text: item.stock_text ?? null,
      deadline_at: item.deadline_at ?? null,
      buy_url: item.buy_url ?? null,
      is_active: item.is_active ?? null,
      created_at: item.created_at ?? null,
      booth_name: item.booth_id
        ? boothMap.get(item.booth_id) || "참가 부스"
        : "참가 부스",
    }));
}

async function buildBoothMap(admin: ReturnType<typeof createSupabaseAdminClient>, boothIds: string[]) {
  let boothMap = new Map<string, string>();

  if (boothIds.length === 0) {
    return boothMap;
  }

  const { data: booths, error: boothError } = await admin
    .from("booths")
    .select("id,name,title,company_name,status,is_active,is_visible")
    .in("id", boothIds);

  if (boothError) {
    console.error("[getHomeDeals] booths query error:", boothError);
    return boothMap;
  }

  boothMap = new Map(
    (booths ?? [])
      .filter((b: any) => {
        // status / is_active / is_visible 구조가 섞여 있어도 최대한 유연하게 처리
        const statusOk =
          b.status == null || b.status === "active" || b.status === "live";
        const activeOk = b.is_active == null || b.is_active === true;
        const visibleOk = b.is_visible == null || b.is_visible === true;

        return statusOk && activeOk && visibleOk;
      })
      .map((b: any) => [
        String(b.id),
        b.name || b.title || b.company_name || "참가 부스",
      ])
  );

  return boothMap;
}

export async function getHomeDeals(limit = 6): Promise<ExpoHomeDealItem[]> {
  try {
    const admin = createSupabaseAdminClient();

    const { data: deals, error } = await admin
      .from("expo_deals")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !deals || deals.length === 0) {
      if (error) {
        console.error("[getHomeDeals] expo_deals error:", error);
      }
      return [];
    }

    const boothIds = Array.from(
      new Set(deals.map((d: any) => d.booth_id).filter(Boolean))
    ) as string[];

    const boothMap = await buildBoothMap(admin, boothIds);

    const normalized = normalizeDeals(deals, boothMap);

    return normalized
      .sort((a, b) => scoreDeal(b) - scoreDeal(a))
      .slice(0, limit);
  } catch (error) {
    console.error("[getHomeDeals] unexpected error:", error);
    return [];
  }
}

export async function getAllActiveDeals(
  limit = 60
): Promise<ExpoHomeDealItem[]> {
  try {
    const admin = createSupabaseAdminClient();

    const { data: deals, error } = await admin
      .from("expo_deals")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !deals || deals.length === 0) {
      if (error) {
        console.error("[getAllActiveDeals] expo_deals error:", error);
      }
      return [];
    }

    const boothIds = Array.from(
      new Set(deals.map((d: any) => d.booth_id).filter(Boolean))
    ) as string[];

    const boothMap = await buildBoothMap(admin, boothIds);

    return normalizeDeals(deals, boothMap).sort(
      (a, b) => scoreDeal(b) - scoreDeal(a)
    );
  } catch (error) {
    console.error("[getAllActiveDeals] unexpected error:", error);
    return [];
  }
}