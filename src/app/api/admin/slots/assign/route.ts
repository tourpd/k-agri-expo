import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { hall_id, slot_id, booth_id } = await req.json();

    if (!hall_id || !slot_id) {
      return NextResponse.json({ ok: false, error: "invalid payload" });
    }

    const supabase = await createSupabaseServerClient();

    // 로그인 체크
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "not logged in" });
    }

    // 관리자 체크
    const { data: admin } = await supabase
      .from("expo_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!admin) {
      return NextResponse.json({ ok: false, error: "not admin" });
    }

    // RPC 실행
    const { data, error } = await supabase.rpc("assign_booth_slot", {
      p_hall_id: hall_id,
      p_slot_id: slot_id,
      p_booth_id: booth_id,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}