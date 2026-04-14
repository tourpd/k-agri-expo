import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

type RangeKey = "this_month" | "last_month" | "this_year" | "all";

function getRangeDates(range: RangeKey, now: Date) {
  if (range === "this_month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  if (range === "last_month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }

  if (range === "this_year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    };
  }

  return {
    start: null,
    end: null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const rawRange = searchParams.get("range");
    const range: RangeKey =
      rawRange === "last_month" ||
      rawRange === "this_year" ||
      rawRange === "all"
        ? rawRange
        : "this_month";

    const now = new Date();
    const { start, end } = getRangeDates(range, now);

    let query = supabase
      .from("deal_leads")
      .select(`
        company_name,
        contact_name,
        deal_amount_krw,
        commission_amount_krw,
        net_revenue_krw,
        contract_status,
        contracted_at,
        paid_at
      `)
      .eq("lead_stage", "won")
      .order("contracted_at", { ascending: false });

    if (start) {
      query = query.gte("contracted_at", start.toISOString());
    }

    if (end) {
      query = query.lt("contracted_at", end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

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

    const lines = [
      header.map(csvEscape).join(","),
      ...rows.map((row: any) =>
        [
          row.company_name || "",
          row.contact_name || "",
          row.deal_amount_krw || 0,
          row.commission_amount_krw || 0,
          row.net_revenue_krw || 0,
          row.contract_status || "",
          formatDate(row.contracted_at),
          formatDate(row.paid_at),
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="revenue-${range}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "CSV 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}