import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAutoHeroData } from "@/lib/expo/hero-auto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const ok = await isAdminAuthenticated();

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: cms, error } = await supabase
      .from("cms_settings")
      .select("id, hero_mode, hero_auto_window_days, hero_title, hero_subtitle")
      .eq("id", 1)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const autoHero = await getAutoHeroData().catch(() => null);

    return NextResponse.json({
      success: true,
      settings: cms,
      autoHero,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "히어로 설정 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}