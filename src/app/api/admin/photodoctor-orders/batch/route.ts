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

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }

  return await isAdminAuthenticated();
}

export async function PATCH(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const action = String(body.action || "");

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "처리할 주문이 없습니다." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    let payload: Record<string, any> = {
      updated_at: now,
    };

    if (action === "paid") {
      payload = {
        ...payload,
        payment_status: "paid",
        order_status: "paid",
      };
    } else if (action === "exported") {
      payload = {
        ...payload,
        dof_export_status: "exported",
        dof_exported_at: now,
        order_status: "exported",
      };
    } else if (action === "done") {
      payload = {
        ...payload,
        order_status: "done",
      };
    } else if (action === "waiting") {
      payload = {
        ...payload,
        payment_status: "waiting_deposit",
        order_status: "waiting_deposit",
      };
    } else {
      return NextResponse.json(
        { success: false, error: "알 수 없는 처리 방식입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .update(payload)
      .in("id", ids)
      .select("id, order_code, payment_status, order_status, dof_export_status");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
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
      { success: false, error: e?.message || "일괄 처리 실패" },
      { status: 500 }
    );
  }
}