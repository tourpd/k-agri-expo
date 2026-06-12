import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const supabase = createSupabaseAdminClient();

    const { data: asset, error: assetError } = await supabase
      .from("agri_assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError) throw assetError;

    const buyerId = url.searchParams.get("buyer_id") || "";
    const buyerCompanyName = url.searchParams.get("buyer_company_name") || "";

    let buyer = null;

    if (buyerId) {
      const { data } = await supabase
        .from("agri_buyers")
        .select("*")
        .eq("id", buyerId)
        .maybeSingle();

      buyer = data || null;
    }

    if (!buyer && buyerCompanyName) {
      const { data } = await supabase
        .from("agri_buyers")
        .select("*")
        .eq("company_name", buyerCompanyName)
        .maybeSingle();

      buyer = data || null;
    }

    return NextResponse.json({
      ok: true,
      asset,
      buyer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "prefill 실패",
      },
      { status: 500 }
    );
  }
}
