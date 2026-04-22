import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const supabase = createSupabaseAdminClient();
    const { leadId } = await context.params;

    const { data: matches, error } = await supabase
      .from("buyer_matches")
      .select("*")
      .eq("lead_id", leadId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = matches || [];

    const vendorIds = Array.from(
      new Set(rows.map((r: any) => r.vendor_id).filter(Boolean))
    );

    const boothIds = Array.from(
      new Set(rows.map((r: any) => r.booth_id).filter(Boolean))
    );

    let vendorMap = new Map<string, any>();
    let boothMap = new Map<string, any>();

    if (vendorIds.length > 0) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id, company_name, contact_name, contact_phone, contact_email")
        .in("id", vendorIds);

      vendorMap = new Map((vendors || []).map((v: any) => [v.id, v]));
    }

    if (boothIds.length > 0) {
      const { data: booths } = await supabase
        .from("booths")
        .select("id, name, title, company_name")
        .in("id", boothIds);

      boothMap = new Map((booths || []).map((b: any) => [b.id, b]));
    }

    const items = rows.map((row: any) => {
      const vendor = row.vendor_id ? vendorMap.get(row.vendor_id) : null;
      const booth = row.booth_id ? boothMap.get(row.booth_id) : null;

      return {
        ...row,
        vendor_name: vendor?.company_name || null,
        vendor_contact_name: vendor?.contact_name || null,
        vendor_contact_phone: vendor?.contact_phone || null,
        vendor_contact_email: vendor?.contact_email || null,
        booth_name:
          booth?.name || booth?.title || booth?.company_name || null,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "매칭 조회 실패",
      },
      { status: 500 }
    );
  }
}