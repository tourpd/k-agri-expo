import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "이벤트 id가 없습니다." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("expo_brand_events")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}