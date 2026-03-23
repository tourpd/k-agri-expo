// src/app/api/admin/slots/generate/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  hallId: string;
  rows: number; // 예: 2 (A,B)
  cols: number; // 예: 6 (1..6)
  // 옵션: 기본 좌표/크기(그리드 렌더링용)
  cellW?: number; // 기본 1
  cellH?: number; // 기본 1
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const hallId = String(body?.hallId ?? "").trim();
    const rows = Number(body?.rows ?? 0);
    const cols = Number(body?.cols ?? 0);

    if (!hallId || !Number.isFinite(rows) || !Number.isFinite(cols) || rows <= 0 || cols <= 0) {
      return NextResponse.json({ error: "hallId, rows, cols are required" }, { status: 400 });
    }

    const cellW = Number(body?.cellW ?? 1);
    const cellH = Number(body?.cellH ?? 1);

    const supabase = await createSupabaseServerClient();

    // ✅ 로그인 체크
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const userId = userRes?.user?.id ?? null;
    if (userErr || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ 운영자 체크
    const { data: adminRow, error: adminErr } = await supabase
      .from("expo_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminErr || !adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // ✅ DB RPC로 원자적 생성(중복 생성 방지)
    const { data, error } = await supabase.rpc("admin_generate_slots", {
      p_hall_id: hallId,
      p_rows: rows,
      p_cols: cols,
      p_cell_w: cellW,
      p_cell_h: cellH,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

/**
 * =========================================================
 * ✅ (필수) Supabase SQL Editor에 아래 SQL 실행
 * =========================================================
 *
 * -- (권장) 슬롯 중복 생성 방지: (hall_id, slot_id) PK 이미 있으므로 OK
 *
 * create or replace function public.admin_generate_slots(
 *   p_hall_id text,
 *   p_rows int,
 *   p_cols int,
 *   p_cell_w int,
 *   p_cell_h int
 * )
 * returns json
 * language plpgsql
 * security definer
 * set search_path = public
 * as $$
 * declare
 *   r int;
 *   c int;
 *   row_letter text;
 *   slot text;
 *   inserted int := 0;
 * begin
 *   if p_rows <= 0 or p_cols <= 0 then
 *     raise exception 'rows/cols must be > 0';
 *   end if;
 *
 *   -- A=65
 *   for r in 1..p_rows loop
 *     row_letter := chr(64 + r);
 *     for c in 1..p_cols loop
 *       slot := row_letter || c::text;
 *
 *       -- 이미 있으면 스킵
 *       insert into public.hall_booth_slots(hall_id, slot_id, x, y, w, h, booth_id, created_at, updated_at)
 *       values (p_hall_id, slot, c, r, coalesce(p_cell_w,1), coalesce(p_cell_h,1), null, now(), now())
 *       on conflict (hall_id, slot_id) do nothing;
 *
 *       if found then inserted := inserted + 1; end if;
 *     end loop;
 *   end loop;
 *
 *   return json_build_object(
 *     'hall_id', p_hall_id,
 *     'rows', p_rows,
 *     'cols', p_cols,
 *     'inserted', inserted
 *   );
 * end;
 * $$;
 *
 * grant execute on function public.admin_generate_slots(text,int,int,int,int) to authenticated;
 */