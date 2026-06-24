import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuleInput = {
  crop?: string;
  month?: string;
  growth_stage?: string;
  symptom?: string;
  cause?: string;
  solution?: string;
  action_instruction?: string;
  confidence?: number | string;
  source_file?: string;
  source_page?: number | string | null;
};

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rules: RuleInput[] = Array.isArray(body?.rules) ? body.rules : [];

    if (rules.length === 0) {
      return NextResponse.json({ ok: false, error: "저장할 규칙이 없습니다.", count: 0 }, { status: 400 });
    }

    const rows = rules.map((r) => ({
      crop: clean(r.crop),
      month: clean(r.month),
      growth_stage: clean(r.growth_stage),
      symptom: clean(r.symptom),
      cause: clean(r.cause),
      countermeasure: clean(r.solution),
      action_instruction: clean(r.action_instruction),
      confidence_score: num(r.confidence),
      source_reference: clean(r.source_file),
      status: "active",
    }));

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("knowledge_rules")
      .insert(rows)
      .select("id");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, count: 0 }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: data?.length ?? rows.length });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "unknown error", count: 0 },
      { status: 500 }
    );
  }
}
