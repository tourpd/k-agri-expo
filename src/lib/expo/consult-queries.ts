import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConsultQuestionPreset = {
  id: string;
  question_text: string;
  crop_key: string | null;
  symptom_key: string | null;
  intent_key: string | null;
};

function monthInRange(month: number, startMonth: number | null, endMonth: number | null) {
  if (!startMonth || !endMonth) return true;

  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }

  return month >= startMonth || month <= endMonth;
}

export async function getMonthlyConsultQuestions(): Promise<ConsultQuestionPreset[]> {
  const supabase = await createSupabaseServerClient();
  const currentMonth = new Date().getMonth() + 1;

  const { data, error } = await supabase
    .from("consult_question_presets")
    .select(`
      id,
      question_text,
      crop_key,
      symptom_key,
      intent_key,
      start_month,
      end_month,
      priority,
      is_active
    `)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .filter((row: any) =>
      monthInRange(currentMonth, row.start_month ?? null, row.end_month ?? null)
    )
    .slice(0, 6)
    .map((row: any) => ({
      id: String(row.id),
      question_text: String(row.question_text ?? "").trim(),
      crop_key: row.crop_key ?? null,
      symptom_key: row.symptom_key ?? null,
      intent_key: row.intent_key ?? null,
    }))
    .filter((row) => row.question_text);
}