// src/app/api/admin/product-orders/route.ts
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

function csvCell(v: unknown) {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

function n(v: unknown) {
  const num = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function normalizeOrder(
  row: any,
  productMap: Map<string, any>,
  brandMap: Map<string, any>
) {
  const product = row.product_id ? productMap.get(row.product_id) : null;
  const brand = row.brand_id ? brandMap.get(row.brand_id) : null;

  return {
    ...row,

    product_name: row.product_name || product?.product_name || product?.name || null,
    product_category: product?.category || null,

    hall_id:
      row.hall_id ||
      product?.hall_id ||
      product?.hall_key ||
      product?.hall_code ||
      null,

    brand_name: row.brand_name || brand?.brand_name || brand?.name || null,
    brand_slug: brand?.brand_slug || brand?.slug || null,

    buyer_name: row.buyer_name || null,
    buyer_phone: row.buyer_phone || null,
    buyer_region: row.buyer_region || null,
    buyer_memo: row.buyer_memo || null,

    main_crop: row.main_crop || row.crop || null,
    farm_area: row.farm_area || null,

    coverage_per_unit: row.coverage_per_unit || null,
    recommended_quantity: row.recommended_quantity || null,

    tracking_company: row.tracking_company || row.delivery_company || null,
    tracking_number: row.tracking_number || null,
  };
}

export async function GET(req: Request) {
  const ok = await requireAdmin(req);

  if (!ok) {
    return NextResponse.json(
      { success: false, error: "관리자 인증이 필요합니다." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const keyword = safe(searchParams.get("keyword")).toLowerCase();
  const paymentStatus = safe(searchParams.get("payment_status"));
  const orderStatus = safe(searchParams.get("order_status"));
  const hallId = safe(searchParams.get("hall_id"));
  const brandId = safe(searchParams.get("brand_id"));
  const productId = safe(searchParams.get("product_id"));
  const exportType = safe(searchParams.get("export"));

  let query = supabase
      .from("expo_brand_orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
    .limit(1000);

  if (paymentStatus && paymentStatus !== "all") {
    query = query.eq("payment_status", paymentStatus);
  }

  if (orderStatus && orderStatus !== "all") {
    query = query.eq("order_status", orderStatus);
  }

  if (brandId && brandId !== "all") {
    query = query.eq("brand_id", brandId);
  }

  if (productId && productId !== "all") {
    query = query.eq("product_id", productId);
  }

  const { data: orderRows, error: orderError } = await query;

  if (orderError) {
    return NextResponse.json(
      { success: false, error: orderError.message },
      { status: 500 }
    );
  }

  const ordersRaw = orderRows || [];

  const productIds = Array.from(
    new Set(ordersRaw.map((o: any) => o.product_id).filter(Boolean))
  );

  const brandIds = Array.from(
    new Set(ordersRaw.map((o: any) => o.brand_id).filter(Boolean))
  );

  const { data: products, error: productError } =
    productIds.length > 0
      ? await supabase.from("expo_brand_products").select("*").in("id", productIds)
      : { data: [], error: null };

  if (productError) {
    return NextResponse.json(
      { success: false, error: productError.message },
      { status: 500 }
    );
  }

  const { data: brands, error: brandError } =
    brandIds.length > 0
      ? await supabase.from("expo_brands").select("*").in("id", brandIds)
      : { data: [], error: null };

  if (brandError) {
    return NextResponse.json(
      { success: false, error: brandError.message },
      { status: 500 }
    );
  }

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));
  const brandMap = new Map((brands || []).map((b: any) => [b.id, b]));

  let orders = ordersRaw.map((row: any) =>
    normalizeOrder(row, productMap, brandMap)
  );

  if (hallId && hallId !== "all") {
    orders = orders.filter((o: any) => safe(o.hall_id) === hallId);
  }

  if (keyword) {
    orders = orders.filter((o: any) => {
      const text = `
${safe(o.id)}
${safe(o.brand_name)}
${safe(o.product_name)}
${safe(o.buyer_name)}
${safe(o.buyer_phone)}
${safe(o.buyer_region)}
${safe(o.buyer_memo)}
${safe(o.main_crop)}
${safe(o.crop)}
${safe(o.farm_area)}
${safe(o.quantity)}
${safe(o.recommended_quantity)}
${safe(o.coverage_per_unit)}
${safe(o.tracking_company)}
${safe(o.tracking_number)}
      `.toLowerCase();

      return text.includes(keyword);
    });
  }

  const summary = {
    total: orders.length,
    waiting: orders.filter(
      (o: any) =>
        o.payment_status !== "입금완료" &&
        o.order_status !== "출고준비" &&
        o.order_status !== "배송중" &&
        o.order_status !== "배송완료" &&
        o.payment_status !== "취소" &&
        o.order_status !== "취소"
    ).length,
    paymentDone: orders.filter((o: any) => o.payment_status === "입금완료")
      .length,
    readyToShip: orders.filter((o: any) => o.order_status === "출고준비")
      .length,
    shipped: orders.filter((o: any) => o.order_status === "배송중").length,
    completed: orders.filter((o: any) => o.order_status === "배송완료").length,
    problem: orders.filter(
      (o: any) =>
        !safe(o.buyer_name) ||
        !safe(o.buyer_phone) ||
        !safe(o.farm_area) ||
        n(o.quantity) <= 0 ||
        o.payment_status === "취소" ||
        o.order_status === "취소"
    ).length,
  };

  if (exportType === "csv" || exportType === "shipping-template") {
    const header = [
      "주문ID",
      "주문일",
      "관",
      "브랜드",
      "제품명",
      "농민명",
      "연락처",
      "지역",
      "작물",
      "재배평수",
      "기준면적",
      "권장수량",
      "주문수량",
      "단위",
      "입금상태",
      "주문상태",
      "택배사",
      "송장번호",
      "출고일",
      "메모",
    ];

    const rows = orders.map((o: any) => [
      o.id,
      o.created_at,
      o.hall_id,
      o.brand_name,
      o.product_name,
      o.buyer_name,
      o.buyer_phone,
      o.buyer_region,
      o.main_crop || o.crop,
      o.farm_area,
      o.coverage_per_unit,
      o.recommended_quantity,
      o.quantity,
      o.unit_label,
      o.payment_status,
      o.order_status,
      o.tracking_company || "",
      o.tracking_number || "",
      o.shipped_at || "",
      o.buyer_memo || "",
    ]);

    const csv =
      "\uFEFF" +
      [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="k-agri-product-orders.csv"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    orders,
    summary,
  });
}

export async function PATCH(req: Request) {
  const ok = await requireAdmin(req);

  if (!ok) {
    return NextResponse.json(
      { success: false, error: "관리자 인증이 필요합니다." },
      { status: 401 }
    );
  }

  const body = await req.json();

  const id = safe(body.id);
  const ids = Array.isArray(body.ids) ? body.ids.map(safe).filter(Boolean) : [];
  const action = safe(body.action);

  const targetIds = id ? [id] : ids;

  if (targetIds.length === 0) {
    return NextResponse.json(
      { success: false, error: "주문 id가 없습니다." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const payload: Record<string, any> = {
    updated_at: now,
  };

  if (action === "payment_done") {
    payload.payment_status = "입금완료";
    payload.order_status = "출고준비";
  }

  if (action === "payment_waiting") {
    payload.payment_status = "입금대기";
    payload.order_status = "접수";
  }

  if (action === "ready_to_ship") {
    payload.order_status = "출고준비";
  }

  if (action === "shipped") {
    payload.order_status = "배송중";
    payload.shipped_at = now;
  }

  if (action === "delivered" || action === "done") {
    payload.order_status = "배송완료";
  }

  if (action === "cancel") {
    payload.payment_status = "취소";
    payload.order_status = "취소";
  }

  if (safe(body.payment_status)) {
    payload.payment_status = safe(body.payment_status);
  }

  if (safe(body.order_status)) {
    payload.order_status = safe(body.order_status);
  }

  if ("tracking_company" in body) {
    payload.tracking_company = safe(body.tracking_company) || null;
  }

  if ("delivery_company" in body) {
    payload.tracking_company = safe(body.delivery_company) || null;
  }

  if ("tracking_number" in body) {
    payload.tracking_number = safe(body.tracking_number) || null;
  }

  if ("buyer_memo" in body) {
    payload.buyer_memo = safe(body.buyer_memo) || null;
  }

  const { data, error } = await supabase
    .from("expo_brand_orders")
    .update(payload)
    .in("id", targetIds)
    .select("*");

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `${targetIds.length}건 처리되었습니다.`,
    orders: data || [],
    order: data?.[0] || null,
  });
}
