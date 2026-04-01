import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ExpoProblemContent,
  ExpoProblemQuickLink,
} from "@/types/expo-home";

function getSeasonKey(month: number) {
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "fall";
  return "winter";
}

export async function getExpoProblemSectionData() {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const month = now.getMonth() + 1;
  const seasonKey = getSeasonKey(month);
  const nowIso = now.toISOString();

  const [{ data: contents }, { data: quickLinks }] = await Promise.all([
    supabase
      .from("expo_problem_contents")
      .select("*")
      .eq("is_active", true)
      .or(`month_key.is.null,month_key.eq.${month}`)
      .or(`season_key.is.null,season_key.eq.${seasonKey}`)
      .or(`start_at.is.null,start_at.lte.${nowIso}`)
      .or(`end_at.is.null,end_at.gte.${nowIso}`)
      .order("priority", { ascending: true })
      .limit(4),

    supabase
      .from("expo_problem_quick_links")
      .select("*")
      .eq("is_active", true)
      .or(`month_key.is.null,month_key.eq.${month}`)
      .or(`season_key.is.null,season_key.eq.${seasonKey}`)
      .or(`start_at.is.null,start_at.lte.${nowIso}`)
      .or(`end_at.is.null,end_at.gte.${nowIso}`)
      .order("priority", { ascending: true })
      .limit(6),
  ]);

  return {
    contents: (contents ?? []) as ExpoProblemContent[],
    quickLinks: (quickLinks ?? []) as ExpoProblemQuickLink[],
    currentMonth: month,
    currentSeason: seasonKey,
  };
}