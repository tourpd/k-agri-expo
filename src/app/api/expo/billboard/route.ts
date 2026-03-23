import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BillboardRow = {
  booth_id: string;
  booth_name: string;
  click_count: number;
  inquiry_count: number;
  order_count: number;
  score: number;
};

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: logs, error } = await supabase
      .from("expo_behavior_logs")
      .select("event_type, booth_id")
      .gte("created_at", since.toISOString())
      .not("booth_id", "is", null);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const map = new Map<string, BillboardRow>();

    for (const row of logs ?? []) {
      const boothId = String(row.booth_id || "");
      if (!boothId) continue;

      if (!map.has(boothId)) {
        map.set(boothId, {
          booth_id: boothId,
          booth_name: boothId,
          click_count: 0,
          inquiry_count: 0,
          order_count: 0,
          score: 0,
        });
      }

      const item = map.get(boothId)!;

      if (row.event_type === "booth_click" || row.event_type === "product_click") {
        item.click_count += 1;
        item.score += 1;
      } else if (row.event_type === "inquiry_submit") {
        item.inquiry_count += 1;
        item.score += 3;
      } else if (row.event_type === "order_paid") {
        item.order_count += 1;
        item.score += 5;
      }
    }

    const boothIds = [...map.keys()];

    if (boothIds.length > 0) {
      const { data: booths } = await supabase
        .from("booths")
        .select("booth_id, name")
        .in("booth_id", boothIds);

      for (const b of booths ?? []) {
        const found = map.get(String(b.booth_id));
        if (found) {
          found.booth_name = b.name || String(b.booth_id);
        }
      }
    }

    const topBooths = [...map.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      top_booths: topBooths,
      generated_at: new Date().toISOString(),
      range_days: 7,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "billboard build failed" },
      { status: 500 }
    );
  }
}