// src/app/api/admin/product-orders/tracking-upload/route.ts
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

function normalizeDate(v: unknown) {
  const s = safe(v);
  if (!s) return new Date().toISOString();

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  return new Date().toISOString();
}

function normalizePhone(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function normalizeTrackingCompany(v: unknown) {
  const s = safe(v);
  const lower = s.toLowerCase();

  if (!s) return "CJ대한통운";
  if (lower.includes("cj") || s.includes("대한통운")) return "CJ대한통운";
  if (s.includes("롯데")) return "롯데택배";
  if (s.includes("한진")) return "한진택배";
  if (s.includes("우체국")) return "우체국택배";
  if (s.includes("로젠")) return "로젠택배";
  if (s.includes("경동")) return "경동택배";
  if (s.includes("대신")) return "대신택배";
  if (s.includes("천일")) return "천일택배";
  if (s.includes("합동")) return "합동택배";
  if (s.includes("건영")) return "건영택배";
  if (s.includes("쿠팡")) return "쿠팡로지스틱스";
  if (s.includes("직접")) return "직접배송";
  if (s.includes("화물")) return s;

  return s;
}

function isValidTrackingNumber(v: unknown) {
  const s = safe(v);
  if (!s) return false;
  return /^[0-9A-Za-z\-]{5,40}$/.test(s);
}

function buildTrackingUrl(company: string, trackingNumber: string) {
  const number = encodeURIComponent(trackingNumber);
  if (!number) return "";

  if (company.includes("CJ") || company.includes("대한통운")) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${number}`;
  }

  if (company.includes("롯데")) {
    return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${number}`;
  }

  if (company.includes("한진")) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wbl_num=${number}`;
  }

  if (company.includes("우체국")) {
    return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${number}`;
  }

  if (company.includes("로젠")) {
    return `https://www.ilogen.com/web/personal/trace/${number}`;
  }

  return "";
}

function buildShippingMessage(order: any) {
  const name = safe(order.farmer_name) || "농민";
  const product = safe(order.product_name) || "주문 상품";
  const company = safe(order.tracking_company) || safe(order.delivery_company) || "택배사";
  const number = safe(order.tracking_number);
  const trackingUrl = buildTrackingUrl(company, number);

  return `[K-Agri Expo]

${name}님 주문 상품이 발송되었습니다.

상품명: ${product}

택배사: ${company}
송장번호: ${number}

배송조회:
${trackingUrl || "택배사 홈페이지 또는 업체 안내를 통해 조회해주세요."}

감사합니다.`;
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
      const trackingCompany = normalizeTrackingCompany(row.tracking_company);
      const trackingNumber = safe(row.tracking_number);
      const shippedAt = normalizeDate(row.shipped_at);
      const memo = safe(row.memo);

      if (!orderId || !trackingNumber) {
        results.push({
          order_id: orderId || "-",
          success: false,
          error: "주문ID 또는 송장번호 누락",
          sms_logged: false,
        });
        continue;
      }

      if (!isValidTrackingNumber(trackingNumber)) {
        results.push({
          order_id: orderId,
          success: false,
          error: `송장번호 형식 오류: ${trackingNumber}`,
          sms_logged: false,
        });
        continue;
      }

      const { data: existing, error: readError } = await supabase
        .from("expo_brand_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (readError || !existing) {
        results.push({
          order_id: orderId,
          success: false,
          error: readError?.message || "주문ID 매칭 실패",
          sms_logged: false,
        });
        continue;
      }

      if (existing.order_status === "배송완료") {
        results.push({
          order_id: orderId,
          success: false,
          error: "이미 배송완료된 주문입니다.",
          sms_logged: false,
        });
        continue;
      }

      if (existing.tracking_number && existing.tracking_number !== trackingNumber) {
        results.push({
          order_id: orderId,
          success: false,
          error: `이미 다른 송장번호가 등록되어 있습니다: ${existing.tracking_number}`,
          sms_logged: false,
        });
        continue;
      }

      const nextMemo = memo
        ? `${existing.memo || ""}\n[관리자 송장업로드 ${now}]\n${memo}`.trim()
        : existing.memo || null;

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

      const trackingUrl = buildTrackingUrl(trackingCompany, trackingNumber);

      const { data: updated, error: updateError } = await supabase
        .from("expo_brand_orders")
        .update({
          tracking_company: trackingCompany,
          delivery_company: trackingCompany,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl || null,
          shipped_at: shippedAt,
          tracking_uploaded_at: now,
          payment_status: "입금완료",
          order_status: "배송중",
          memo: nextMemo,
          updated_at: now,
        })
        .eq("id", orderId)
        .select("*")
        .maybeSingle();

      if (updateError || !updated) {
        results.push({
          order_id: orderId,
          success: false,
          error: updateError?.message || "송장 등록 실패",
          sms_logged: false,
        });
        continue;
      }

      await supabase.from("expo_order_logs").insert({
        order_id: updated.id,
        order_status: "배송중",
        action_type: "tracking_uploaded",
        actor_type: "admin",
        actor_id: "admin",
        actor_name: "관리자",
        previous_value: {
          tracking_company: existing.tracking_company || existing.delivery_company || null,
          tracking_number: existing.tracking_number || null,
          shipped_at: existing.shipped_at || null,
          payment_status: existing.payment_status || null,
          order_status: existing.order_status || null,
        },
        next_value: {
          tracking_company: trackingCompany,
          delivery_company: trackingCompany,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl || null,
          shipped_at: shippedAt,
          payment_status: "입금완료",
          order_status: "배송중",
        },
        memo: `관리자 송장 등록: ${trackingCompany} / ${trackingNumber}`,
      });

      let smsLogged = false;
      let smsError: string | null = null;

      const phone = normalizePhone(updated.phone);

      if (!phone) {
        smsError = "수신자 연락처 없음";
      } else if (existing.shipping_sms_sent_at) {
        smsError = "이미 배송 문자 로그가 생성된 주문입니다.";
      } else {
        const message = buildShippingMessage({
          ...updated,
          product_name: productName,
        });

        const { error: smsLogError } = await supabase
          .from("expo_sms_logs")
          .insert({
            order_id: updated.id,
            phone,
            receiver_name: updated.farmer_name || null,
            message,
            sms_type: "shipping_started",
            send_status: "대기",
            provider_response: null,
            error_message: null,
            created_at: now,
          });

        if (smsLogError) {
          smsError = smsLogError.message;
        } else {
          smsLogged = true;

          await supabase
            .from("expo_brand_orders")
            .update({
              shipping_sms_sent_at: now,
              updated_at: now,
            })
            .eq("id", updated.id);
        }
      }

      results.push({
        order_id: orderId,
        success: true,
        order: updated,
        tracking_url: trackingUrl || null,
        sms_logged: smsLogged,
        sms_error: smsError,
      });
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      success_count: results.filter((r) => r.success).length,
      fail_count: results.filter((r) => !r.success).length,
      sms_log_count: results.filter((r) => r.sms_logged).length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "송장 업로드 실패",
      },
      { status: 500 }
    );
  }
}