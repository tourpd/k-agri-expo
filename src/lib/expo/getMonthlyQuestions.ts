import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getMonthlyQuestions() {
  const supabase = await createSupabaseServerClient();

  const month = new Date().getMonth() + 1;

  const { data } = await supabase
    .from("consult_question_presets")
    .select("*")
    .eq("is_active", true);

  const filtered =
    data?.filter((q) => {
      if (!q.start_month || !q.end_month) return true;

      // 월 범위 체크
      if (q.start_month <= q.end_month) {
        return month >= q.start_month && month <= q.end_month;
      } else {
        // 12~2월 같은 경우
        return month >= q.start_month || month <= q.end_month;
      }
    }) ?? [];

  return filtered.sort((a, b) => a.priority - b.priority).slice(0, 6);
}