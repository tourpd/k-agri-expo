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

async function requireAdmin(req: Request) {
  const url = new URL(req.url);

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }

  return await isAdminAuthenticated();
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

    const ids = Array.isArray(body.ids)
      ? body.ids.map(safe).filter(Boolean)
      : [];

    const active = body.active === true;

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "선택된 상품이 없습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("products")
      .update({
        active,
        updated_at: new Date().toISOString(),
      })
      .in("product_id", ids);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length}개 상품이 ${
        active ? "활성" : "비활성"
      } 처리되었습니다.`,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "상품 일괄 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}