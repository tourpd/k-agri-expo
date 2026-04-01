import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!items) return NextResponse.json({ ok: false, error: "MISSING_ITEMS" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  // 여러 update를 간단히 순회 (v1)
  for (const it of items) {
    const id = String(it?.id || "").trim();
    const sort_order = Number(it?.sort_order);
    if (!id || !Number.isFinite(sort_order)) continue;
    await admin.from("deal_assets").update({ sort_order }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}