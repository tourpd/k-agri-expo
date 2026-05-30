import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const q = safe(searchParams.get("q"));
    const saleStatus = safe(searchParams.get("sale_status"));
    const vendorTarget = safe(searchParams.get("vendor_target"));

    let query = supabase
      .from("booth_leads")
      .select("*")
      .in("source_type", ["photodoctor", "photodoctor_product"])
      .order("created_at", { ascending: false })
      .limit(500);

    if (saleStatus) query = query.eq("sale_status", saleStatus);
    if (vendorTarget) query = query.eq("vendor_target", vendorTarget);

    if (q) {
      const pattern = `%${q.replace(/\s+/g, "%")}%`;
      query = query.or(
        [
          `farmer_name.ilike.${pattern}`,
          `farmer_phone.ilike.${pattern}`,
          `product_name.ilike.${pattern}`,
          `crop_name.ilike.${pattern}`,
          `issue_type.ilike.${pattern}`,
          `message.ilike.${pattern}`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data || [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "조회 실패" },
      { status: 500 }
    );
  }
}