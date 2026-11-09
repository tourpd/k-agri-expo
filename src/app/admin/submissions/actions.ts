"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidateSubmissionCache } from "@/lib/submissions/products";

export async function decideSubmission(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const memo = String(formData.get("memo") ?? "").slice(0, 300);
  if (!id || !["approved", "rejected", "pending"].includes(decision)) return;
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  await supabase
    .from("expo_product_submissions")
    .update({
      status: decision,
      admin_memo: memo || null,
      approved_at: decision === "approved" ? now : null,
      rejected_at: decision === "rejected" ? now : null,
      updated_at: now,
    })
    .eq("id", id);
  invalidateSubmissionCache();
  revalidatePath("/admin/submissions");
}
