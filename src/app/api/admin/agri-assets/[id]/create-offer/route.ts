import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function n(v: unknown) {
  const num = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    const supabase = createSupabaseAdminClient();

    const { data: asset, error: assetError } = await supabase
      .from("agri_assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError) throw assetError;
    if (!asset) throw new Error("자산 없음");

    const qty = n(body.offer_quantity);
    const price = n(body.offer_price);
    const unit = String(body.unit || asset.unit || "톤");
    const priceUnit = String(body.price_unit || "kg");

    const amount =
      n(body.offer_amount) ||
      (unit === "톤" && priceUnit === "kg" ? qty * 1000 * price : qty * price);

    const payload: any = {
      asset_id: id,
      buyer_id: String(body.buyer_id || "") || null,
      product_name: asset.product_name,
      seller_name: asset.producer_name,
      buyer_company_name: String(body.buyer_company_name || ""),
      buyer_contact_name: String(body.buyer_contact_name || ""),
      buyer_phone: String(body.buyer_phone || ""),
      offer_quantity: qty,
      unit,
      offer_price: price,
      offer_amount: amount,
      title: String(body.title || `${asset.asset_name || asset.product_name} 거래제안`),
      message: String(body.message || ""),
      status: "sent",
      sent_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("agri_trade_offers").insert(payload);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "생성 실패",
      },
      { status: 500 }
    );
  }
}
