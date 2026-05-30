import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendorUser } from "@/lib/vendor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function getVendorUserId(vendorUser: any) {
  return (
    vendorUser?.user?.id ||
    vendorUser?.id ||
    vendorUser?.userId ||
    vendorUser?.user_id ||
    ""
  );
}

function normalizeDate(v: unknown) {
  const s = safe(v);
  if (!s) return new Date().toISOString();

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  return new Date().toISOString();
}

export async function POST(req: Request) {
  try {
    const vendorUser = await requireVendorUser();
    const userId = getVendorUserId(vendorUser);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "업체 로그인 정보가 없습니다." },
        { status: 401 }
      );
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_id, company_name, user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: vendorError?.message || "업체 정보를 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    const { data: brands, error: brandError } = await supabase
      .from("expo_brands")
      .select("id, brand_name, vendor_id")
      .eq("vendor_id", vendor.vendor_id);

    if (brandError) {
      return NextResponse.json(
        { success: false, error: brandError.message },
        { status: 500 }
      );
    }

    const allowedBrandIds = new Set((brands || []).map((b: any) => b.id));

    if (allowedBrandIds.size === 0) {
      return NextResponse.json(
        { success: false, error: "이 업체에 연결된 브랜드가 없습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rows: any[] = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "업로드할 송장 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const now = new Date().toISOString();

    for (const row of rows) {
      const orderId = safe(row.order_id);
      const trackingCompany = safe(row.tracking_company) || "CJ대한통운";
      const trackingNumber = safe(row.tracking_number);
      const shippedAt = normalizeDate(row.shipped_at);
      const memo = safe(row.memo);

      if (!orderId || !trackingNumber) {
        results.push({
          order_id: orderId || "-",
          success: false,
          error: "주문ID 또는 송장번호 누락",
        });
        continue;
      }

      const { data: existing, error: readError } = await supabase
        .from("expo_brand_orders")
        .select("id, brand_id, order_status, tracking_number, memo")
        .eq("id", orderId)
        .maybeSingle();

      if (readError || !existing) {
        results.push({
          order_id: orderId,
          success: false,
          error: readError?.message || "주문ID 매칭 실패",
        });
        continue;
      }

      if (!allowedBrandIds.has(existing.brand_id)) {
        results.push({
          order_id: orderId,
          success: false,
          error: "이 업체 주문이 아닙니다.",
        });
        continue;
      }

      if (existing.order_status === "배송완료") {
        results.push({
          order_id: orderId,
          success: false,
          error: "이미 배송완료된 주문입니다.",
        });
        continue;
      }

      if (existing.tracking_number && existing.tracking_number !== trackingNumber) {
        results.push({
          order_id: orderId,
          success: false,
          error: `이미 다른 송장번호가 등록되어 있습니다: ${existing.tracking_number}`,
        });
        continue;
      }

      const nextMemo = memo
        ? `${existing.memo || ""}\n[업체 송장업로드 ${now}] ${memo}`.trim()
        : existing.memo || null;

      const { data, error } = await supabase
        .from("expo_brand_orders")
        .update({
          tracking_company: trackingCompany,
          tracking_number: trackingNumber,
          shipped_at: shippedAt,
          tracking_uploaded_at: now,
          payment_status: "입금완료",
          order_status: "배송중",
          memo: nextMemo,
          updated_at: now,
        })
        .eq("id", orderId)
        .select("id, tracking_company, tracking_number, order_status")
        .maybeSingle();

      if (error || !data) {
        results.push({
          order_id: orderId,
          success: false,
          error: error?.message || "송장 등록 실패",
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
      { success: false, error: e?.message || "업체 송장 업로드 실패" },
      { status: 500 }
    );
  }
}