import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExpoProblemContent } from "@/types/expo-home";

export async function listProblemContents() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("expo_problem_contents")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`expo_problem_contents 조회 실패: ${error.message}`);
  }

  return (data ?? []) as ExpoProblemContent[];
}

export async function createProblemContent(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: nullableString(formData.get("subtitle")),
    description: nullableString(formData.get("description")),
    link_url: String(formData.get("link_url") ?? "/problems").trim() || "/problems",
    audience_type: String(formData.get("audience_type") ?? "farmer").trim() || "farmer",
    season_key: nullableString(formData.get("season_key")),
    month_key: nullableNumber(formData.get("month_key")),
    crop_key: nullableString(formData.get("crop_key")),
    issue_key: nullableString(formData.get("issue_key")),
    priority: Number(formData.get("priority") ?? 100),
    is_active: formData.get("is_active") === "on",
    start_at: nullableString(formData.get("start_at")),
    end_at: nullableString(formData.get("end_at")),
  };

  if (!payload.title) {
    throw new Error("제목은 필수입니다.");
  }

  const { error } = await supabase.from("expo_problem_contents").insert(payload);

  if (error) {
    throw new Error(`expo_problem_contents 등록 실패: ${error.message}`);
  }
}

export async function toggleProblemContentActive(id: string, nextValue: boolean) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("expo_problem_contents")
    .update({ is_active: nextValue, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`expo_problem_contents 상태 변경 실패: ${error.message}`);
  }
}

function nullableString(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}