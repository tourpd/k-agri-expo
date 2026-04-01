import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FARMER_ENTRY_COOKIE = "kagri_farmer_entry";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventId = clean(body.event_id);
    const quantity = Number(body.quantity || 0);

    const receiverName = clean(body.receiver_name);
    const receiverPhone = onlyDigits(clean(body.receiver_phone));
    const zipcode = clean(body.zipcode);
    const address1 = clean(body.address1);
    const address2 = clean(body.address2);

    const isAgriManager = !!body.is_agri_manager;
    const agriManagerNo = clean(body.agri_manager_no);

    const depositorName = clean(body.depositor_name);
    const note = clean(body.note);

    if (!eventId) return jsonError("event_id가 필요합니다.");
    if (!quantity || quantity < 1) return jsonError("수량을 확인해주세요.");
    if (!receiverName) return jsonError("받는 분 성함을 입력해주세요.");
    if (!receiverPhone || receiverPhone.length < 10) {
      return jsonError("받는 분 연락처를 확인해주세요.");
    }
    if (!address1) return jsonError("주소를 입력해주세요.");
    if (!depositorName) return jsonError("입금자명을 입력해주세요.");

    const cookieStore = await cookies();
    const raw = cookieStore.get(FARMER_ENTRY_COOKIE)?.value;

    if (!raw) {
      return jsonError("농민 입장이 필요합니다.", 401);
    }

    let farmerSession: any = null;
    try {
      farmerSession = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
      return jsonError("농민 세션이 올바르지 않습니다.", 401);
    }

    const farmerSessionId = clean(farmerSession?.farmer_session_id);
    const farmerName = clean(farmerSession?.name);
    const farmerPhone = onlyDigits(clean(farmerSession?.phone));
    const cropName = clean(farmerSession?.crop);

    if (!farmerName || !farmerPhone) {
      return jsonError("농민 정보가 올바르지 않습니다.", 401);
    }

    const supabase = getSupabaseAdmin();

    // 이벤트 조회
    const { data: event, error: eventError } = await supabase
      .from("expo_events")
      .select(`
        event_id,
        vendor_id,
        title,
        product_name,
        expo_price_krw,
        total_quantity,
        sold_quantity,
        reserved_quantity,
        is_active,
        is_closed_early,
        start_at,
        end_at,
        limit_per_farmer
      `)
      .eq("event_id", eventId)
      .single();

    if (eventError || !event) {
      return jsonError(eventError?.message || "이벤트를 찾지 못했습니다.", 404);
    }

    if (!event.is_active || event.is_closed_early) {
      return jsonError("종료된 이벤트입니다.", 400);
    }

    const now = Date.now();
    const startAt = event.start_at ? new Date(event.start_at).getTime() : null;
    const endAt = event.end_at ? new Date(event.end_at).getTime() : null;

    if (startAt && now < startAt) {
      return jsonError("아직 시작 전 이벤트입니다.", 400);
    }

    if (endAt && now > endAt) {
      return jsonError("종료된 이벤트입니다.", 400);
    }

    if (event.limit_per_farmer && quantity > Number(event.limit_per_farmer)) {
      return jsonError(`1인 최대 ${event.limit_per_farmer}개까지 주문 가능합니다.`);
    }

    const available =
      Number(event.total_quantity || 0) -
      Number(event.sold_quantity || 0) -
      Number(event.reserved_quantity || 0);

    if (available < quantity) {
      return jsonError(`재고가 부족합니다. 현재 주문 가능 수량: ${available}`);
    }

    const unitPrice = Number(event.expo_price_krw || 0);
    const totalAmount = unitPrice * quantity;
    const createdAt = new Date().toISOString();

    // 주문 생성
    const { data: order, error: orderError } = await supabase
      .from("expo_event_orders")
      .insert({
        event_id: event.event_id,
        vendor_id: event.vendor_id || null,
        farmer_session_id: farmerSessionId || null,

        farmer_name: farmerName,
        farmer_phone: farmerPhone,
        crop_name: cropName || null,

        quantity,
        unit_price_krw: unitPrice,
        total_amount_krw: totalAmount,

        order_status: "pending",
        payment_status: "pending",
        shipping_status: "pending",

        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        zipcode: zipcode || null,
        address1,
        address2: address2 || null,

        is_agri_manager: isAgriManager,
        agri_manager_no: isAgriManager ? agriManagerNo || null : null,

        depositor_name: depositorName,
        note: note || null,

        created_at: createdAt,
        updated_at: createdAt,
      })
      .select("*")
      .single();

    if (orderError || !order) {
      return jsonError(orderError?.message || "주문 생성 실패", 500);
    }

    // 예약수량 증가
    const { error: reserveError } = await supabase
      .from("expo_events")
      .update({
        reserved_quantity: Number(event.reserved_quantity || 0) + quantity,
        updated_at: createdAt,
      })
      .eq("event_id", event.event_id);

    if (reserveError) {
      return jsonError(reserveError.message, 500);
    }

    return Response.json({
      success: true,
      item: {
        order_id: order.order_id,
        event_id: order.event_id,
        quantity: order.quantity,
        total_amount_krw: order.total_amount_krw,
        depositor_name: order.depositor_name,
        payment_status: order.payment_status,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "주문 처리 중 오류",
      500
    );
  }
}