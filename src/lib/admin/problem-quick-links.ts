import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExpoProblemQuickLink } from "@/types/expo-home";

export async function listProblemQuickLinks() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("expo_problem_quick_links")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`expo_problem_quick_links 조회 실패: ${error.message}`);
  }

  return (data ?? []) as ExpoProblemQuickLink[];
}

export async function createProblemQuickLink(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const payload = {
    label: String(formData.get("label") ?? "").trim(),
    link_url: String(formData.get("link_url") ?? "/expo/consult").trim() || "/expo/consult",
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

  if (!payload.label) {
    throw new Error("버튼명은 필수입니다.");
  }

  const { error } = await supabase.from("expo_problem_quick_links").insert(payload);

  if (error) {
    throw new Error(`expo_problem_quick_links 등록 실패: ${error.message}`);
  }
}

export async function toggleProblemQuickLinkActive(id: string, nextValue: boolean) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("expo_problem_quick_links")
    .update({ is_active: nextValue, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`expo_problem_quick_links 상태 변경 실패: ${error.message}`);
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