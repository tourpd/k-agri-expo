import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("farmer_activity_logs")
      .select("*")
      .eq("farmer_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      items: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "농민 행동로그 조회 실패",
      },
      { status: 500 }
    );
  }
}
