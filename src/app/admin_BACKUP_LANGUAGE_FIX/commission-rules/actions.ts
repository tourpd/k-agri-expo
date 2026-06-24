"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeRate(v: unknown) {
  const n = Number(v || 0);

  if (!Number.isFinite(n) || n <= 0) return 0;

  if (n > 0 && n <= 1) return n;
  if (n > 1 && n <= 100) return n / 100;

  return 0;
}

function clean(v: FormDataEntryValue | null) {
  return String(v || "").trim();
}

export async function createCommissionRule(formData: FormData) {
  const supabase = createSupabaseAdminClient();

  const scopeType = clean(formData.get("scope_type"));
  const orderType = clean(formData.get("order_type")) || null;

  const title = clean(formData.get("title"));
  const memo = clean(formData.get("memo"));

  const orderId = clean(formData.get("order_id")) || null;
  const productId = clean(formData.get("product_id")) || null;
  const vendorId = clean(formData.get("vendor_id")) || null;
  const brandId = clean(formData.get("brand_id")) || null;

  const priority = Number(formData.get("priority") || 100);

  const startsAt = clean(formData.get("starts_at")) || null;
  const endsAt = clean(formData.get("ends_at")) || null;

  const isActive =
    clean(formData.get("is_active")) === "true";

  const commissionRate = normalizeRate(
    formData.get("commission_rate")
  );

  if (!scopeType) {
    throw new Error("scope_type 필요");
  }

  if (!commissionRate) {
    throw new Error("commission_rate 필요");
  }

  const { error } = await supabase
    .from("commission_rules")
    .insert({
      scope_type: scopeType,
      order_type: orderType,

      order_id: orderId,
      product_id: productId,
      vendor_id: vendorId,
      brand_id: brandId,

      commission_rate: commissionRate,

      title,
      memo,

      priority,

      starts_at: startsAt,
      ends_at: endsAt,

      is_active: isActive,
    });

  if (error) {
    console.error(error);
    throw new Error("수수료 규칙 저장 실패");
  }

  revalidatePath("/admin/commission-rules");

  redirect("/admin/commission-rules");
}