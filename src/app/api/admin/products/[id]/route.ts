import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = {
  params: Promise<{ id: string }>;
};

async function requireAdmin(req: Request) {
  const url = new URL(req.url);

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }

  return await isAdminAuthenticated();
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function nullable(value: unknown) {
  const s = safe(value);
  return s || null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function optionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function optionalStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
}

function optionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = safe(id);

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "유효한 product_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("product_id", productId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "상품 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = safe(id);

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "유효한 product_id가 필요합니다." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const payload: Record<string, unknown> = {
      name: optionalString(body.name),
      slug: optionalString(body.slug),

      company_name: optionalString(body.company_name),
      vendor_target: optionalString(body.vendor_target),

      product_group: optionalString(body.product_group),
      source_type: optionalString(body.source_type),
      product_type: optionalString(body.product_type),

      price_krw: optionalNumber(body.price_krw),
      shipping_fee_krw: optionalNumber(body.shipping_fee_krw),

      volume_text: optionalString(body.volume_text),
      unit_label: optionalString(body.unit_label),

      coverage_per_unit: optionalNumber(body.coverage_per_unit),

      usage_text: optionalString(body.usage_text),
      caution_text: optionalString(body.caution_text),

      image_url: optionalString(body.image_url),

      crop_tags: optionalStringArray(body.crop_tags),
      issue_tags: optionalStringArray(body.issue_tags),
      channel_tags: optionalStringArray(body.channel_tags),

      is_photodoctor_recommended: optionalBoolean(
        body.is_photodoctor_recommended
      ),
      is_booth_product: optionalBoolean(body.is_booth_product),
      is_booth_plan: optionalBoolean(body.is_booth_plan),
      is_featured: optionalBoolean(body.is_featured),
      active: optionalBoolean(body.active),
    };

    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "수정할 데이터가 없습니다." },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("product_id", productId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: "상품 정보가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "상품 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}