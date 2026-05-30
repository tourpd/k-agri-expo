import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const phone = onlyDigits(safe(body.phone));
    const code = safe(body.code);

    if (phone.length < 10) {
      return NextResponse.json({ ok: false, error: "전화번호를 정확히 입력해주세요." }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ ok: false, error: "암호를 입력해주세요." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: live } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!live) {
      return NextResponse.json({ ok: false, error: "진행 중인 라이브가 없습니다." }, { status: 500 });
    }

    const { data: farmer } = await supabase
      .from("live_farmers")
      .select("*")
      .eq("phone", phone)
      .single();

    if (!farmer) {
      return NextResponse.json({ ok: false, error: "먼저 라이브 참여 등록을 해주세요." }, { status: 404 });
    }

    const isCorrect = code === live.secret_code;

    const { data, error } = await supabase
      .from("live_participants")
      .update({
        entered_code: code,
        has_entered_code: isCorrect,
        is_eligible: isCorrect,
      })
      .eq("live_id", live.id)
      .eq("farmer_id", farmer.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      correct: isCorrect,
      participant: data,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "암호 확인 실패" },
      { status: 500 }
    );
  }
}