// src/app/api/event-status/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawId = searchParams.get("event_id");
    const eventId = rawId ? Number(rawId) : 1;

    if (!eventId || isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: "event_id가 잘못되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("events")
      .select("id, title, status")
      .eq("id", eventId)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "이벤트 없음" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data[0],
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "서버 에러 발생" },
      { status: 500 }
    );
  }
}