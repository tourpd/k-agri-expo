import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: customers, error: customerError } = await supabase
      .from("farmer_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (customerError) {
      throw customerError;
    }

    const { data: logs, error: logError } = await supabase
      .from("customer_activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (logError) {
      throw logError;
    }

    return NextResponse.json({
      ok: true,
      customers: customers ?? [],
      logs: logs ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "CRM 데이터 조회 실패",
      },
      { status: 500 }
    );
  }
}
