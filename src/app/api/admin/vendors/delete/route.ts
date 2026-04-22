import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeleteMode = "soft" | "hard";

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "관리자 권한이 없습니다." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const userId = safeText(body?.userId);
    const mode = safeText(body?.mode) as DeleteMode;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    if (mode !== "soft" && mode !== "hard") {
      return NextResponse.json(
        { ok: false, error: "mode는 soft 또는 hard 여야 합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    if (mode === "soft") {
      const { error } = await supabase.rpc("soft_delete_vendor_bundle", {
        p_user_id: userId,
        p_deleted_by: "admin",
      });

      if (error) {
        console.error("[admin/vendors/delete][soft]", error);
        return NextResponse.json(
          { ok: false, error: error.message || "업체 비활성화에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        mode,
        message: "업체가 비활성화되었습니다.",
      });
    }

    // hard delete
    const { error: bundleError } = await supabase.rpc("hard_delete_vendor_bundle", {
      p_user_id: userId,
    });

    if (bundleError) {
      console.error("[admin/vendors/delete][hard][bundle]", bundleError);
      return NextResponse.json(
        { ok: false, error: bundleError.message || "업체 데이터 정리에 실패했습니다." },
        { status: 500 }
      );
    }

    // auth user 삭제
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("[admin/vendors/delete][hard][auth]", authDeleteError);
      return NextResponse.json(
        {
          ok: false,
          error: authDeleteError.message || "Auth 사용자 삭제에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode,
      message: "업체와 계정이 완전삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("[admin/vendors/delete][POST]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "삭제 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}