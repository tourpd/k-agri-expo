import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin(req: Request) {
  const url = new URL(req.url);

  if (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  ) {
    return true;
  }

  return await isAdminAuthenticated();
}

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function pickProduct(order: any) {
  return (
    order?.product_name ||
    order?.product ||
    order?.product_title ||
    order?.item_name ||
    order?.title ||
    null
  );
}

export async function GET(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: "관리자 인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const orderId = safe(
      searchParams.get("order_id")
    );

    const actionType = safe(
      searchParams.get("action_type")
    );

    const actorType = safe(
      searchParams.get("actor_type")
    );

    const limit = Number(
      searchParams.get("limit") || 200
    );

    let query = supabase
      .from("expo_order_logs")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(
        Number.isFinite(limit)
          ? Math.min(Math.max(limit, 1), 500)
          : 200
      );

    if (orderId) {
      query = query.eq("order_id", orderId);
    }

    if (
      actionType &&
      actionType !== "all"
    ) {
      query = query.eq(
        "action_type",
        actionType
      );
    }

    if (
      actorType &&
      actorType !== "all"
    ) {
      query = query.eq(
        "actor_type",
        actorType
      );
    }

    const {
      data: logs,
      error,
    } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const orderIds = Array.from(
      new Set(
        (logs || [])
          .map((log: any) =>
            safe(log.order_id)
          )
          .filter(Boolean)
      )
    );

    let orderMap = new Map<
      string,
      any
    >();

    if (orderIds.length > 0) {
      const {
        data: orders,
        error: orderError,
      } = await supabase
        .from("expo_brand_orders")
        .select("*")
        .in("id", orderIds);

      if (orderError) {
        return NextResponse.json(
          {
            success: false,
            error: orderError.message,
          },
          { status: 500 }
        );
      }

      orderMap = new Map(
        (orders || []).map(
          (order: any) => [
            order.id,
            order,
          ]
        )
      );
    }

    const enrichedLogs = (
      logs || []
    ).map((log: any) => {
      const order =
        orderMap.get(log.order_id) || {};

      return {
        ...log,

        farmer_name:
          order.farmer_name ||
          order.name ||
          null,

        phone:
          order.phone ||
          order.mobile ||
          order.tel ||
          null,

        product_name:
          pickProduct(order),

        tracking_company:
          order.tracking_company ||
          log?.next_value
            ?.tracking_company ||
          log?.previous_value
            ?.tracking_company ||
          null,

        tracking_number:
          order.tracking_number ||
          log?.next_value
            ?.tracking_number ||
          log?.previous_value
            ?.tracking_number ||
          null,

        current_order_status:
          order.order_status ||
          null,

        current_payment_status:
          order.payment_status ||
          null,
      };
    });

    return NextResponse.json({
      success: true,
      logs: enrichedLogs,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message ||
          "주문 로그 조회 실패",
      },
      { status: 500 }
    );
  }
}