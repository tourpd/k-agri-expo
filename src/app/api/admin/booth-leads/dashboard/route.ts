import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
  };
}

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(req.url);
    const monthOffset = Number(searchParams.get("month_offset") || "0");

    const { start, end, label } = monthRange(monthOffset);

    const supabase = getSupabaseAdmin();

    const { data: leads, error } = await supabase
      .from("booth_leads")
      .select(`
        lead_id,
        booth_id,
        vendor_id,
        crop_name,
        issue_type,
        source_type,
        status,
        final_amount_krw,
        commission_rate,
        commission_amount_krw,
        won_at,
        created_at
      `)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message || "대시보드 조회 실패", 500);
    }

    const items = leads || [];

    const totalLeads = items.length;
    const newCount = items.filter((x) => x.status === "new").length;
    const contactedCount = items.filter((x) => x.status === "contacted").length;
    const quotedCount = items.filter((x) => x.status === "quoted").length;
    const wonItems = items.filter((x) => x.status === "won");
    const lostCount = items.filter((x) => x.status === "lost").length;
    const closedCount = items.filter((x) => x.status === "closed").length;

    const totalWon = wonItems.length;
    const totalSales = wonItems.reduce(
      (sum, x) => sum + Number(x.final_amount_krw || 0),
      0
    );
    const totalCommission = wonItems.reduce(
      (sum, x) => sum + Number(x.commission_amount_krw || 0),
      0
    );

    const sourceMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const cropMap = new Map<string, number>();
    const vendorMap = new Map<
      string,
      {
        vendor_id: string;
        total_leads: number;
        won_count: number;
        total_sales: number;
        total_commission: number;
      }
    >();

    for (const row of items) {
      const source = row.source_type || "unknown";
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

      const status = row.status || "unknown";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      const crop = row.crop_name || "미분류";
      cropMap.set(crop, (cropMap.get(crop) || 0) + 1);

      const vendorId = row.vendor_id || "unknown";
      const current = vendorMap.get(vendorId) || {
        vendor_id: vendorId,
        total_leads: 0,
        won_count: 0,
        total_sales: 0,
        total_commission: 0,
      };

      current.total_leads += 1;
      if (row.status === "won") {
        current.won_count += 1;
        current.total_sales += Number(row.final_amount_krw || 0);
        current.total_commission += Number(row.commission_amount_krw || 0);
      }

      vendorMap.set(vendorId, current);
    }

    const bySource = Array.from(sourceMap.entries())
      .map(([source_type, count]) => ({ source_type, count }))
      .sort((a, b) => b.count - a.count);

    const byStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const byCrop = Array.from(cropMap.entries())
      .map(([crop_name, count]) => ({ crop_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byVendor = Array.from(vendorMap.values())
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 20);

    return Response.json({
      success: true,
      month_label: label,
      range_start: start,
      range_end: end,
      summary: {
        total_leads: totalLeads,
        new_count: newCount,
        contacted_count: contactedCount,
        quoted_count: quotedCount,
        won_count: totalWon,
        lost_count: lostCount,
        closed_count: closedCount,
        total_sales: totalSales,
        total_commission: totalCommission,
      },
      by_source: bySource,
      by_status: byStatus,
      by_crop: byCrop,
      by_vendor: byVendor,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "대시보드 조회 중 오류",
      500
    );
  }
}