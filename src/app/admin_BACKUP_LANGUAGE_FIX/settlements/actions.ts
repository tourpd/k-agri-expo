"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanText(v: FormDataEntryValue | null, fallback = "") {
  const s = String(v || "").trim();
  return s || fallback;
}

function validMonth(v: string) {
  return /^\d{4}-\d{2}$/.test(v);
}

function monthStartIso(month: string) {
  return `${month}-01T00:00:00+09:00`;
}

function nextMonthStartIso(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-01T00:00:00+09:00`;
}

function num(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function brandNameOf(row: any, fallback = "") {
  return (
    row.brand_name ||
    row.vendor_name ||
    row.company_name ||
    row.brand_title ||
    fallback
  );
}

export async function payVendorSettlement(formData: FormData) {
  const brandName = cleanText(formData.get("brand_name"));
  const month = cleanText(formData.get("month"));
  const memo = cleanText(formData.get("memo"));
  const paidBy = cleanText(formData.get("paid_by"), "admin");

  if (!brandName) throw new Error("업체명이 없습니다.");
  if (!validMonth(month)) throw new Error("정산월 형식이 잘못되었습니다.");

  const admin = createSupabaseAdminClient();
  const start = monthStartIso(month);
  const end = nextMonthStartIso(month);
  const paidAt = new Date().toISOString();

  const [expoRes, photoRes] = await Promise.all([
    admin
      .from("expo_orders")
      .select("id, vendor_settlement_amount, settlement_status, brand_name, vendor_name, company_name, brand_title, created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .neq("settlement_status", "paid"),
    admin
      .from("photodoctor_orders")
      .select("id, vendor_settlement_amount, settlement_status, brand_name, vendor_name, company_name, brand_title, created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .neq("settlement_status", "paid"),
  ]);

  if (expoRes.error) throw new Error(`expo_orders 조회 실패: ${expoRes.error.message}`);
  if (photoRes.error) throw new Error(`photodoctor_orders 조회 실패: ${photoRes.error.message}`);

  const expoOrders = (expoRes.data || []).filter(
    (row: any) => brandNameOf(row, "-") === brandName
  );

  const photoOrders = (photoRes.data || []).filter(
    (row: any) => brandNameOf(row, "포토닥터") === brandName
  );

  const expoIds = expoOrders.map((o: any) => o.id);
  const photoIds = photoOrders.map((o: any) => o.id);

  const expoAmount = expoOrders.reduce(
    (acc: number, o: any) => acc + num(o.vendor_settlement_amount),
    0
  );

  const photoAmount = photoOrders.reduce(
    (acc: number, o: any) => acc + num(o.vendor_settlement_amount),
    0
  );

  if (expoIds.length === 0 && photoIds.length === 0) {
    throw new Error("정산대기 주문이 없습니다.");
  }

  if (expoIds.length > 0) {
    const { error } = await admin
      .from("expo_orders")
      .update({
        settlement_status: "paid",
        settled_at: paidAt,
        updated_at: paidAt,
      })
      .in("id", expoIds);

    if (error) throw new Error(`expo_orders 정산 실패: ${error.message}`);

    await admin.from("settlement_logs").insert({
      brand_name: brandName,
      month,
      source_table: "expo_orders",
      order_ids: expoIds,
      order_count: expoIds.length,
      settlement_amount: expoAmount,
      memo,
      paid_by: paidBy,
      paid_at: paidAt,
    });
  }

  if (photoIds.length > 0) {
    const { error } = await admin
      .from("photodoctor_orders")
      .update({
        settlement_status: "paid",
        settled_at: paidAt,
        updated_at: paidAt,
      })
      .in("id", photoIds);

    if (error) throw new Error(`photodoctor_orders 정산 실패: ${error.message}`);

    await admin.from("settlement_logs").insert({
      brand_name: brandName,
      month,
      source_table: "photodoctor_orders",
      order_ids: photoIds,
      order_count: photoIds.length,
      settlement_amount: photoAmount,
      memo,
      paid_by: paidBy,
      paid_at: paidAt,
    });
  }

  revalidatePath("/admin/settlements");
  revalidatePath(`/admin/settlements/${encodeURIComponent(brandName)}`);
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/revenue/orders");
  revalidatePath("/admin/revenue/vendors");

  redirect(`/admin/settlements/${encodeURIComponent(brandName)}?month=${month}`);
}