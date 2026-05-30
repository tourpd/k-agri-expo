import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("live_product_leads")
      .insert({
        prize_id: body.prize_id,
        farmer_name: body.farmer_name,
        farmer_phone: body.farmer_phone,
        region: body.region,
        crop: body.crop,
        farm_size: body.farm_size,
        request_type: body.request_type,
        message: body.message,
      })
      .select()
      .single();

    if (error) throw error;

    // 경품 통계 증가
    await supabase.rpc("increment_lead_count", {
      row_id: body.prize_id,
    });

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "server error",
    });
  }
}