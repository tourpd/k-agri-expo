import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  hall_id: string;
  slot_id: string;
  booth_id: string | null; // null이면 해제
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  // 1) 로그인 체크
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  // 2) 운영자 체크 (SQL 함수)
  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_expo_admin");
  if (adminErr) return NextResponse.json({ ok: false, error: adminErr.message }, { status: 500 });
  if (!isAdmin) return NextResponse.json({ ok: false, error: "not_admin" }, { status: 403 });

  const body = (await req.json()) as Body;
  const { hall_id, slot_id, booth_id } = body;

  if (!hall_id || !slot_id) {
    return NextResponse.json({ ok: false, error: "missing_hall_or_slot" }, { status: 400 });
  }

  // 3) booth_id가 있으면 "이동" 처리:
  //   - 같은 hall에서 해당 booth_id가 이미 배정된 슬롯이 있으면 먼저 null로 해제
  if (booth_id) {
    const { error: clearErr } = await supabase
      .from("hall_booth_slots")
      .update({ booth_id: null })
      .eq("hall_id", hall_id)
      .eq("booth_id", booth_id);

    if (clearErr) {
      return NextResponse.json({ ok: false, error: clearErr.message }, { status: 500 });
    }
  }

  // 4) 목표 슬롯에 배정/해제
  const { data: updated, error: updErr } = await supabase
    .from("hall_booth_slots")
    .update({ booth_id: booth_id })
    .eq("hall_id", hall_id)
    .eq("slot_id", slot_id)
    .select("hall_id,slot_id,booth_id")
    .single();

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, row: updated });
}