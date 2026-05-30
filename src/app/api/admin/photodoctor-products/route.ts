import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown, fallback = 0) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function requireAdmin(req: Request) {
  const url = new URL(req.url);

  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1";

  if (isLocal) return true;

  return await isAdminAuthenticated();
}

export async function GET(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        product_id,
        name,
        slug,
        vendor_target,
        company_name,
        price_krw,
        shipping_fee_krw,
        unit_label,
        volume_text,
        coverage_per_unit,
        usage_text,
        caution_text,
        image_url,
        product_type,
        active,
        created_at,
        updated_at
      `)
      .eq("vendor_target", "dof")
      .not("slug", "is", null)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "상품 조회 실패" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const productId = safe(body.product_id);

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "product_id가 없습니다." },
        { status: 400 }
      );
    }

    const payload = {
      name: safe(body.name),
      slug: safe(body.slug),
      vendor_target: safe(body.vendor_target) || "dof",
      company_name: safe(body.company_name) || "도프",

      price_krw: num(body.price_krw, 0),
      shipping_fee_krw: num(body.shipping_fee_krw, 3000),

      unit_label: safe(body.unit_label) || "개",
      volume_text: safe(body.volume_text),
      coverage_per_unit: num(body.coverage_per_unit, 300),

      usage_text: safe(body.usage_text),
      caution_text: safe(body.caution_text),
      image_url: safe(body.image_url),
      product_type: safe(body.product_type),

      active: Boolean(body.active),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .update(payload)
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
      message: "포토닥터 상품 정보가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "상품 저장 실패" },
      { status: 500 }
    );
  }
}