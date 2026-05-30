// src/app/api/admin/farmer-call-inbox/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const limit = Math.min(num(url.searchParams.get("limit")) || 300, 1000);
    const q = safe(url.searchParams.get("q"));
    const filter = safe(url.searchParams.get("filter"));

    let query = supabase
      .from("farmer_call_inbox")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(
        [
          `phone.ilike.%${q}%`,
          `farmer_name.ilike.%${q}%`,
          `summary.ilike.%${q}%`,
          `crop.ilike.%${q}%`,
          `recommended_product.ilike.%${q}%`,
          `next_action.ilike.%${q}%`,
        ].join(",")
      );
    }

    if (filter === "hot") {
      query = query.gte("buy_probability", 60);
    }

    if (filter === "urgent") {
      query = query.or("call_priority.eq.긴급,buy_probability.gte.80");
    }

    if (filter === "repurchase") {
      query = query.or("stage.ilike.%재구매%,lead_type.ilike.%재구매%");
    }

    if (filter === "quote") {
      query = query.or("stage.ilike.%견적%,lead_type.ilike.%견적%");
    }

    if (filter === "new") {
      query = query.eq("matched", false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          rows: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rows: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "AI 상담수신함 목록 조회 실패",
        rows: [],
      },
      { status: 500 }
    );
  }
}