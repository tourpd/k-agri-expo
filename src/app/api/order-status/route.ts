import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function normalizePhone(v: unknown) {
  return clean(v).replace(/[^0-9]/g, "");
}

function maskPhone(v: unknown) {
  const n = normalizePhone(v);
  if (n.length === 11) return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
  return clean(v);
}

function fullAddress(row: any) {
  const postcode = clean(row.postcode);
  const base = clean(row.base_address);
  const detail = clean(row.detail_address);
  const legacy = clean(row.address);

  if (base || detail) {
    return `${postcode ? `[${postcode}] ` : ""}${base} ${detail}`.trim();
  }

  return legacy;
}

function publicStatus(row: any) {
  if (row.payment_status === "취소" || row.order_status === "취소") return "취소";
  if (row.order_status === "배송완료") return "배송완료";

  if (
    row.order_status === "배송중" ||
    row.order_status === "출고완료" ||
    clean(row.tracking_number)
  ) {
    return "배송중";
  }

  if (row.order_status === "출고준비") return "출고준비";
  if (row.payment_status === "입금완료") return "입금확인";

  return "입금대기";
}

function trackingUrl(company: string, number: string) {
  const c = clean(company);
  const n = clean(number);

  if (!n) return "";

  if (c.includes("CJ") || c.includes("대한통운")) {
    return `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(n)}`;
  }

  if (c.includes("롯데")) {
    return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(n)}`;
  }

  if (c.includes("한진")) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038`;
  }

  if (c.includes("우체국")) {
    return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(n)}`;
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = clean(body.name);
    const phone = normalizePhone(body.phone);

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "이름과 연락처를 입력해 주세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("expo_brand_orders")
      .select("*")
      .ilike("farmer_name", `%${name}%`)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const matched = (data || []).filter((row: any) => {
      const dbPhone = normalizePhone(row.phone);
      return dbPhone === phone || dbPhone.endsWith(phone.slice(-8));
    });

    const productIds = Array.from(
      new Set(matched.map((o: any) => o.product_id).filter(Boolean))
    );

    const brandIds = Array.from(
      new Set(matched.map((o: any) => o.brand_id).filter(Boolean))
    );

    const { data: products } =
      productIds.length > 0
        ? await supabase.from("expo_brand_products").select("*").in("id", productIds)
        : { data: [] };

    const { data: brands } =
      brandIds.length > 0
        ? await supabase.from("expo_brands").select("*").in("id", brandIds)
        : { data: [] };

    const productMap = new Map((products || []).map((p: any) => [p.id, p]));
    const brandMap = new Map((brands || []).map((b: any) => [b.id, b]));

    const orders = matched.map((row: any) => {
      const product = row.product_id ? productMap.get(row.product_id) : null;
      const brand = row.brand_id ? brandMap.get(row.brand_id) : null;

      const trackingCompany = row.tracking_company || row.delivery_company || "";
      const trackingNumber = row.tracking_number || "";

      return {
        id: row.id,
        created_at: row.created_at,

        product_name: product?.product_name || row.product_name || "주문상품",
        brand_name: brand?.brand_name || row.brand_name || "K-Agri Expo",

        farmer_name: row.farmer_name || "",
        phone: maskPhone(row.phone),
        address: fullAddress(row),

        crop: row.crop || "",
        farm_size: row.farm_size || "",
        quantity: row.quantity || "",

        payment_status: row.payment_status || "",
        order_status: row.order_status || "",
        status: publicStatus(row),

        tracking_company: trackingCompany,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl(trackingCompany, trackingNumber),

        memo: row.memo || "",
      };
    });

    return NextResponse.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "주문 조회 실패" },
      { status: 500 }
    );
  }
}