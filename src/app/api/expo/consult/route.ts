import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 질문을 받아서
 * 1) 포토닥터(병해충/작물 상태)
 * 2) 일반 상담(자재/비료/구매)
 * 로 분기 + 리드 저장까지 수행
 */

function classifyQuestion(question: string) {
  const q = question.toLowerCase();

  // 👉 병해충 / 증상 / 상태 키워드
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
    "이상해",
  ];

  const isPhotoDoctor = diseaseKeywords.some((k) => q.includes(k));

  return isPhotoDoctor ? "photodoctor" : "consult";
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

    // 👉 Supabase 저장
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("expo_consult_leads").insert({
      source: "expo_consult",
      source_detail: route,
      user_name: null,
      phone: null,
      region: null,
      city: null,
      crop: null,
      question_text: question,
    });

    if (error) {
      console.error("lead insert error:", error);
    }

    // 👉 응답 메시지
    if (route === "photodoctor") {
      return NextResponse.json({
        ok: true,
        route: "photodoctor",
        message:
          "병해충 또는 작물 상태 문제로 판단됩니다. 사진 진단을 위해 포토닥터로 연결됩니다.",
      });
    }

    return NextResponse.json({
      ok: true,
      route: "consult",
      message:
        "일반 자재/비료/구매 상담으로 판단되었습니다. 특가 및 카테고리 추천으로 연결됩니다.",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}