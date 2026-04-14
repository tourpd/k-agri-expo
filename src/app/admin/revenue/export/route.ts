import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const range = searchParams.get("range") || "this_month";

    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (range === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (range === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "this_year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
    }

    let query = supabase
      .from("deal_leads")
      .select("*")
      .eq("lead_stage", "won");

    if (start) query = query.gte("contracted_at", start.toISOString());
    if (end) query = query.lt("contracted_at", end.toISOString());

    const { data, error } = await query;

    if (error) throw error;

    const rows = data || [];

    const header = [
      "회사명",
      "담당자",
      "계약금액",
      "수수료",
      "순매출",
      "계약상태",
      "계약일",
      "입금일",
    ];

    const csvRows = rows.map((r: any) => [
      r.company_name || "",
      r.contact_name || "",
      r.deal_amount_krw || 0,
      r.commission_amount_krw || 0,
      r.net_revenue_krw || 0,
      r.contract_status || "",
      formatDate(r.contracted_at),
      formatDate(r.paid_at),
    ]);

    const csv = [header, ...csvRows]
      .map((row) => row.join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}