import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const page = toInt(searchParams.get("page"), 1);
    const pageSize = Math.min(toInt(searchParams.get("pageSize"), 50), 100);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("vendor_applications_v2")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      ok: true,
      success: true,
      items: data || [],
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        error: e?.message || "입점 신청 목록 조회 실패",
      },
      { status: 500 }
    );
  }
}