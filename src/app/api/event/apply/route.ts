import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeEntryCode } from "@/lib/entryCode";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { event_id, name, phone } = body;

    if (!event_id || !name || !phone) {
      return NextResponse.json(
        { success: false, error: "event_id, name, phone이 필요합니다." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, "");
    const entryCode = makeEntryCode(Number(event_id));

    const { data, error } = await supabase
      .from("event_entries")
      .insert({
        event_id,
        name: String(name).trim(),
        phone: cleanPhone,
        entry_code: entryCode,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry_code: data.entry_code,
      created_at: data.created_at,
      message:
        "이벤트 참여가 완료되었습니다. 참가번호를 꼭 저장해 주세요.",
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}