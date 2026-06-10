import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { analyzeYoutubeForSalesPage } from "@/lib/ai-sales/youtubeAnalyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const youtubeUrl = String(body.youtube_url || "").trim();
    const productId = String(body.product_id || "").trim();

    if (!youtubeUrl) {
      return NextResponse.json(
        { ok: false, error: "유튜브 URL을 입력해주세요." },
        { status: 400 }
      );
    }

    const result = await analyzeYoutubeForSalesPage({
      youtube_url: youtubeUrl,
    });

    const supabase = createSupabaseAdminClient();

    if (productId) {
      await supabase
        .from("expo_ai_products")
        .update({
          youtube_url: youtubeUrl,
          status: "youtube_analyzed",
        })
        .eq("id", productId);
    }

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    console.error("youtube-analyzer error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "유튜브 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}