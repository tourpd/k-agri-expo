import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

function matchesMonthAndSeason<T extends {
  month_key?: number | null;
  season_key?: string | null;
  start_at?: string | null;
  end_at?: string | null;
}>(
  items: T[],
  month: number,
  seasonKey: string,
  now: Date
) {
  const nowTime = now.getTime();

  return items.filter((item) => {
    const monthOk =
      item.month_key == null || Number(item.month_key) === month;

    const seasonOk =
      item.season_key == null || String(item.season_key) === seasonKey;

    const startOk =
      !item.start_at || new Date(item.start_at).getTime() <= nowTime;

    const endOk =
      !item.end_at || new Date(item.end_at).getTime() >= nowTime;

    return monthOk && seasonOk && startOk && endOk;
  });
}

export async function getExpoProblemSectionData() {
  const supabase = createSupabaseAdminClient();

  const now = new Date();
  const month = now.getMonth() + 1;
  const seasonKey = getSeasonKey(month);

  const [
    { data: rawContents, error: contentError },
    { data: rawQuickLinks, error: quickLinkError },
  ] = await Promise.all([
    supabase
      .from("expo_problem_contents")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true }),

    supabase
      .from("expo_problem_quick_links")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true }),
  ]);

  if (contentError) {
    console.error("[getExpoProblemSectionData] contents error:", contentError);
  }

  if (quickLinkError) {
    console.error("[getExpoProblemSectionData] quickLinks error:", quickLinkError);
  }

  const filteredContents = matchesMonthAndSeason(
    (rawContents ?? []) as ExpoProblemContent[],
    month,
    seasonKey,
    now
  ).slice(0, 4);

  const filteredQuickLinks = matchesMonthAndSeason(
    (rawQuickLinks ?? []) as ExpoProblemQuickLink[],
    month,
    seasonKey,
    now
  ).slice(0, 6);

  return {
    contents: filteredContents,
    quickLinks: filteredQuickLinks,
    currentMonth: month,
    currentSeason: seasonKey,
  };
}