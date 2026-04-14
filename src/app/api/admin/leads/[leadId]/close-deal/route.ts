import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calcCommission, getDefaultCommissionRate } from "@/lib/crm/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { leadId } = await context.params;
    const body = await req.json();

    if (!leadId) {
      return jsonError("leadId가 필요합니다.");
    }

    const dealAmount = num(body.deal_amount_krw);
    const commissionMode = n(body.commission_mode) || "matched";
    const contractMemo = n(body.contract_memo);
    const contractStatus = n(body.contract_status) || "contracted";

    if (dealAmount <= 0) {
      return jsonError("계약금액이 필요합니다.");
    }

    const defaultRate = getDefaultCommissionRate(
      commissionMode as
        | "booth_only"
        | "matched"
        | "negotiated"
        | "export_broker"
    );

    const customRate =
      body.commission_rate != null ? Number(body.commission_rate) : defaultRate;

    const { commissionAmount, netRevenue } = calcCommission(
      dealAmount,
      customRate
    );

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("deal_leads")
      .update({
        lead_stage: "won",
        contract_status: contractStatus,
        deal_amount_krw: dealAmount,
        commission_rate: customRate,
        commission_amount_krw: commissionAmount,
        net_revenue_krw: netRevenue,
        contract_memo: contractMemo || null,
        contracted_at: nowIso,
        closed_at: nowIso,
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "성사 처리에 실패했습니다.", 500);
    }

    return NextResponse.json({
      ok: true,
      item: data,
      summary: {
        deal_amount_krw: dealAmount,
        commission_rate: customRate,
        commission_amount_krw: commissionAmount,
        net_revenue_krw: netRevenue,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      500
    );
  }
}