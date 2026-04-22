import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await ctx.params;
  if (!dealId) return new NextResponse("dealId가 없습니다.", { status: 400 });

  // ✅ 로그인 체크(업체)
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return new NextResponse("로그인 필요", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "").trim();
  const title = body.title ? String(body.title).trim() : null;
  const url = String(body.url || "").trim();
  const storage_path = body.storage_path ? String(body.storage_path).trim() : null;

  if (!kind) return new NextResponse("kind가 없습니다.", { status: 400 });
  if (!url) return new NextResponse("url이 없습니다.", { status: 400 });

  // ✅ v1: 권한은 단순(로그인만) — 추후 booth 소유권으로 제한
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("deal_assets")
    .insert({
      deal_id: dealId,
      kind,
      title,
      url,
      storage_path,
      sort_order: 100,
      is_active: true,
    })
    .select("id,kind,title,storage_path,url,sort_order,is_active,created_at")
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true, asset: data });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await ctx.params;
  if (!dealId) return new NextResponse("dealId가 없습니다.", { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return new NextResponse("로그인 필요", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const is_active = !!body.is_active;

  if (!id) return new NextResponse("id가 없습니다.", { status: 400 });

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("deal_assets")
    .update({ is_active })
    .eq("deal_id", dealId)
    .eq("id", id);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}