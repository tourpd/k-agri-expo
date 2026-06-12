import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("agri_buyers")
      .update({
        buyer_grade: String(body.buyer_grade || "C"),
        verified_by: String(body.verified_by || ""),
        verification_date: new Date().toISOString(),
        payment_score: Number(body.payment_score || 0),
        farmer_rating: Number(body.farmer_rating || 0),
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "바이어 검증 실패",
      },
      { status: 500 }
    );
  }
}
