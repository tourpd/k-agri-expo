// src/lib/expoPublic.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ 퍼블릭(농민 노출) 조회 전용: 세션 저장/리프레시 없음
export const supabasePublic = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type BoothPublic = {
  booth_id: string;
  vendor_id: string | null;

  name: string | null;
  region: string | null;
  category_primary: string | null;

  intro: string | null;
  description: string | null;

  status: string | null;
  owner_user_id: string | null;

  phone: string | null;
  email: string | null;
  kakao_url: string | null;

  primary_image_path: string | null;
  created_at: string | null;
};

export type BoothImagePublic = {
  id: string;
  booth_id: string;
  file_path: string;
  is_primary: boolean | null;
  created_at: string | null;
};

export type ProductPublic = {
  id: string;
  booth_id: string;

  name: string | null;
  summary: string | null;
  description: string | null;

  price_text: string | null;
  primary_image_path: string | null;

  created_at: string | null;
};

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
      "booth_id,vendor_id,name,region,category_primary,intro,status,phone,email,kakao_url,primary_image_path,created_at"
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

  return (data ?? []) as BoothPublic[];
}

export async function getPublicBoothDetail(boothId: string) {
  // ✅ booth_id 기준
  const { data: booth, error: e1 } = await supabasePublic
    .from("booths")
    .select(
      "booth_id,vendor_id,name,region,category_primary,intro,description,status,owner_user_id,phone,email,kakao_url,primary_image_path,created_at"
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
    .select("id,booth_id,name,summary,description,price_text,primary_image_path,created_at")
    .eq("booth_id", boothId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (e3) throw e3;

  return {
    booth: (booth as BoothPublic | null) ?? null,
    images: (images ?? []) as BoothImagePublic[],
    products: (products ?? []) as ProductPublic[],
  };
}

export async function getPublicProduct(productId: string) {
  const { data, error } = await supabasePublic
    .from("products")
    .select("id,booth_id,name,summary,description,price_text,primary_image_path,created_at")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw error;
  return data as ProductPublic | null;
}