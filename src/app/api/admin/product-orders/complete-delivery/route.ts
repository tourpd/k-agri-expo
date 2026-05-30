// src/app/api/admin/product-orders/complete-delivery/route.ts
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
  return String(v ?? "").trim();
}

function normalizePhone(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function buildDeliveryCompletedMessage(order: any) {
  const name = safe(order.farmer_name) || "농민";
  const product = safe(order.product_name) || "주문 상품";

  return `[K-Agri Expo]

${name}님 주문 상품의 배송이 완료 처리되었습니다.

상품명: ${product}

이용해 주셔서 감사합니다.`;
}

export async function POST(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증 필요" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const orderIds: string[] = Array.isArray(body.order_ids)
      ? body.order_ids.map((v: unknown) => safe(v)).filter(Boolean)
      : [];

    if (orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "주문ID 없음" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const results: any[] = [];

    for (const orderId of orderIds) {
      const { data: existing, error: readError } = await supabase
        .from("expo_brand_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (readError || !existing) {
        results.push({
          order_id: orderId,
          success: false,
          error: readError?.message || "주문 없음",
          sms_logged: false,
        });
        continue;
      }

      if (existing.order_status === "배송완료") {
        results.push({
          order_id: orderId,
          success: false,
          error: "이미 배송완료",
          sms_logged: false,
        });
        continue;
      }

      if (!safe(existing.tracking_number)) {
        results.push({
          order_id: orderId,
          success: false,
          error: "송장번호 없는 주문은 배송완료 처리할 수 없습니다.",
          sms_logged: false,
        });
        continue;
      }

      let productName = "주문 상품";

      if (existing.product_id) {
        const { data: product } = await supabase
          .from("expo_brand_products")
          .select("*")
          .eq("id", existing.product_id)
          .maybeSingle();

        productName =
          safe(product?.product_name) ||
          safe(product?.name) ||
          safe(product?.title) ||
          "주문 상품";
      }

      const { data: updated, error: updateError } = await supabase
        .from("expo_brand_orders")
        .update({
          order_status: "배송완료",
          delivered_at: now,
          updated_at: now,
        })
        .eq("id", orderId)
        .select("*")
        .maybeSingle();

      if (updateError || !updated) {
        results.push({
          order_id: orderId,
          success: false,
          error: updateError?.message || "배송완료 업데이트 실패",
          sms_logged: false,
        });
        continue;
      }

      await supabase.from("expo_order_logs").insert({
        order_id: orderId,
        order_status: "배송완료",
        action_type: "delivery_completed",
        actor_type: "admin",
        actor_id: "admin",
        actor_name: "관리자",
        previous_value: {
          order_status: existing.order_status,
          payment_status: existing.payment_status,
          tracking_company:
            existing.tracking_company || existing.delivery_company || null,
          tracking_number: existing.tracking_number,
          delivered_at: existing.delivered_at || null,
        },
        next_value: {
          order_status: "배송완료",
          delivered_at: now,
        },
        memo: "배송완료 처리",
      });

      let smsLogged = false;
      let smsError: string | null = null;

      const phone = normalizePhone(existing.phone);

      if (!phone) {
        smsError = "수신자 연락처 없음";
      } else {
        const { error: smsLogError } = await supabase
          .from("expo_sms_logs")
          .insert({
            order_id: orderId,
            phone,
            receiver_name: existing.farmer_name || null,
            message: buildDeliveryCompletedMessage({
              ...existing,
              product_name: productName,
            }),
            sms_type: "delivery_completed",
            send_status: "대기",
            provider_response: null,
            error_message: null,
            created_at: now,
          });

        if (smsLogError) {
          smsError = smsLogError.message;
        } else {
          smsLogged = true;
        }
      }

      results.push({
        order_id: orderId,
        success: true,
        order: updated,
        sms_logged: smsLogged,
        sms_error: smsError,
      });
    }

    return NextResponse.json({
      success: true,
      total: orderIds.length,
      success_count: results.filter((r) => r.success).length,
      fail_count: results.filter((r) => !r.success).length,
      sms_log_count: results.filter((r) => r.sms_logged).length,
      results,
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