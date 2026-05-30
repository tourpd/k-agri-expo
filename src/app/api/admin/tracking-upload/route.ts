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

function safe(v: unknown) {
  return String(v || "").trim();
}

export async function POST(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const rows: Array<{
      order_id?: string;
      order_code?: string;
      tracking_company?: string;
      tracking_number?: string;
    }> = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "업로드할 송장 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const now = new Date().toISOString();

    for (const row of rows) {
      const orderId = safe(row.order_id || row.order_code);
      const trackingCompany = safe(row.tracking_company) || "택배사 미입력";
      const trackingNumber = safe(row.tracking_number);

      if (!orderId || !trackingNumber) {
        results.push({
          order_id: orderId || "-",
          success: false,
          error: "주문ID 또는 송장번호 누락",
        });
        continue;
      }

      const { data, error } = await supabase
        .from("expo_brand_orders")
        .update({
          tracking_company: trackingCompany,
          tracking_number: trackingNumber,
          payment_status: "입금완료",
          order_status: "출고완료",
          shipped_at: now,
          tracking_uploaded_at: now,
          updated_at: now,
        })
        .eq("id", orderId)
        .select(
          `
          id,
          farmer_name,
          phone,
          tracking_company,
          tracking_number,
          order_status,
          payment_status
        `
        )
        .maybeSingle();

      if (error || !data) {
        results.push({
          order_id: orderId,
          success: false,
          error: error?.message || "주문ID 매칭 실패",
        });
      } else {
        results.push({
          order_id: orderId,
          success: true,
          order: data,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      success_count: results.filter((r) => r.success).length,
      fail_count: results.filter((r) => !r.success).length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "송장 업로드 실패" },
      { status: 500 }
    );
  }
}