import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = {
  params: Promise<{ id: string }>;
};

function appendLog(prevNote: string | null, logLine: string) {
  const base = (prevNote || "").trim();
  return base ? `${base}\n${logLine}` : logLine;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!orderId || Number.isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "유효한 주문 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      note,
      append_status_log,
      payment_status,
      order_status,
    }: {
      note?: string;
      append_status_log?: boolean;
      payment_status?: string;
      order_status?: string;
    } = body;

    const { data: existing, error: existingError } = await supabase
      .from("expo_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        {
          success: false,
          error: existingError?.message || "주문을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    let nextNote = typeof note === "string" ? note : existing.note || null;

    if (append_status_log) {
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(now.getDate()).padStart(2, "0")} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const line = `[${stamp}] 상태 저장 - 결제:${payment_status || existing.payment_status || "-"} / 주문:${
        order_status || existing.order_status || "-"
      }`;
      nextNote = appendLog(nextNote, line);
    }

    const { data, error } = await supabase
      .from("expo_orders")
      .update({
        note: nextNote,
        payment_status: payment_status ?? existing.payment_status,
        order_status: order_status ?? existing.order_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
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
      order: data,
      message: "주문 메모/상태가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "주문 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}