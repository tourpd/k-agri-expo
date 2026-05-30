import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function monthStartIso(month: string) {
  return `${month}-01T00:00:00+09:00`;
}

function nextMonthStartIso(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-01T00:00:00+09:00`;
}

function validMonth(v: string) {
  return /^\d{4}-\d{2}$/.test(v);
}

function num(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function jsonError(message: string, status = 400, debug?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
      debug: debug ?? null,
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return jsonError("잘못된 요청입니다.", 400);
    }

    const brandName = cleanText(body.brand_name);
    const month = cleanText(body.month);
    const memo = cleanText(body.memo);
    const paidBy = cleanText(body.paid_by, "admin");

    if (!brandName) {
      return jsonError("업체명이 없습니다.", 400);
    }

    if (!validMonth(month)) {
      return jsonError("정산월 형식이 잘못되었습니다. 예: 2026-05", 400);
    }

    const admin = createSupabaseAdminClient();

    const start = monthStartIso(month);
    const end = nextMonthStartIso(month);

    const [expoRes, photoRes] = await Promise.all([
      admin
        .from("expo_orders")
        .select("id, vendor_settlement_amount, settlement_status, brand_name, vendor_name, company_name, created_at")
        .gte("created_at", start)
        .lt("created_at", end)
        .neq("settlement_status", "paid"),
      admin
        .from("photodoctor_orders")
        .select("id, vendor_settlement_amount, settlement_status, brand_name, vendor_name, company_name, created_at")
        .gte("created_at", start)
        .lt("created_at", end)
        .neq("settlement_status", "paid"),
    ]);

    if (expoRes.error) {
      return jsonError("expo_orders 조회 실패", 500, expoRes.error);
    }

    if (photoRes.error) {
      return jsonError("photodoctor_orders 조회 실패", 500, photoRes.error);
    }

    const expoOrders = (expoRes.data || []).filter((o: any) => {
      const name = o.brand_name || o.vendor_name || o.company_name || "";
      return name === brandName;
    });

    const photoOrders = (photoRes.data || []).filter((o: any) => {
      const name = o.brand_name || o.vendor_name || o.company_name || "포토닥터";
      return name === brandName;
    });

    const paidAt = new Date().toISOString();

    const expoIds = expoOrders.map((o: any) => o.id);
    const photoIds = photoOrders.map((o: any) => o.id);

    const expoAmount = expoOrders.reduce(
      (acc: number, o: any) => acc + num(o.vendor_settlement_amount),
      0
    );

    const photoAmount = photoOrders.reduce(
      (acc: number, o: any) => acc + num(o.vendor_settlement_amount),
      0
    );

    if (expoIds.length === 0 && photoIds.length === 0) {
      return jsonError("정산대기 주문이 없습니다.", 400);
    }

    if (expoIds.length > 0) {
      const { error } = await admin
        .from("expo_orders")
        .update({
          settlement_status: "paid",
          settled_at: paidAt,
          updated_at: paidAt,
        })
        .in("id", expoIds);

      if (error) {
        return jsonError("expo_orders 정산 처리 실패", 500, error);
      }

      await admin.from("settlement_logs").insert({
        brand_name: brandName,
        month,
        source_table: "expo_orders",
        order_ids: expoIds,
        order_count: expoIds.length,
        settlement_amount: expoAmount,
        memo,
        paid_by: paidBy,
        paid_at: paidAt,
      });
    }

    if (photoIds.length > 0) {
      const { error } = await admin
        .from("photodoctor_orders")
        .update({
          settlement_status: "paid",
          settled_at: paidAt,
          updated_at: paidAt,
        })
        .in("id", photoIds);

      if (error) {
        return jsonError("photodoctor_orders 정산 처리 실패", 500, error);
      }

      await admin.from("settlement_logs").insert({
        brand_name: brandName,
        month,
        source_table: "photodoctor_orders",
        order_ids: photoIds,
        order_count: photoIds.length,
        settlement_amount: photoAmount,
        memo,
        paid_by: paidBy,
        paid_at: paidAt,
      });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      brand_name: brandName,
      month,
      expo_count: expoIds.length,
      photo_count: photoIds.length,
      order_count: expoIds.length + photoIds.length,
      settlement_amount: expoAmount + photoAmount,
    });
  } catch (e) {
    console.error("[settlements pay error]", e);

    return jsonError(
      e instanceof Error ? e.message : "정산 처리 중 오류가 발생했습니다.",
      500
    );
  }
}