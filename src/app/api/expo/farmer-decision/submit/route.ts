import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function score(input: any) {
  let s = 50;

  if (input.inventory_status === "많다") s -= 10;
  if (input.inventory_status === "적다") s += 10;

  if (input.sell_plan === "즉시 판매") s -= 15;
  if (input.sell_plan === "저장") s += 15;
  if (input.sell_plan === "결정 못함") s -= 5;

  if (input.price_outlook === "상승") s += 20;
  if (input.price_outlook === "하락") s -= 20;

  return Math.max(0, Math.min(100, s));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const row = {
      crop: String(body.crop || "").trim(),
      region: String(body.region || "").trim(),
      inventory_status: body.inventory_status || null,
      sell_plan: body.sell_plan || null,
      price_outlook: body.price_outlook || null,
      note: body.note || null,
      sentiment_score: score(body),
    };

    if (!row.crop) {
      return NextResponse.json({ ok: false, error: "작목을 입력하세요." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("farmer_decision_responses").insert(row);

    if (error) {
      return NextResponse.json({ ok: false, saved: false, error: error.message, result: row });
    }

    return NextResponse.json({ ok: true, saved: true, result: row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "submit error" }, { status: 500 });
  }
}
