import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabase = getSupabaseAdmin();
    const { leadId } = await context.params;
    const body = await req.json();

    const vendorId = n(body.vendor_id);
    const boothId = n(body.booth_id);
    const matchId = n(body.match_id);

    if (!vendorId) {
      return NextResponse.json(
        { ok: false, error: "vendor_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, company_name")
      .eq("id", vendorId)
      .single();

    let boothName: string | null = null;

    if (boothId) {
      const { data: booth } = await supabase
        .from("booths")
        .select("id, name, title, company_name")
        .eq("id", boothId)
        .single();

      boothName =
        booth?.name || booth?.title || booth?.company_name || null;
    }

    const nowIso = new Date().toISOString();

    const { data: lead, error } = await supabase
      .from("deal_leads")
      .update({
        vendor_id: vendorId,
        booth_id: boothId || null,
        assigned_vendor_name: vendor?.company_name || null,
        assigned_booth_name: boothName,
        lead_stage: "qualified",
        negotiation_status: "vendor_assigned",
        updated_at: nowIso,
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { ok: false, error: error?.message || "업체 배정 실패" },
        { status: 500 }
      );
    }

    if (matchId) {
      await supabase
        .from("buyer_matches")
        .update({
          match_status: "selected",
        })
        .eq("id", matchId);

      await supabase
        .from("buyer_matches")
        .update({
          match_status: "suggested",
        })
        .eq("lead_id", leadId)
        .neq("id", matchId)
        .eq("match_status", "selected");
    }

    await supabase.from("lead_activity_logs").insert({
      lead_id: leadId,
      activity_type: "assign_vendor",
      counterparty_type: "vendor",
      counterparty_name: vendor?.company_name || null,
      summary: "추천 업체를 실제 협상 업체로 배정",
      detail: boothName ? `배정부스: ${boothName}` : null,
      created_by: "admin",
      created_at: nowIso,
    });

    return NextResponse.json({
      ok: true,
      item: lead,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "업체 배정 실패",
      },
      { status: 500 }
    );
  }
}