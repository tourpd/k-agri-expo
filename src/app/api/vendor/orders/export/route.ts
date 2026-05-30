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

function csvCell(v: unknown) {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
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

function fullAddress(row: any) {
  const postcode = safe(row.postcode);
  const base = safe(row.base_address);
  const detail = safe(row.detail_address);
  const legacy = safe(row.address);

  if (base || detail) {
    return `${postcode ? `[${postcode}] ` : ""}${base} ${detail}`.trim();
  }

  return legacy || "-";
}

export async function GET() {
  try {
    const vendorUser = await requireVendorUser();

    const userId = getVendorUserId(vendorUser);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "업체 로그인 정보가 없습니다.",
        },
        {
          status: 401,
        }
      );
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_id, company_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (vendorError || !vendor) {
      return NextResponse.json(
        {
          success: false,
          error:
            vendorError?.message ||
            "업체 정보를 찾을 수 없습니다.",
        },
        {
          status: 403,
        }
      );
    }

    const { data: brands, error: brandError } =
      await supabase
        .from("expo_brands")
        .select("id, brand_name")
        .eq("vendor_id", vendor.vendor_id);

    if (brandError) {
      return NextResponse.json(
        {
          success: false,
          error: brandError.message,
        },
        {
          status: 500,
        }
      );
    }

    const brandIds = (brands || []).map(
      (b: any) => b.id
    );

    if (brandIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "연결된 브랜드가 없습니다.",
        },
        {
          status: 403,
        }
      );
    }

    const { data: orders, error: orderError } =
      await supabase
        .from("expo_brand_orders")
        .select("*")
        .in("brand_id", brandIds)
        .in("order_status", [
          "출고준비",
          "배송중",
        ])
        .order("created_at", {
          ascending: false,
        });

    if (orderError) {
      return NextResponse.json(
        {
          success: false,
          error: orderError.message,
        },
        {
          status: 500,
        }
      );
    }

    const productIds = Array.from(
      new Set(
        (orders || [])
          .map((o: any) => o.product_id)
          .filter(Boolean)
      )
    );

    const { data: products } =
      productIds.length > 0
        ? await supabase
            .from("expo_brand_products")
            .select("id, product_name")
            .in("id", productIds)
        : { data: [] };

    const productMap = new Map(
      (products || []).map((p: any) => [
        p.id,
        p,
      ])
    );

    const brandMap = new Map(
      (brands || []).map((b: any) => [
        b.id,
        b,
      ])
    );

    const header = [
      "주문ID",
      "브랜드",
      "제품명",
      "농민명",
      "연락처",
      "주소",
      "작물",
      "재배평수",
      "주문수량",
      "택배사",
      "송장번호",
      "출고일",
      "비고",
    ];

    const rows = (orders || []).map(
      (o: any) => {
        const product = o.product_id
          ? productMap.get(o.product_id)
          : null;

        const brand = o.brand_id
          ? brandMap.get(o.brand_id)
          : null;

        return [
          o.id,
          brand?.brand_name || "-",
          product?.product_name ||
            o.product_name ||
            "-",
          o.farmer_name || "-",
          o.phone || "-",
          fullAddress(o),
          o.crop || "-",
          o.farm_size || "-",
          o.quantity || "-",
          o.tracking_company || "",
          o.tracking_number || "",
          "",
          "",
        ];
      }
    );

    const csv =
      "\uFEFF" +
      [header, ...rows]
        .map((row) =>
          row.map(csvCell).join(",")
        )
        .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vendor-shipping-template.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message ||
          "출고용 엑셀 다운로드 실패",
      },
      {
        status: 500,
      }
    );
  }
}