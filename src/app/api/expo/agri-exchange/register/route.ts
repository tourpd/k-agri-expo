import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function n(v: unknown) {
  const num = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const qty = n(body.total_quantity);
    const price = n(body.expected_price);
    const estimatedValue = String(body.unit || "톤") === "톤" ? qty * 1000 * price : qty * price;

    const { error } = await supabase.from("agri_assets").insert({
      asset_name: String(body.asset_name || `${body.producer_region || ""} ${body.product_name || ""} ${body.total_quantity || ""}${body.unit || ""}`).trim(),
      product_name: String(body.product_name || ""),
      variety_name: String(body.variety_name || ""),
      producer_name: String(body.producer_name || ""),
      producer_region: String(body.producer_region || ""),
      size_spec: String(body.size_spec || ""),
      total_quantity: qty,
      unit: String(body.unit || "톤"),
      expected_price: price,
      estimated_value: estimatedValue,
      storage_location: String(body.storage_location || ""),
      memo: String(body.memo || "농민 직접 등록"),
      recommended_channel: "pending_review",
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "등록 실패" }, { status: 500 });
  }
}
