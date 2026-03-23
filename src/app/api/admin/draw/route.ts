import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  event_id?: number;
  prize_rank?: number;
};

function isPositiveInt(v: unknown) {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}

function pickRandom<T>(arr: T[]) {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const event_id = body.event_id;
    const prize_rank = body.prize_rank;

    if (!isPositiveInt(event_id)) {
      return NextResponse.json(
        { success: false, error: "event_id가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!isPositiveInt(prize_rank)) {
      return NextResponse.json(
        { success: false, error: "prize_rank가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 1) 이벤트 상태 확인
    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("id, title, status")
      .eq("id", event_id)
      .maybeSingle();

    if (eventError) {
      return NextResponse.json(
        { success: false, error: eventError.message },
        { status: 500 }
      );
    }

    if (!eventRow) {
      return NextResponse.json(
        { success: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (eventRow.status === "open") {
      return NextResponse.json(
        { success: false, error: "응모 마감 후 추첨할 수 있습니다." },
        { status: 400 }
      );
    }

    // 2) 이미 이 이벤트에서 뽑힌 entry_id 목록 조회
    // confirmed 여부와 관계없이 winners에 들어간 entry_id는 전부 제외
    const { data: drawnRows, error: drawnError } = await supabase
      .from("winners")
      .select("entry_id, prize_rank, confirmed")
      .eq("event_id", event_id);

    if (drawnError) {
      return NextResponse.json(
        { success: false, error: drawnError.message },
        { status: 500 }
      );
    }

    const excludedEntryIds = new Set<number>(
      (drawnRows ?? [])
        .map((row: any) => Number(row.entry_id))
        .filter((v) => Number.isInteger(v))
    );

    // 3) 참가자 조회
    const { data: entries, error: entryError } = await supabase
      .from("event_entries")
      .select("id, name, phone, entry_code, created_at")
      .order("id", { ascending: true });

    if (entryError) {
      return NextResponse.json(
        { success: false, error: entryError.message },
        { status: 500 }
      );
    }

    const allEntries = entries ?? [];

    // 4) 이미 뽑힌 참가번호 제외
    const candidates = allEntries.filter((entry: any) => {
      const entryId = Number(entry.id);
      if (!Number.isInteger(entryId)) return false;
      if (excludedEntryIds.has(entryId)) return false;
      if (!entry.entry_code) return false;
      return true;
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "추첨 가능한 참가자가 없습니다. (이미 모두 당첨되었거나 참가자가 없습니다.)",
        },
        { status: 400 }
      );
    }

    // 5) 무작위 1명 추첨
    const picked = pickRandom(candidates);

    // 6) 같은 event_id + 같은 prize_rank의 기존 미확정 row는 유지하지 않도록 선택 가능
    // 여기서는 '새 후보'를 계속 쌓지 않고, 같은 등수는 이전 미확정 후보를 지우고 새로 넣는 방식을 권장
    const { error: deletePendingError } = await supabase
      .from("winners")
      .delete()
      .eq("event_id", event_id)
      .eq("prize_rank", prize_rank)
      .eq("confirmed", false);

    if (deletePendingError) {
      return NextResponse.json(
        { success: false, error: deletePendingError.message },
        { status: 500 }
      );
    }

    // 7) 새 당첨 후보 insert
    const { data: inserted, error: insertError } = await supabase
      .from("winners")
      .insert({
        event_id,
        entry_id: picked.id,
        entry_code: picked.entry_code,
        name: picked.name ?? "이름없음",
        phone: picked.phone ?? "",
        prize_rank,
        confirmed: false,
      })
      .select("*")
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
      meta: {
        total_entries: allEntries.length,
        excluded_count: excludedEntryIds.size,
        candidate_count: candidates.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "추첨 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}