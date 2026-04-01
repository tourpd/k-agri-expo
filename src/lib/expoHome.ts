import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type ExpoHomeSlot = {
  id: string;
  section_key: string;
  slot_order: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  badge_text: string | null;
  button_text: string | null;
  link_type: string;
  link_value: string | null;
  price_text: string | null;
  stock_text: string | null;
  event_text: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export async function getExpoHomeSlots(sectionKey: string, limit = 10) {
  const now = new Date().toISOString();

  let query = supabase
    .from("expo_home_slots")
    .select("*")
    .eq("section_key", sectionKey)
    .eq("is_active", true)
    .order("slot_order", { ascending: true })
    .limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  const rows = (data ?? []) as ExpoHomeSlot[];

  return rows.filter((row) => {
    const startOk = !row.starts_at || row.starts_at <= now;
    const endOk = !row.ends_at || row.ends_at >= now;
    return startOk && endOk;
  });
}