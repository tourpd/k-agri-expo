import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const body = await req.json();

  const { data: user } = await supabase.auth.getUser();

  await supabase.from("deal_leads").insert({
    source_type: "buyer_demand",
    message: body.note,
    category: body.category,
    crop: body.crop,
    quantity: body.quantity,
    lead_stage: "new",
  });

  return NextResponse.json({ success: true });
}