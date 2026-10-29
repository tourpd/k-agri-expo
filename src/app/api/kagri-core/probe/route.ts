import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLES = [
  "expo_behavior_logs",
  "booth_visits",
  "expo_booth_visits",
  "expo_product_views",
  "expo_consult_leads",
  "expo_leads",
  "expo_lead_logs",
  "expo_conversions",
  "lead_activity_logs",
  "booth_lead_events",
  "content_links",
  "customer_activity_logs",
  "farmer_activity_logs",
  "buyer_demands",
  "buyer_matches",
  "export_quotes",
  "expo_orders",
  "expo_brand_orders",
  "photodoctor_consults",
  "photodoctor_orders",
] as const;

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const results = [];

  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", {
        count: "exact",
        head: true,
      });

    results.push({
      table,
      exists: !error,
      count: error ? null : count ?? 0,
      error: error?.message ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "READ_ONLY",
    purpose: "K-AGRI 365 live data discovery",
    results,
  });
}
