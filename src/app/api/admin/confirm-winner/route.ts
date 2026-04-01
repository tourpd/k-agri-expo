import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { winner_id } = body as { winner_id?: number };

    if (winner_id == null) {
      return NextResponse.json(
        { success: false, error: "winner_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("event_winners")
      .update({ confirmed: true })
      .eq("id", winner_id)
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
      winner: data,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "당첨 확정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}