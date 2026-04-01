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
  const asset_id = String(body?.asset_id || "").trim();
  if (!asset_id) return NextResponse.json({ ok: false, error: "MISSING_ASSET_ID" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  // storage_path 읽어서 파일도 삭제
  const { data: row, error: selErr } = await admin
    .from("deal_assets")
    .select("id,storage_path")
    .eq("id", asset_id)
    .maybeSingle();

  if (selErr) return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });

  if (row?.storage_path) {
    await admin.storage.from("expo-assets").remove([row.storage_path]).catch(() => {});
  }

  const { error: delErr } = await admin.from("deal_assets").delete().eq("id", asset_id);
  if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}