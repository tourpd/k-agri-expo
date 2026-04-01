// src/app/api/vendor/deals/[dealId]/assets/delete/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await ctx.params;
  if (!isUuid(dealId)) return new NextResponse("invalid dealId", { status: 400 });

  const body = await req.json().catch(() => ({}));
  const asset_id = String(body.asset_id || "").trim();
  if (!isUuid(asset_id)) return new NextResponse("invalid asset_id", { status: 400 });

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("deal_assets")
    .delete()
    .eq("asset_id", asset_id)
    .eq("deal_id", dealId);

  if (error) return new NextResponse(error.message, { status: 400 });

  const { data: assets } = await supabase
    .from("deal_assets")
    .select("asset_id,deal_id,kind,title,url,requires_login,sort_order,created_at")
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, assets: assets || [] });
}