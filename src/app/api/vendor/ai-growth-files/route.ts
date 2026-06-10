import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_LIMITS = {
  free: 3,
  basic: 10,
  pro: 30,
  premium: 100,
  vip: 999,
} as const;

type PlanKey = keyof typeof PLAN_LIMITS;

function normalizePlan(v: unknown): PlanKey {
  const s = String(v || "free").trim();

  if (s === "basic") return "basic";
  if (s === "pro") return "pro";
  if (s === "premium") return "premium";
  if (s === "vip") return "vip";

  return "free";
}

export async function GET(req: NextRequest) {
  try {
    const productId = String(
      req.nextUrl.searchParams.get("product_id") || ""
    ).trim();

    if (!productId) {
      return NextResponse.json(
        {
          ok: false,
          error: "product_id 필요",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_product_growth_files")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      files: data || [],
    });
  } catch (error) {
    console.error("[ai-growth-files][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "파일 조회 실패",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const productId = String(body.product_id || "").trim();
    const fileType = String(body.file_type || "document").trim();
    const fileUrl = String(body.file_url || "").trim();
    const fileName = String(body.file_name || "").trim();
    const mimeType = String(body.mime_type || "").trim();
    const rawFileSize = Number(body.file_size || 0);
    const fileSize = Number.isFinite(rawFileSize) ? rawFileSize : 0;

    if (!productId) {
      return NextResponse.json(
        {
          ok: false,
          error: "product_id 필요",
        },
        { status: 400 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "file_url 필요",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: product, error: productError } = await supabase
      .from("expo_brand_products")
      .select("id, brand_id")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        {
          ok: false,
          error: productError.message,
        },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          ok: false,
          error: `제품 없음: ${productId}`,
        },
        { status: 404 }
      );
    }

    let plan: PlanKey = "free";

    if (product.brand_id) {
      const { data: brand, error: brandError } = await supabase
        .from("expo_brands")
        .select("vendor_plan")
        .eq("id", product.brand_id)
        .maybeSingle();

      if (!brandError) {
        plan = normalizePlan(brand?.vendor_plan);
      }
    }

    const maxFiles = PLAN_LIMITS[plan];

    const { count, error: countError } = await supabase
      .from("expo_product_growth_files")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("product_id", productId);

    if (countError) {
      return NextResponse.json(
        {
          ok: false,
          error: countError.message,
        },
        { status: 500 }
      );
    }

    if ((count || 0) >= maxFiles) {
      return NextResponse.json(
        {
          ok: false,
          error: `현재 등급(${plan})은 최대 ${maxFiles}개 자료까지 업로드 가능합니다.`,
        },
        { status: 403 }
      );
    }

    const insertPayload = {
      product_id: productId,
      file_type: fileType || "document",
      file_url: fileUrl,
      file_name: fileName || null,
      mime_type: mimeType || null,
      file_size: fileSize,
    };

    const { data, error } = await supabase
      .from("expo_product_growth_files")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[ai-growth-files][INSERT ERROR]", error);
      console.error("[ai-growth-files][INSERT PAYLOAD]", insertPayload);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          payload: insertPayload,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      plan,
      max_files: maxFiles,
      file: data,
    });
  } catch (error) {
    console.error("[ai-growth-files][POST]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "파일 저장 실패",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fileId = String(req.nextUrl.searchParams.get("id") || "").trim();

    if (!fileId) {
      return NextResponse.json(
        {
          ok: false,
          error: "id 필요",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("expo_product_growth_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("[ai-growth-files][DELETE]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "삭제 실패",
      },
      { status: 500 }
    );
  }
}