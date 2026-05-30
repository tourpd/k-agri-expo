import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = createSupabaseAdminClient();

    const { error } = await admin.from("expo_product_recommend_logs").insert({
      diagnosis_id: body?.diagnosis_id || "",
      crop: body?.crop || "",
      province: body?.province || "",
      city: body?.city || "",
      issue_text: body?.issue_text || "",
      recommended_product_ids: body?.recommended_product_ids || [],
      clicked_product_id: body?.clicked_product_id || null,
      source: body?.source || "photodoctor",
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "log failed" },
      { status: 500 }
    );
  }
}