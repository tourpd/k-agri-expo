import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const boothId = s(body?.boothId);
    const name = s(body?.name);
    const description = s(body?.description);
    const buyUrl = s(body?.buy_url);
    const imageUrl = s(body?.image_url);
    const priceNumber = body?.price_number ? Number(body.price_number) : null;

    if (!boothId) {
      return NextResponse.json({ ok: false, error: "boothId가 필요합니다." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ ok: false, error: "제품명이 필요합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // booth 소유 검증
    const { data: booth } = await admin
      .from("booths")
      .select("booth_id,owner_user_id")
      .eq("booth_id", boothId)
      .maybeSingle();

    if (!booth || booth.owner_user_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "본인 부스에만 제품 등록이 가능합니다." },
        { status: 403 }
      );
    }

    const insertPayload = {
      booth_id: boothId,
      name,
      description: description || null,
      status: "active",
      buy_url: buyUrl || null,
      price_number: Number.isFinite(priceNumber) ? priceNumber : null,
      image_url: imageUrl || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("products")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "제품 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "제품이 등록되었습니다.",
      product: data,
    });
  } catch (error: any) {
    console.error("[vendor/products][POST]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "제품 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseUser = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const productId = s(body?.productId);

    if (!productId) {
      return NextResponse.json({ ok: false, error: "productId가 필요합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("product_id,booth_id")
      .eq("product_id", productId)
      .maybeSingle();

    if (!product?.booth_id) {
      return NextResponse.json({ ok: false, error: "제품을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: booth } = await admin
      .from("booths")
      .select("booth_id,owner_user_id")
      .eq("booth_id", product.booth_id)
      .maybeSingle();

    if (!booth || booth.owner_user_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "본인 부스의 제품만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from("products")
      .update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "제품 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "제품이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("[vendor/products][DELETE]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "제품 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}