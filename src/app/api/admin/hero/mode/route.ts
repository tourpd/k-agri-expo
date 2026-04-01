import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_HERO_MODE = ["manual", "auto"];

function toOptionalNumber(value: unknown, fallback = 7) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function PATCH(req: Request) {
  try {
    const ok = await isAdminAuthenticated();

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const heroMode =
      typeof body.hero_mode === "string" &&
      ALLOWED_HERO_MODE.includes(body.hero_mode)
        ? body.hero_mode
        : null;

    const heroAutoWindowDays = toOptionalNumber(body.hero_auto_window_days, 7);

    if (!heroMode) {
      return NextResponse.json(
        { success: false, error: "hero_mode 값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("cms_settings")
      .update({
        hero_mode: heroMode,
        hero_auto_window_days: heroAutoWindowDays,
      })
      .eq("id", 1)
      .select("id, hero_mode, hero_auto_window_days")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
      message: "히어로 모드가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "히어로 모드 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}