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

function getUserId(session: any) {
  return session?.user?.id || session?.id || session?.user_id || "";
}

function normalizePhone(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function buildTrackingUrl(company: string, trackingNumber: string) {
  const c = safe(company);
  const n = safe(trackingNumber);

  if (!n) return null;

  if (c.includes("CJ") || c.includes("대한통운")) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${encodeURIComponent(
      n
    )}`;
  }

  if (c.includes("롯데")) {
    return `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${encodeURIComponent(
      n
    )}`;
  }

  if (c.includes("한진")) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038`;
  }

  if (c.includes("우체국")) {
    return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(
      n
    )}`;
  }

  return null;
}

function buildShippingStartedMessage(order: any, trackingCompany: string, trackingNumber: string) {
  const name = safe(order.farmer_name) || "농민";
  const product = safe(order.product_name) || "주문 상품";
  const url = buildTrackingUrl(trackingCompany, trackingNumber);

  return `[K-Agri Expo]

${name}님 주문 상품이 발송되었습니다.

상품명: ${product}
택배사: ${trackingCompany}
송장번호: ${trackingNumber}${url ? `\n배송조회: ${url}` : ""}

감사합니다.`;
}

function buildDeliveryCompletedMessage(order: any) {
  const name = safe(order.farmer_name) || "농민";
  const product = safe(order.product_name) || "주문 상품";

  return `[K-Agri Expo]

${name}님 주문 상품의 배송이 완료 처리되었습니다.

상품명: ${product}

이용해 주셔서 감사합니다.`;
}

async function getVendorByUserId(userId: string) {
  const { data, error } = await supabase
    .from("vendors")
    .select("user_id, company_name, brand_id")
    .eq("user_id", userId)
    .maybeSingle();

  return { vendor: data, vendorError: error };
}

async function insertOrderLog(params: {
  orderId: string;
  orderStatus: string;
  actionType: string;
  actorId: string;
  actorName: string;
  previousValue?: Record<string, unknown>;
  nextValue?: Record<string, unknown>;
  memo: string;
}) {
  const { error } = await supabase.from("expo_order_logs").insert({
    order_id: params.orderId,
    order_status: params.orderStatus,
    action_type: params.actionType,
    actor_type: "vendor",
    actor_id: params.actorId,
    actor_name: params.actorName,
    previous_value: params.previousValue || {},
    next_value: params.nextValue || {},
    memo: params.memo,
  });

  return error;
}

async function insertSmsLog(params: {
  orderId: string;
  phone: string;
  receiverName: string | null;
  message: string;
  smsType: "shipping_started" | "delivery_completed";
  now: string;
}) {
  if (!params.phone) {
    return new Error("수신자 연락처 없음");
  }

  const { error } = await supabase.from("expo_sms_logs").insert({
    order_id: params.orderId,
    phone: params.phone,
    receiver_name: params.receiverName,
    message: params.message,
    sms_type: params.smsType,
    send_status: "대기",
    provider_response: null,
    error_message: null,
    created_at: params.now,
  });

  return error;
}

export async function GET() {
  try {
    const session = await requireVendorUser();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "업체 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { vendor, vendorError } = await getVendorByUserId(userId);

    if (vendorError) {
      return NextResponse.json(
        { success: false, error: vendorError.message },
        { status: 500 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "업체 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!vendor.brand_id) {
      return NextResponse.json({
        success: true,
        vendor,
        orders: [],
      });
    }

    const { data: orders, error } = await supabase
      .from("expo_brand_orders")
      .select("*")
      .eq("brand_id", vendor.brand_id)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
      orders: orders || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "업체 주문 조회 실패" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireVendorUser();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "업체 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const orderId = safe(body.order_id);
    const action = safe(body.action);
    const trackingCompany = safe(body.tracking_company) || "CJ대한통운";
    const trackingNumber = safe(body.tracking_number);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "주문ID가 없습니다." },
        { status: 400 }
      );
    }

    const { vendor, vendorError } = await getVendorByUserId(userId);

    if (vendorError) {
      return NextResponse.json(
        { success: false, error: vendorError.message },
        { status: 500 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "업체 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!vendor.brand_id) {
      return NextResponse.json(
        { success: false, error: "업체에 연결된 브랜드가 없습니다." },
        { status: 400 }
      );
    }

    const { data: order, error: readError } = await supabase
      .from("expo_brand_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (readError || !order) {
      return NextResponse.json(
        { success: false, error: readError?.message || "주문이 없습니다." },
        { status: 404 }
      );
    }

    if (order.brand_id !== vendor.brand_id) {
      return NextResponse.json(
        { success: false, error: "해당 업체 주문이 아닙니다." },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const actorName = vendor.company_name || "업체";
    const phone = normalizePhone(order.phone);

    if (action === "tracking_uploaded") {
      if (!trackingNumber) {
        return NextResponse.json(
          { success: false, error: "송장번호를 입력하세요." },
          { status: 400 }
        );
      }

      const trackingUrl = buildTrackingUrl(trackingCompany, trackingNumber);

      const { error: updateError } = await supabase
        .from("expo_brand_orders")
        .update({
          tracking_company: trackingCompany,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          order_status: "배송중",
          shipped_at: now,
          tracking_uploaded_at: now,
          updated_at: now,
        })
        .eq("id", orderId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      const logError = await insertOrderLog({
        orderId,
        orderStatus: "배송중",
        actionType: "tracking_uploaded",
        actorId: userId,
        actorName,
        previousValue: {
          order_status: order.order_status,
          tracking_company: order.tracking_company,
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
        },
        nextValue: {
          order_status: "배송중",
          tracking_company: trackingCompany,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
        },
        memo: `업체 송장 등록: ${trackingCompany} / ${trackingNumber}`,
      });

      const smsError = await insertSmsLog({
        orderId,
        phone,
        receiverName: order.farmer_name || null,
        message: buildShippingStartedMessage(order, trackingCompany, trackingNumber),
        smsType: "shipping_started",
        now,
      });

      return NextResponse.json({
        success: true,
        log_saved: !logError,
        log_error: logError?.message || null,
        sms_logged: !smsError,
        sms_error: smsError?.message || null,
      });
    }

    if (action === "delivery_completed") {
      if (!safe(order.tracking_number)) {
        return NextResponse.json(
          {
            success: false,
            error: "송장번호 없는 주문은 배송완료 처리할 수 없습니다.",
          },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("expo_brand_orders")
        .update({
          order_status: "배송완료",
          delivered_at: now,
          updated_at: now,
        })
        .eq("id", orderId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      const logError = await insertOrderLog({
        orderId,
        orderStatus: "배송완료",
        actionType: "delivery_completed",
        actorId: userId,
        actorName,
        previousValue: {
          order_status: order.order_status,
          tracking_company: order.tracking_company,
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
        },
        nextValue: {
          order_status: "배송완료",
        },
        memo: "업체 배송완료 처리",
      });

      const smsError = await insertSmsLog({
        orderId,
        phone,
        receiverName: order.farmer_name || null,
        message: buildDeliveryCompletedMessage(order),
        smsType: "delivery_completed",
        now,
      });

      return NextResponse.json({
        success: true,
        log_saved: !logError,
        log_error: logError?.message || null,
        sms_logged: !smsError,
        sms_error: smsError?.message || null,
      });
    }

    return NextResponse.json(
      { success: false, error: "지원하지 않는 처리입니다." },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "업체 주문 처리 실패" },
      { status: 500 }
    );
  }
}