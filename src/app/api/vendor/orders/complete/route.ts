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

    const body = await req.json();
    const orderId = safe(body.order_id);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "주문ID가 없습니다." },
        { status: 400 }
      );
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_id, company_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (vendorError || !vendor?.vendor_id) {
      return NextResponse.json(
        { success: false, error: "업체 정보를 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    const vendorId = vendor.vendor_id;
    const vendorName = safe(vendor.company_name) || "업체";

    const { data: brands, error: brandError } = await supabase
      .from("expo_brands")
      .select("id")
      .eq("vendor_id", vendorId);

    if (brandError) {
      return NextResponse.json(
        { success: false, error: brandError.message },
        { status: 500 }
      );
    }

    const brandIds = (brands || []).map((b: any) => b.id);

    if (brandIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "연결된 브랜드가 없습니다." },
        { status: 403 }
      );
    }

    const { data: existing, error: readError } = await supabase
      .from("expo_brand_orders")
      .select(
        `
        id,
        brand_id,
        order_status,
        payment_status,
        tracking_company,
        tracking_number,
        delivered_at
        `
      )
      .eq("id", orderId)
      .in("brand_id", brandIds)
      .maybeSingle();

    if (readError || !existing) {
      return NextResponse.json(
        { success: false, error: "자기 브랜드 주문만 처리 가능합니다." },
        { status: 403 }
      );
    }

    if (!safe(existing.tracking_number)) {
      return NextResponse.json(
        { success: false, error: "송장번호 없는 주문은 배송완료 처리할 수 없습니다." },
        { status: 400 }
      );
    }

    if (existing.order_status === "배송완료") {
      return NextResponse.json(
        { success: false, error: "이미 배송완료된 주문입니다." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("expo_brand_orders")
      .update({
        order_status: "배송완료",
        delivered_at: now,
        updated_at: now,
      })
      .eq("id", orderId)
      .select(
        `
        id,
        order_status,
        payment_status,
        tracking_company,
        tracking_number,
        delivered_at
        `
      )
      .maybeSingle();

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: updateError?.message || "배송완료 처리 실패" },
        { status: 500 }
      );
    }

    await supabase.from("expo_order_logs").insert({
      order_id: updated.id,
      order_status: "배송완료",
      action_type: "delivery_completed",
      actor_type: "vendor",
      actor_id: userId,
      actor_name: vendorName,
      previous_value: {
        order_status: existing.order_status || null,
        payment_status: existing.payment_status || null,
        tracking_company: existing.tracking_company || null,
        tracking_number: existing.tracking_number || null,
        delivered_at: existing.delivered_at || null,
      },
      next_value: {
        order_status: "배송완료",
        payment_status: updated.payment_status || existing.payment_status || null,
        tracking_company: updated.tracking_company || existing.tracking_company || null,
        tracking_number: updated.tracking_number || existing.tracking_number || null,
        delivered_at: now,
      },
      memo: `업체 배송완료 처리 (${existing.tracking_company || "택배사"} / ${
        existing.tracking_number
      })`,
    });

    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "배송완료 처리 실패",
      },
      { status: 500 }
    );
  }
}