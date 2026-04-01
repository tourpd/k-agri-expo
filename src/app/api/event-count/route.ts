import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = Number(searchParams.get("event_id") || "1");

    const { count, error } = await supabase
      .from("event_entries")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "응모자 수 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}