// src/lib/expoPublic.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabasePublic = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* =========================
   TYPES
========================= */

export type BoothPublic = {
  booth_id: string;
  owner_user_id: string | null;
  hall_id: string | null;

  name: string | null;
  category_primary: string | null;
  region: string | null;

  contact_name: string | null;
  phone: string | null;
  email: string | null;

  intro: string | null;
  description: string | null;

  status: string | null;
  created_at: string | null;

  // 일반 표시용
  is_featured?: boolean | null;
  is_verified?: boolean | null;

  // 프리미엄 스폰서 슬롯용
  is_main_sponsor?: boolean | null;
  is_inputs_sponsor?: boolean | null;
  is_machine_sponsor?: boolean | null;
  is_seed_sponsor?: boolean | null;
  is_smartfarm_sponsor?: boolean | null;
  sponsor_sort_order?: number | null;

  // 이미지/로고용
  logo_url?: string | null;
  cover_image_url?: string | null;
};

export type ProductPublic = {
  product_id: string;
  booth_id: string;
  name: string | null;
  description: string | null;
  price_text: string | null;
  created_at: string | null;
};

export type BoothImagePublic = {
  id: string;
  booth_id: string;
  file_path: string;
  is_primary: boolean | null;
  created_at: string | null;
};

export type ExpoDealPublic = {
  deal_id: string;
  booth_id: string;
  product_id: string | null;

  title: string | null;
  description: string | null;

  regular_price_text: string | null;
  expo_price_text: string | null;
  stock_text: string | null;

  deadline_at: string | null;
  buy_url: string | null;

  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;

  // 목록용 join 표시 필드
  booth_name?: string | null;
  booth_region?: string | null;
  booth_category_primary?: string | null;
};

/* =========================
   BOOTHS
========================= */

export async function getPublicBooths(params: {
  q?: string;
  category?: string;
  region?: string;
  limit?: number;
}) {
  const { q, category, region, limit = 30 } = params;

  let query = supabasePublic
    .from("booths")
    .select(
      [
        "booth_id",
        "owner_user_id",
        "hall_id",
        "name",
        "category_primary",
        "region",
        "contact_name",
        "phone",
        "email",
        "intro",
        "description",
        "status",
        "created_at",
        "is_featured",
        "is_verified",
        "is_main_sponsor",
        "is_inputs_sponsor",
        "is_machine_sponsor",
        "is_seed_sponsor",
        "is_smartfarm_sponsor",
        "sponsor_sort_order",
        "logo_url",
        "cover_image_url",
      ].join(",")
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.ilike("category_primary", `%${category}%`);
  if (region) query = query.ilike("region", `%${region}%`);

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,intro.ilike.%${q}%,region.ilike.%${q}%,category_primary.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as unknown as BoothPublic[];
}

export async function getPublicBoothDetail(boothId: string) {
  const { data: booth, error: e1 } = await supabasePublic
    .from("booths")
    .select(
      [
        "booth_id",
        "owner_user_id",
        "hall_id",
        "name",
        "category_primary",
        "region",
        "contact_name",
        "phone",
        "email",
        "intro",
        "description",
        "status",
        "created_at",
        "is_featured",
        "is_verified",
        "is_main_sponsor",
        "is_inputs_sponsor",
        "is_machine_sponsor",
        "is_seed_sponsor",
        "is_smartfarm_sponsor",
        "sponsor_sort_order",
        "logo_url",
        "cover_image_url",
      ].join(",")
    )
    .eq("booth_id", boothId)
    .maybeSingle();

  if (e1) throw e1;

  const { data: images, error: e2 } = await supabasePublic
    .from("booth_images")
    .select("id,booth_id,file_path,is_primary,created_at")
    .eq("booth_id", boothId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (e2) throw e2;

  const { data: products, error: e3 } = await supabasePublic
    .from("products")
    .select("product_id,booth_id,name,description,price_text,created_at")
    .eq("booth_id", boothId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (e3) throw e3;

  return {
    booth: (booth as unknown as BoothPublic | null) ?? null,
    images: (images ?? []) as unknown as BoothImagePublic[],
    products: (products ?? []) as unknown as ProductPublic[],
  };
}

export async function getPublicProduct(productId: string) {
  const { data, error } = await supabasePublic
    .from("products")
    .select("product_id,booth_id,name,description,price_text,created_at")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as ProductPublic | null) ?? null;
}

/* =========================
   DEALS
========================= */

export async function getPublicDeals(limit = 30) {
  const { data, error } = await supabasePublic
    .from("expo_deals")
    .select(
      `
      deal_id,
      booth_id,
      product_id,
      title,
      description,
      regular_price_text,
      expo_price_text,
      stock_text,
      deadline_at,
      buy_url,
      is_active,
      sort_order,
      created_at,
      booths:booth_id (
        name,
        region,
        category_primary
      )
      `
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []).map((row: any) => ({
    deal_id: row.deal_id,
    booth_id: row.booth_id,
    product_id: row.product_id ?? null,

    title: row.title ?? null,
    description: row.description ?? null,

    regular_price_text: row.regular_price_text ?? null,
    expo_price_text: row.expo_price_text ?? null,
    stock_text: row.stock_text ?? null,

    deadline_at: row.deadline_at ?? null,
    buy_url: row.buy_url ?? null,

    is_active: row.is_active ?? null,
    sort_order: row.sort_order ?? null,
    created_at: row.created_at ?? null,

    booth_name: row.booths?.name ?? null,
    booth_region: row.booths?.region ?? null,
    booth_category_primary: row.booths?.category_primary ?? null,
  })) ?? []) as ExpoDealPublic[];
}

export async function getPublicDealsByBooth(boothId: string, limit = 10) {
  const { data, error } = await supabasePublic
    .from("expo_deals")
    .select(
      `
      deal_id,
      booth_id,
      product_id,
      title,
      description,
      regular_price_text,
      expo_price_text,
      stock_text,
      deadline_at,
      buy_url,
      is_active,
      sort_order,
      created_at
      `
    )
    .eq("booth_id", boothId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as unknown as ExpoDealPublic[];
}

export async function getPublicDeal(dealId: string) {
  const { data: deal, error: e1 } = await supabasePublic
    .from("expo_deals")
    .select(
      `
      deal_id,
      booth_id,
      product_id,
      title,
      description,
      regular_price_text,
      expo_price_text,
      stock_text,
      deadline_at,
      buy_url,
      is_active,
      sort_order,
      created_at
      `
    )
    .eq("deal_id", dealId)
    .maybeSingle();

  if (e1) throw e1;

  if (!deal) {
    return {
      deal: null as ExpoDealPublic | null,
      booth: null as BoothPublic | null,
    };
  }

  const boothId = (deal as any).booth_id ? String((deal as any).booth_id) : null;

  let booth: BoothPublic | null = null;

  if (boothId) {
    const { data: b, error: e2 } = await supabasePublic
      .from("booths")
      .select(
        [
          "booth_id",
          "owner_user_id",
          "hall_id",
          "name",
          "category_primary",
          "region",
          "contact_name",
          "phone",
          "email",
          "intro",
          "description",
          "status",
          "created_at",
          "is_featured",
          "is_verified",
          "is_main_sponsor",
          "is_inputs_sponsor",
          "is_machine_sponsor",
          "is_seed_sponsor",
          "is_smartfarm_sponsor",
          "sponsor_sort_order",
          "logo_url",
          "cover_image_url",
        ].join(",")
      )
      .eq("booth_id", boothId)
      .maybeSingle();

    if (e2) throw e2;
    booth = (b as unknown as BoothPublic | null) ?? null;
  }

  return {
    deal: (deal as unknown as ExpoDealPublic | null) ?? null,
    booth,
  };
}