// src/app/api/vendor/deals/[dealId]/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await ctx.params;
  if (!isUuid(dealId)) {
    return new NextResponse("invalid dealId", { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = await createSupabaseServerClient();

  const patch: any = {};
  if ("title" in body) patch.title = body.title ?? null;
  if ("description" in body) patch.description = body.description ?? null;
  if ("normal_price" in body) patch.normal_price = body.normal_price ?? null;
  if ("expo_price" in body) patch.expo_price = body.expo_price ?? null;
  if ("stock" in body) patch.stock = body.stock ?? null;
  if ("end_at" in body) patch.end_at = body.end_at || null;
  if ("is_active" in body) patch.is_active = !!body.is_active;

  const { data, error } = await supabase
    .from("booth_deals")
    .update(patch)
    .eq("deal_id", dealId)
    .select(
      "deal_id,booth_id,title,description,image_url,normal_price,expo_price,discount_percent,stock,start_at,end_at,is_active,consulting_count,created_at"
    )
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 400 });

  return NextResponse.json({ ok: true, deal: data });
}