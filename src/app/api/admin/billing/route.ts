import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function clean(v: string | null) {
  return (v ?? "").trim();
}

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const url = new URL(req.url);
    const status = clean(url.searchParams.get("status"));
    const q = clean(url.searchParams.get("q"));

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("vendor_billing_events")
      .select(`
        billing_event_id,
        vendor_id,
        lead_id,
        event_type,
        amount_krw,
        status,
        description,
        meta,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: billingRows, error: billingError } = await query;

    if (billingError) {
      return jsonError(billingError.message, 500);
    }

    const vendorIds = Array.from(
      new Set((billingRows || []).map((x: any) => x.vendor_id).filter(Boolean))
    );

    let vendorsMap = new Map<string, any>();

    if (vendorIds.length > 0) {
      let vendorsQuery = supabase
        .from("vendors")
        .select(`
          vendor_id,
          company_name,
          email,
          plan_type,
          contact_name,
          category_primary
        `)
        .in("vendor_id", vendorIds);

      if (q) {
        vendorsQuery = vendorsQuery.or(
          [
            `company_name.ilike.%${q}%`,
            `email.ilike.%${q}%`,
            `contact_name.ilike.%${q}%`,
            `category_primary.ilike.%${q}%`,
          ].join(",")
        );
      }

      const { data: vendors, error: vendorsError } = await vendorsQuery;

      if (vendorsError) {
        return jsonError(vendorsError.message, 500);
      }

      vendorsMap = new Map((vendors || []).map((v: any) => [v.vendor_id, v]));
    }

    const filteredRows = (billingRows || []).filter((row: any) => {
      if (!q) return true;
      return vendorsMap.has(row.vendor_id);
    });

    const groupedMap = new Map<string, any>();

    for (const row of filteredRows) {
      const vendorId = row.vendor_id;
      const vendor = vendorsMap.get(vendorId) || null;

      if (!groupedMap.has(vendorId)) {
        groupedMap.set(vendorId, {
          vendor_id: vendorId,
          company_name: vendor?.company_name || "업체명 없음",
          email: vendor?.email || "",
          contact_name: vendor?.contact_name || "",
          plan_type: vendor?.plan_type || "basic",
          category_primary: vendor?.category_primary || "",
          total_count: 0,
          pending_count: 0,
          paid_count: 0,
          pending_amount_krw: 0,
          paid_amount_krw: 0,
          total_amount_krw: 0,
          items: [],
        });
      }

      const acc = groupedMap.get(vendorId);

      acc.total_count += 1;
      acc.total_amount_krw += Number(row.amount_krw || 0);

      if (row.status === "paid") {
        acc.paid_count += 1;
        acc.paid_amount_krw += Number(row.amount_krw || 0);
      } else {
        acc.pending_count += 1;
        acc.pending_amount_krw += Number(row.amount_krw || 0);
      }

      acc.items.push(row);
    }

    const vendors = Array.from(groupedMap.values()).sort(
      (a, b) => b.pending_amount_krw - a.pending_amount_krw
    );

    const summary = {
      vendor_count: vendors.length,
      billing_count: filteredRows.length,
      pending_amount_krw: vendors.reduce(
        (sum, v) => sum + Number(v.pending_amount_krw || 0),
        0
      ),
      paid_amount_krw: vendors.reduce(
        (sum, v) => sum + Number(v.paid_amount_krw || 0),
        0
      ),
      total_amount_krw: vendors.reduce(
        (sum, v) => sum + Number(v.total_amount_krw || 0),
        0
      ),
    };

    return Response.json({
      success: true,
      summary,
      vendors,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "청구 집계 조회 중 오류",
      500
    );
  }
}