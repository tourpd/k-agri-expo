import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();

    const body = await req.json();

    const ids = Array.isArray(body.ids)
      ? body.ids.map(clean).filter(Boolean)
      : [];

    const action = clean(body.action);

    if (ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "선택된 주문이 없습니다.",
        },
        { status: 400 }
      );
    }

    let payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "payment_done") {
      payload.payment_status = "입금완료";
      payload.order_status = "입금완료";
    }

    else if (action === "ready_to_ship") {
      payload.order_status = "출고준비";
    }

    else if (action === "shipped") {
      payload.order_status = "출고완료";
    }

    else if (action === "done") {
      payload.order_status = "배송완료";
    }

    else if (action === "cancel") {
      payload.payment_status = "취소";
      payload.order_status = "취소";
    }

    else {
      return NextResponse.json(
        {
          success: false,
          error: "지원하지 않는 작업입니다.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("expo_brand_orders")
      .update(payload)
      .in("id", ids)
      .select("*");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      orders: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}