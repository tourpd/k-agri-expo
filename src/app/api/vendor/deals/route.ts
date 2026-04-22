import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEALS_TABLE = "expo_deals";

type VendorRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  company_name: string | null;
};

type BoothRow = {
  booth_id: string;
  vendor_id: string | null;
  name: string | null;
};

type ResolveCurrentVendorError = {
  ok: false;
  error: string;
  status: number;
};

type ResolveCurrentVendorSuccess = {
  ok: true;
  vendor: VendorRow;
  booth: BoothRow | null;
  user: {
    id: string;
    email?: string | null;
  };
};

type ResolveCurrentVendorResult =
  | ResolveCurrentVendorError
  | ResolveCurrentVendorSuccess;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toIsoOrNull(value: unknown) {
  const raw = normalizeString(value);
  if (!raw) return null;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function resolveCurrentVendor(): Promise<ResolveCurrentVendorResult> {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "로그인이 필요합니다.", status: 401 };
  }

  let vendor: VendorRow | null = null;

  {
    const { data, error } = await admin
      .from("vendors")
      .select("id, user_id, email, company_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) vendor = data as VendorRow;
  }

  if (!vendor && user.email) {
    const { data, error } = await admin
      .from("vendors")
      .select("id, user_id, email, company_name")
      .eq("email", user.email)
      .maybeSingle();

    if (!error && data) vendor = data as VendorRow;
  }

  if (!vendor) {
    return {
      ok: false,
      error: "연결된 업체 정보를 찾지 못했습니다.",
      status: 404,
    };
  }

  const { data: booth, error: boothError } = await admin
    .from("booths")
    .select("booth_id, vendor_id, name")
    .eq("vendor_id", vendor.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (boothError) {
    return {
      ok: false,
      error: boothError.message || "부스 조회 중 오류가 발생했습니다.",
      status: 500,
    };
  }

  return {
    ok: true,
    vendor,
    booth: (booth as BoothRow | null) || null,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const resolved = await resolveCurrentVendor();

    if (!resolved.ok) {
      return jsonError(resolved.error, resolved.status);
    }

    const { vendor, booth } = resolved;

    const { data, error } = await admin
      .from(DEALS_TABLE)
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(
        `${error.message || "특가 목록 조회 중 오류"} (테이블명 확인: ${DEALS_TABLE})`,
        500
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        company_name: vendor.company_name,
        email: vendor.email,
      },
      booth: booth
        ? {
            booth_id: booth.booth_id,
            name: booth.name,
          }
        : null,
      items: data || [],
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "특가 목록 조회에 실패했습니다.",
      500
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = createSupabaseAdminClient();
    const resolved = await resolveCurrentVendor();

    if (!resolved.ok) {
      return jsonError(resolved.error, resolved.status);
    }

    const { vendor, booth } = resolved;
    const body = await req.json();

    const title = normalizeString(body.title);
    const productName = normalizeString(body.product_name);
    const summary = normalizeString(body.summary);
    const imageUrl = normalizeString(body.image_url) || null;

    const originalPrice = normalizeNumber(body.original_price_krw);
    const dealPrice = normalizeNumber(body.deal_price_krw);
    const discountRate =
      normalizeNumber(body.discount_rate) ||
      (originalPrice > 0 && dealPrice > 0 && dealPrice < originalPrice
        ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
        : 0);

    const stockQuantity = normalizeNumber(body.stock_quantity);
    const startsAt = toIsoOrNull(body.starts_at);
    const endsAt = toIsoOrNull(body.ends_at);

    if (!title) return jsonError("특가 제목을 입력해 주세요.");
    if (!productName) return jsonError("상품명을 입력해 주세요.");
    if (!summary) return jsonError("상품 요약 설명을 입력해 주세요.");
    if (originalPrice <= 0) return jsonError("정가를 올바르게 입력해 주세요.");
    if (dealPrice <= 0) return jsonError("특가를 올바르게 입력해 주세요.");
    if (dealPrice >= originalPrice) {
      return jsonError("특가는 정가보다 낮아야 합니다.");
    }

    const insertPayload = {
      vendor_id: vendor.id,
      booth_id: booth?.booth_id || null,
      title,
      product_name: productName,
      summary,
      original_price_krw: originalPrice,
      deal_price_krw: dealPrice,
      discount_rate: discountRate,
      stock_quantity: stockQuantity,
      starts_at: startsAt,
      ends_at: endsAt,
      image_url: imageUrl,
      status: "draft",
    };

    const { data, error } = await admin
      .from(DEALS_TABLE)
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(
        `${error?.message || "특가 등록 중 오류"} (테이블명 확인: ${DEALS_TABLE})`,
        500
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
      message: "특가가 등록되었습니다.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "특가 등록에 실패했습니다.",
      500
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = createSupabaseAdminClient();
    const resolved = await resolveCurrentVendor();

    if (!resolved.ok) {
      return jsonError(resolved.error, resolved.status);
    }

    const { vendor } = resolved;
    const body = await req.json();

    const dealId = normalizeString(body.deal_id);
    if (!dealId) return jsonError("deal_id가 필요합니다.");

    const title = normalizeString(body.title);
    const productName = normalizeString(body.product_name);
    const summary = normalizeString(body.summary);
    const imageUrl = normalizeString(body.image_url) || null;

    const originalPrice = normalizeNumber(body.original_price_krw);
    const dealPrice = normalizeNumber(body.deal_price_krw);
    const discountRate =
      normalizeNumber(body.discount_rate) ||
      (originalPrice > 0 && dealPrice > 0 && dealPrice < originalPrice
        ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
        : 0);

    const stockQuantity = normalizeNumber(body.stock_quantity);
    const startsAt = toIsoOrNull(body.starts_at);
    const endsAt = toIsoOrNull(body.ends_at);

    if (!title) return jsonError("특가 제목을 입력해 주세요.");
    if (!productName) return jsonError("상품명을 입력해 주세요.");
    if (!summary) return jsonError("상품 요약 설명을 입력해 주세요.");
    if (originalPrice <= 0) return jsonError("정가를 올바르게 입력해 주세요.");
    if (dealPrice <= 0) return jsonError("특가를 올바르게 입력해 주세요.");
    if (dealPrice >= originalPrice) {
      return jsonError("특가는 정가보다 낮아야 합니다.");
    }

    const { data: existing, error: existingError } = await admin
      .from(DEALS_TABLE)
      .select("deal_id, vendor_id")
      .eq("deal_id", dealId)
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (existingError) {
      return jsonError(
        existingError.message || "기존 특가 조회 중 오류가 발생했습니다.",
        500
      );
    }

    if (!existing) {
      return jsonError("수정할 특가를 찾지 못했습니다.", 404);
    }

    const updatePayload = {
      title,
      product_name: productName,
      summary,
      original_price_krw: originalPrice,
      deal_price_krw: dealPrice,
      discount_rate: discountRate,
      stock_quantity: stockQuantity,
      starts_at: startsAt,
      ends_at: endsAt,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from(DEALS_TABLE)
      .update(updatePayload)
      .eq("deal_id", dealId)
      .eq("vendor_id", vendor.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "특가 수정에 실패했습니다.", 500);
    }

    return NextResponse.json({
      success: true,
      item: data,
      message: "특가가 수정되었습니다.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "특가 수정에 실패했습니다.",
      500
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = createSupabaseAdminClient();
    const resolved = await resolveCurrentVendor();

    if (!resolved.ok) {
      return jsonError(resolved.error, resolved.status);
    }

    const { vendor } = resolved;

    const { searchParams } = new URL(req.url);
    const dealId = normalizeString(searchParams.get("deal_id"));

    if (!dealId) {
      return jsonError("deal_id가 필요합니다.");
    }

    const { error } = await admin
      .from(DEALS_TABLE)
      .delete()
      .eq("deal_id", dealId)
      .eq("vendor_id", vendor.id);

    if (error) {
      return jsonError(error.message || "특가 삭제에 실패했습니다.", 500);
    }

    return NextResponse.json({
      success: true,
      message: "특가가 삭제되었습니다.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "특가 삭제에 실패했습니다.",
      500
    );
  }
}