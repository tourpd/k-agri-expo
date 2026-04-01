import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string | null) {
  return (v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const url = new URL(req.url);
    const orderStatus = clean(url.searchParams.get("order_status"));
    const paymentStatus = clean(url.searchParams.get("payment_status"));
    const shippingStatus = clean(url.searchParams.get("shipping_status"));
    const eventId = clean(url.searchParams.get("event_id"));
    const q = clean(url.searchParams.get("q"));

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("expo_event_orders")
      .select(`
        order_id,
        event_id,
        vendor_id,
        farmer_session_id,
        farmer_name,
        farmer_phone,
        crop_name,
        quantity,
        unit_price_krw,
        total_amount_krw,
        order_status,
        payment_status,
        shipping_status,
        receiver_name,
        receiver_phone,
        zipcode,
        address1,
        address2,
        is_agri_manager,
        agri_manager_no,
        depositor_name,
        note,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (orderStatus && orderStatus !== "all") {
      query = query.eq("order_status", orderStatus);
    }

    if (paymentStatus && paymentStatus !== "all") {
      query = query.eq("payment_status", paymentStatus);
    }

    if (shippingStatus && shippingStatus !== "all") {
      query = query.eq("shipping_status", shippingStatus);
    }

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    if (q) {
      query = query.or(
        [
          `farmer_name.ilike.%${q}%`,
          `farmer_phone.ilike.%${q}%`,
          `receiver_name.ilike.%${q}%`,
          `receiver_phone.ilike.%${q}%`,
          `depositor_name.ilike.%${q}%`,
          `crop_name.ilike.%${q}%`,
          `address1.ilike.%${q}%`,
          `address2.ilike.%${q}%`,
          `note.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data: orders, error } = await query;

    if (error) {
      return jsonError(error.message, 500);
    }

    const eventIds = Array.from(
      new Set((orders || []).map((x: any) => x.event_id).filter(Boolean))
    );

    let eventsMap = new Map<string, any>();

    if (eventIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from("expo_events")
        .select(`
          event_id,
          title,
          product_name,
          vendor_id,
          normal_price_krw,
          expo_price_krw,
          total_quantity,
          sold_quantity,
          reserved_quantity,
          is_active,
          is_closed_early,
          end_at
        `)
        .in("event_id", eventIds);

      if (eventsError) {
        return jsonError(eventsError.message, 500);
      }

      eventsMap = new Map((events || []).map((e: any) => [e.event_id, e]));
    }

    const items = (orders || []).map((row: any) => ({
      ...row,
      event: eventsMap.get(row.event_id) || null,
    }));

    const summary = {
      total_count: items.length,
      pending_payment_count: items.filter((x: any) => x.payment_status === "pending").length,
      paid_count: items.filter((x: any) => x.payment_status === "paid").length,
      preparing_count: items.filter((x: any) => x.shipping_status === "preparing").length,
      shipped_count: items.filter((x: any) => x.shipping_status === "shipped").length,
      total_amount_krw: items.reduce(
        (sum: number, x: any) => sum + Number(x.total_amount_krw || 0),
        0
      ),
    };

    return Response.json({
      success: true,
      summary,
      items,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "주문 조회 중 오류",
      500
    );
  }
}