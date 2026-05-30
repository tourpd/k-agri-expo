import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recommendProducts } from "@/lib/recommend/recommendProduct";

export const dynamic = "force-dynamic";

/**
 * 질문 분석 → 포토닥터 or 일반 상담 분기
 */

function classifyQuestion(question: string) {
  const q = question.toLowerCase();

  const diseaseKeywords = [
    "병",
    "충",
    "벌레",
    "진딧물",
    "총채",
    "노균",
    "탄저",
    "녹병",
    "흰가루",
    "썩",
    "시들",
    "마름",
    "점",
    "반점",
    "변색",
    "이상",
    "죽",
    "사진",
    "증상",
    "잎",
    "줄기",
  ];

  const isPhotoDoctor = diseaseKeywords.some((k) => q.includes(k));

  return isPhotoDoctor ? "photodoctor" : "consult";
}

/**
 * 간단한 작물 추출
 */
function extractCrop(question: string) {
  const crops = ["고추", "딸기", "마늘", "배추", "오이", "토마토", "벼"];

  return crops.find((c) => question.includes(c)) || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const question = String(body?.question_text || "").trim();

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "question_text required" },
        { status: 400 }
      );
    }

    const route = classifyQuestion(question);
    const crop = extractCrop(question);

    const supabase = await createSupabaseServerClient();

    // 👉 상품 가져오기 (추천용)
    const { data: products } = await supabase
      .from("expo_products")
      .select("*")
      .limit(50);

    let recommended = null;

    if (products && route === "consult") {
      recommended = recommendProducts(
        { crop: crop || "", message: question },
        products
      );
    }

    // 👉 리드 저장 (중요)
    const { error } = await supabase.from("expo_consult_leads").insert({
      source: "expo_consult",
      source_detail: route,
      user_name: body?.name || null,
      phone: body?.phone || null,
      region: body?.region || null,
      city: body?.city || null,
      crop: crop,
      question_text: question,
    });

    if (error) {
      console.error("lead insert error:", error);
    }

    /**
     * 👉 포토닥터 라우팅
     */
    if (route === "photodoctor") {
      return NextResponse.json({
        ok: true,
        route: "photodoctor",
        message:
          "병해 또는 작물 이상 증상으로 판단됩니다. 사진 진단(포토닥터)으로 연결됩니다.",
        next_action: "/ai-consult", // 👉 포토닥터 페이지
      });
    }

    /**
     * 👉 일반 상담 + 추천
     */
    return NextResponse.json({
      ok: true,
      route: "consult",
      message:
        "자재/비료 관련 상담으로 판단되었습니다. 추천 제품을 확인해보세요.",
      recommended_products: recommended?.products || [],
      reason: recommended?.reason || "",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}