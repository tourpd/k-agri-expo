import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpoCategory = {
  category_id: string;
  slug: string;
  name: string;
  short_desc: string | null;
  hero_title: string | null;
  hero_desc: string | null;
  icon: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function getExpoCategories(): Promise<ExpoCategory[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("expo_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as ExpoCategory[];
}