import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await ctx.params;
  if (!dealId) return new NextResponse("dealId가 없습니다.", { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return new NextResponse("로그인 필요", { status: 401 });

  const body = await req.json().catch(() => ({}));

  const payload = {
    title: body.title ?? null,
    description: body.description ?? null,
    image_url: body.image_url ?? null,
    normal_price: body.normal_price ?? null,
    expo_price: body.expo_price ?? null,
    stock: body.stock ?? 0,
    end_at: body.end_at ?? null,
    is_active: !!body.is_active,
  };

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("booth_deals").update(payload).eq("deal_id", dealId);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}