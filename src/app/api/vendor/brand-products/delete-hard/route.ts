import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "제품 ID가 없습니다.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 주문 연결 여부 확인
    const { count: orderCount } = await supabase
      .from("expo_brand_orders")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);

    if ((orderCount || 0) > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "주문 이력이 있는 제품입니다. 삭제 대신 숨김 처리만 가능합니다.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("expo_brand_products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "제품이 완전히 삭제되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "제품 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}