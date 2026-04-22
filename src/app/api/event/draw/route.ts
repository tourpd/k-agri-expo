import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("event_entries")
      .select("*")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "응모 데이터가 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "추첨 데이터 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}