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
  return String(v ?? "").trim();
}

function nullable(v: unknown) {
  const s = safe(v);
  return s || null;
}

function num(v: unknown, fallback = 0) {
  if (v === null || v === undefined || v === "") return fallback;

  const cleaned = String(v).replace(/[^\d.-]/g, "");
  const n = Number(cleaned);

  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback = false) {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function textArray(v: unknown) {
  if (Array.isArray(v)) {
    return v.map(safe).filter(Boolean);
  }

  const s = safe(v);
  if (!s) return [];

  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function requireAdmin(req: Request) {
  const url = new URL(req.url);

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }

  return await isAdminAuthenticated();
}

function makePayload(body: any, mode: "create" | "update") {
  const name = safe(body.name);

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (mode === "create") {
    payload.created_at = new Date().toISOString();
  }

  if ("name" in body) {
    payload.name = mode === "create" ? name : nullable(body.name);
  }

  if ("slug" in body) {
    payload.slug =
      nullable(body.slug) ||
      (name ? name.replace(/\s+/g, "-").toLowerCase() : null);
  }

  if ("vendor_target" in body) {
    payload.vendor_target = nullable(body.vendor_target) || "dof";
  }

  if ("company_name" in body) {
    payload.company_name = nullable(body.company_name);
  }

  if ("price_krw" in body) {
    payload.price_krw = num(body.price_krw, 0);
  }

  if ("shipping_fee_krw" in body) {
    payload.shipping_fee_krw = num(body.shipping_fee_krw, 3000);
  }

  if ("unit_label" in body) {
    payload.unit_label = nullable(body.unit_label) || "병";
  }

  if ("volume_text" in body) {
    payload.volume_text = nullable(body.volume_text);
  }

  if ("coverage_per_unit" in body) {
    payload.coverage_per_unit = num(body.coverage_per_unit, 0);
  }

  if ("usage_text" in body) {
    payload.usage_text = nullable(body.usage_text);
  }

  if ("caution_text" in body) {
    payload.caution_text = nullable(body.caution_text);
  }

  if ("image_url" in body) {
    payload.image_url = nullable(body.image_url);
  }

  if ("product_type" in body) {
    payload.product_type = nullable(body.product_type);
  }

  if ("product_group" in body) {
    payload.product_group = nullable(body.product_group) || "material";
  }

  if ("source_type" in body) {
    payload.source_type = nullable(body.source_type) || "admin";
  }

  if ("crop_tags" in body) {
    payload.crop_tags = textArray(body.crop_tags);
  }

  if ("issue_tags" in body) {
    payload.issue_tags = textArray(body.issue_tags);
  }

  if ("channel_tags" in body) {
    payload.channel_tags = textArray(body.channel_tags);
  }

  if ("sort_order" in body) {
    payload.sort_order = num(body.sort_order, 0);
  }

  if ("is_photodoctor_recommended" in body) {
    payload.is_photodoctor_recommended = bool(
      body.is_photodoctor_recommended,
      false
    );
  }

  if ("is_booth_product" in body) {
    payload.is_booth_product = bool(body.is_booth_product, false);
  }

  if ("is_booth_plan" in body) {
    payload.is_booth_plan = bool(body.is_booth_plan, false);
  }

  if ("is_featured" in body) {
    payload.is_featured = bool(body.is_featured, false);
  }

  if ("active" in body) {
    payload.active = bool(body.active, true);
  }

  return payload;
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

    const { searchParams } = new URL(req.url);

    const keyword = safe(searchParams.get("keyword"));
    const active = safe(searchParams.get("active"));
    const productGroup = safe(searchParams.get("product_group"));
    const sourceType = safe(searchParams.get("source_type"));
    const productType = safe(searchParams.get("product_type"));
    const channel = safe(searchParams.get("channel"));
    const photodoctor = safe(searchParams.get("photodoctor"));
    const boothPlan = safe(searchParams.get("booth_plan"));
    const boothProduct = safe(searchParams.get("booth_product"));
    const featured = safe(searchParams.get("featured"));

    let query = supabase
      .from("products")
      .select("*")
      .order("is_photodoctor_recommended", { ascending: false })
      .order("is_featured", { ascending: false })
      .order("active", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,company_name.ilike.%${keyword}%,slug.ilike.%${keyword}%,usage_text.ilike.%${keyword}%,product_group.ilike.%${keyword}%,source_type.ilike.%${keyword}%,product_type.ilike.%${keyword}%`
      );
    }

    if (active === "active") query = query.eq("active", true);
    if (active === "inactive") query = query.eq("active", false);

    if (productGroup && productGroup !== "all") {
      query = query.eq("product_group", productGroup);
    }

    if (sourceType && sourceType !== "all") {
      query = query.eq("source_type", sourceType);
    }

    if (productType && productType !== "all") {
      query = query.eq("product_type", productType);
    }

    if (channel && channel !== "all") {
      query = query.contains("channel_tags", [channel]);
    }

    if (photodoctor === "true") {
      query = query.eq("is_photodoctor_recommended", true);
    }

    if (photodoctor === "false") {
      query = query.eq("is_photodoctor_recommended", false);
    }

    if (boothPlan === "true") {
      query = query.eq("is_booth_plan", true);
    }

    if (boothProduct === "true") {
      query = query.eq("is_booth_product", true);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query.limit(2000);

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
      {
        success: false,
        error: e?.message || "상품 목록 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const name = safe(body.name);

    if (!name) {
      return NextResponse.json(
        { success: false, error: "상품명은 필수입니다." },
        { status: 400 }
      );
    }

    const payload = {
      ...makePayload(body, "create"),
      name,
      slug: nullable(body.slug) || name.replace(/\s+/g, "-").toLowerCase(),
      vendor_target: nullable(body.vendor_target) || "dof",
      unit_label: nullable(body.unit_label) || "병",
      shipping_fee_krw: num(body.shipping_fee_krw, 3000),
      product_group: nullable(body.product_group) || "material",
      source_type: nullable(body.source_type) || "admin",
      crop_tags: textArray(body.crop_tags),
      issue_tags: textArray(body.issue_tags),
      channel_tags: textArray(body.channel_tags),
      sort_order: num(body.sort_order, 0),
      is_photodoctor_recommended: bool(
        body.is_photodoctor_recommended,
        false
      ),
      is_booth_product: bool(body.is_booth_product, false),
      is_booth_plan: bool(body.is_booth_plan, false),
      is_featured: bool(body.is_featured, false),
      active: typeof body.active === "boolean" ? body.active : true,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
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
      message: "상품이 등록되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "상품 등록 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
        { success: false, error: "product_id가 필요합니다." },
        { status: 400 }
      );
    }

    const payload = makePayload(body, "update");

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
      message: "상품 수정 완료",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "상품 수정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = safe(searchParams.get("product_id"));

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "product_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "상품 삭제 완료",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "상품 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}