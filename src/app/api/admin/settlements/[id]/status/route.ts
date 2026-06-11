import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status;

    const allowed = ["waiting", "confirmed", "paid", "hold"];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "허용되지 않은 정산 상태입니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("agri_settlements")
      .update({
        settlement_status: status,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "정산 상태 변경 실패",
      },
      { status: 500 }
    );
  }
}
