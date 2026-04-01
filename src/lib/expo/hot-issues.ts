import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpoHotIssue = {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  image_url: string | null;
  button_text: string | null;
  link_type: string | null;
  link_url: string;
  sort_order: number;
  is_featured: boolean;
};

function isInRange(now: Date, startsAt?: string | null, endsAt?: string | null) {
  const nowTime = now.getTime();
  const startTime = startsAt ? new Date(startsAt).getTime() : null;
  const endTime = endsAt ? new Date(endsAt).getTime() : null;

  if (startTime && nowTime < startTime) return false;
  if (endTime && nowTime > endTime) return false;
  return true;
}

export async function getExpoHotIssues(): Promise<ExpoHotIssue[]> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("expo_hot_issues")
    .select(`
      id,
      title,
      subtitle,
      badge_text,
      image_url,
      button_text,
      link_type,
      link_url,
      sort_order,
      is_featured,
      starts_at,
      ends_at,
      is_active
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .filter((row: any) => isInRange(now, row.starts_at ?? null, row.ends_at ?? null))
    .map((row: any) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      subtitle: row.subtitle ?? null,
      badge_text: row.badge_text ?? null,
      image_url: row.image_url ?? null,
      button_text: row.button_text ?? "자세히 보기",
      link_type: row.link_type ?? "internal",
      link_url: String(row.link_url ?? "#"),
      sort_order: Number(row.sort_order ?? 0),
      is_featured: !!row.is_featured,
    }));
}