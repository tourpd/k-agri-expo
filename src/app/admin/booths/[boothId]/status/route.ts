// src/app/admin/booths/[boothId]/status/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ boothId: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { boothId } = await params;
    const body = await req.json();
    const status = String(body?.status || "").trim();

    if (!boothId) {
      return NextResponse.json(
        { success: false, error: "boothId가 필요합니다." },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: "status가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("booths")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("booth_id", boothId)
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
      booth: data,
      message: "부스 상태가 변경되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "부스 상태 변경 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}