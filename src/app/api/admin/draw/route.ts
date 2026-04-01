import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, prize_rank } = body;

    if (!event_id || !prize_rank) {
      return NextResponse.json(
        { success: false, error: "event_id와 prize_rank가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: winners, error: winnersError } = await supabase
      .from("event_winners")
      .select("entry_id")
      .eq("event_id", event_id);

    if (winnersError) {
      return NextResponse.json(
        { success: false, error: winnersError.message },
        { status: 500 }
      );
    }

    const excludedIds = (winners ?? []).map((w) => w.entry_id).filter(Boolean);

    let query = supabase
      .from("event_entries")
      .select("*")
      .eq("event_id", event_id);

    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`);
    }

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      return NextResponse.json(
        { success: false, error: entriesError.message },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { success: false, error: "추첨 가능한 응모자가 없습니다." },
        { status: 400 }
      );
    }

    const randomIndex = Math.floor(Math.random() * entries.length);
    const picked = entries[randomIndex];

    const { data: inserted, error: insertError } = await supabase
      .from("event_winners")
      .insert({
        event_id,
        entry_id: picked.id,
        entry_code: picked.entry_code,
        name: picked.name,
        phone: picked.phone,
        prize_rank,
        confirmed: false,
        drawn_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      winner: inserted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "추첨 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}