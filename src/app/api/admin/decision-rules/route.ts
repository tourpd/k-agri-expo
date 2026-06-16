import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "knowledge_decision_rules";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  if (!body?.id) {
    return NextResponse.json({ error: "id가 없습니다." }, { status: 400 });
  }

  const updateData = {
    crop_name: body.crop_name ?? null,
    disease_name: body.disease_name ?? null,
    growth_stage: body.growth_stage ?? null,
    rule_title: body.rule_title ?? null,
    trigger_condition: body.trigger_condition ?? null,
    action_instruction: body.action_instruction ?? null,
    confidence: Number(body.confidence || 70),
    status: body.status ?? "review_needed",
  };

  const { error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
