import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: offer, error: offerError } = await supabase
      .from("agri_trade_offers")
      .select("*")
      .eq("id", id)
      .single();

    if (offerError) throw offerError;
    if (!offer) throw new Error("거래제안을 찾을 수 없습니다.");

    const grossAmount = n(offer.offer_amount);
    const feeRate = 0.03;
    const sellerFee = Math.round(grossAmount * feeRate);
    const buyerFee = 0;
    const platformRevenue = sellerFee + buyerFee;
    const vatAmount = Math.round(platformRevenue * 0.1);
    const sellerSettlement = grossAmount - sellerFee;

    const { error: updateError } = await supabase
      .from("agri_trade_offers")
      .update({
        status: "contracted",
        replied_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { error: settlementError } = await supabase
      .from("agri_settlements")
      .insert({
        trade_offer_id: id,
        product_name: offer.product_name,
        seller_name: offer.seller_name,
        seller_type: "individual_farmer",
        buyer_company_name: offer.buyer_company_name,
        gross_amount: grossAmount,
        product_tax_type: "exempt",
        platform_fee_payer: "seller",
        platform_fee_rate: feeRate,
        seller_fee_amount: sellerFee,
        buyer_fee_amount: buyerFee,
        platform_revenue: platformRevenue,
        vat_amount: vatAmount,
        seller_settlement_amount: sellerSettlement,
        settlement_status: "waiting",
        memo: "거래제안 계약체결 후 자동 생성",
      });

    if (settlementError) throw settlementError;

    return NextResponse.json({
      ok: true,
      message: "계약체결 및 정산 생성 완료",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "계약체결 실패",
      },
      { status: 500 }
    );
  }
}
