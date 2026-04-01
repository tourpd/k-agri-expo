import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function padNumber(num: number) {
  return String(num).padStart(5, "0");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      event_id,
      name,
      phone,
      region,
      crop,
    }: {
      event_id?: number;
      name?: string;
      phone?: string;
      region?: string;
      crop?: string;
    } = body;

    if (!event_id || !name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "event_id, 이름, 전화번호는 필수입니다.",
        },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // 이미 응모했는지 확인
    const { data: existing } = await supabase
      .from("event_entries")
      .select("entry_code")
      .eq("event_id", event_id)
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        entry_code: existing.entry_code,
        message: "이미 응모된 전화번호입니다.",
      });
    }

    // 현재 응모자 수 조회
    const { count, error: countError } = await supabase
      .from("event_entries")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event_id);

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    const nextNumber = (count || 0) + 1;

    if (nextNumber > 99999) {
      return NextResponse.json(
        {
          success: false,
          error: "응모 인원이 최대치를 초과했습니다.",
        },
        { status: 400 }
      );
    }

    const entryCode = padNumber(nextNumber);

    const { data, error } = await supabase
      .from("event_entries")
      .insert({
        event_id,
        name: name.trim(),
        phone: cleanPhone,
        entry_code: entryCode,
        region: region?.trim() || null,
        crop: crop?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry_code: data.entry_code,
      message: "이벤트 참여 완료",
      entry: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "응모 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}