import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.rpc("submit_deal_lead", {
      p_deal_id: body.deal_id,
      p_name: body.name,
      p_phone: body.phone,
      p_region: body.region,
      p_tractor_hp: body.tractor_hp,
      p_source: body.source,
      p_membership_used: body.membership_used,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}