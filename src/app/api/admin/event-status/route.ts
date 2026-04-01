import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, status } = body as {
      event_id?: number;
      status?: "open" | "closed" | "done";
    };

    if (event_id == null || !status) {
      return NextResponse.json(
        { success: false, error: "event_id와 status가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("events")
      .update({ status })
      .eq("id", event_id)
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
      event: data,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "이벤트 상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}