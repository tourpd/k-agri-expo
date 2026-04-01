import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ applicationId: string }>;
};

export async function POST(_req: Request, ctx: Params) {
  try {
    const { applicationId } = await ctx.params;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "applicationId가 필요합니다." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("vendor_applications_v2")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("application_id", applicationId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || "승인 처리 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "승인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}