import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpoProblemCard = {
  id: string;
  title: string;
  summary: string | null;
  link_url: string;
  crop_key: string | null;
  topic_key: string | null;
  season_key: string | null;
  start_month: number;
  end_month: number;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  badge_text: string | null;
  thumbnail_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function isMonthInRange(month: number, startMonth: number, endMonth: number) {
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  return month >= startMonth || month <= endMonth;
}

function sortCards(a: ExpoProblemCard, b: ExpoProblemCard) {
  if (a.is_featured !== b.is_featured) {
    return a.is_featured ? -1 : 1;
  }
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bTime - aTime;
}

export async function getMonthlyProblemCards(limit = 4): Promise<ExpoProblemCard[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const currentMonth = new Date().getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    const { data, error } = await supabase
      .from("expo_problem_cards")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("[getMonthlyProblemCards] supabase error:", error);
      return [];
    }

    const rows = ((data ?? []) as ExpoProblemCard[]).sort(sortCards);

    const currentMonthCards = rows.filter((item) =>
      isMonthInRange(currentMonth, item.start_month, item.end_month)
    );

    if (currentMonthCards.length > 0) {
      return currentMonthCards.slice(0, limit);
    }

    const nextMonthCards = rows.filter((item) =>
      isMonthInRange(nextMonth, item.start_month, item.end_month)
    );

    if (nextMonthCards.length > 0) {
      return nextMonthCards.slice(0, limit);
    }

    return rows.slice(0, limit);
  } catch (error) {
    console.error("[getMonthlyProblemCards] unexpected error:", error);
    return [];
  }
}