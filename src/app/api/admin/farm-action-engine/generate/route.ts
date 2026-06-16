import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const crop = String(body.crop || "").trim();
  const month = String(body.month || "").trim();

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("knowledge_rules")
    .select("id,crop,month,growth_stage,symptom,cause,countermeasure,action_instruction,confidence_score,source_reference")
    .eq("crop", crop)
    .or(`month.eq.${month},month.ilike.%${month}%,month.ilike.%전 생육기%,month.ilike.%전생육기%`)
    .not("action_instruction", "is", null)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actions = (data || []).map((r: any, i: number) => ({
    priority: i + 1,
    crop: r.crop,
    month: r.month,
    growth_stage: r.growth_stage,
    symptom: r.symptom,
    cause: r.cause,
    countermeasure: r.countermeasure,
    action_instruction: r.action_instruction,
    risk_level: Number(r.confidence_score || 0) >= 0.9 ? "높음" : "중간",
    source_reference: r.source_reference || "-",
  }));

  return NextResponse.json({ ok: true, count: actions.length, actions });
}
