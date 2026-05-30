import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getOwnedBoothId() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return {
      boothId: null,
      error: "로그인이 필요합니다.",
      status: 401,
    } as const;
  }

  const { data: vendorRows, error: vendorError } = await admin
    .from("vendors")
    .select("vendor_id,user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (vendorError) {
    return {
      boothId: null,
      error: vendorError.message || "vendor 조회 중 오류가 발생했습니다.",
      status: 400,
    } as const;
  }

  const vendor = vendorRows?.[0] ?? null;

  if (!vendor?.vendor_id) {
    return {
      boothId: null,
      error: "vendor가 없습니다.",
      status: 404,
    } as const;
  }

  const { data: boothRows, error: boothError } = await admin
    .from("booths")
    .select("booth_id,vendor_id,vendor_user_id")
    .or(
      `vendor_id.eq.${normalizeText(vendor.vendor_id)},vendor_user_id.eq.${normalizeText(
        user.id
      )}`
    )
    .order("created_at", { ascending: false })
    .limit(1);

  if (boothError) {
    return {
      boothId: null,
      error: boothError.message || "부스 조회 중 오류가 발생했습니다.",
      status: 400,
    } as const;
  }

  const booth = (boothRows?.[0] ?? null) as BoothRow | null;

  if (!booth?.booth_id) {
    return {
      boothId: null,
      error: "부스를 찾을 수 없습니다.",
      status: 404,
    } as const;
  }

  return {
    boothId: booth.booth_id,
    error: null,
    status: 200,
  } as const;
}

export async function GET() {
  try {
    const resolved = await getOwnedBoothId();

    if (resolved.error || !resolved.boothId) {
      return NextResponse.json(
        {
          ok: false,
          error: resolved.error || "부스를 찾을 수 없습니다.",
          items: [],
        },
        { status: resolved.status }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: productRows, error: productError } = await admin
      .from("expo_products")
      .select("*")
      .eq("booth_id", resolved.boothId)
      .order("sort_order", { ascending: true });

    if (productError) {
      return NextResponse.json(
        {
          ok: false,
          error: productError.message || "제품 조회 중 오류가 발생했습니다.",
          items: [],
        },
        { status: 400 }
      );
    }

    const products = productRows ?? [];
    const productIds = products
      .map((row: any) => row.product_id ?? row.id)
      .filter(Boolean);

    let specMap = new Map<string, any>();

    if (productIds.length > 0) {
      const { data: specRows, error: specError } = await admin
        .from("expo_product_specs")
        .select("*")
        .in("product_id", productIds);

      if (specError) {
        return NextResponse.json(
          {
            ok: false,
            error: specError.message || "제품 상세기준 조회 중 오류가 발생했습니다.",
            items: [],
          },
          { status: 400 }
        );
      }

      specMap = new Map(
        (specRows ?? []).map((row: any) => [String(row.product_id), row])
      );
    }

    const items = products.map((product: any) => {
      const pid = String(product.product_id ?? product.id ?? "");
      return {
        ...product,
        spec: specMap.get(pid) ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "내 제품 목록 조회 중 오류가 발생했습니다.",
        items: [],
      },
      { status: 500 }
    );
  }
}