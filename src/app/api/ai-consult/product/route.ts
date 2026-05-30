// src/app/api/ai-consult/product/route.ts

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function cleanNumber(v: unknown) {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function appendQuestion(prev: string, next: string) {
  const before = cleanText(prev);
  const after = cleanText(next);

  if (!before) return after;
  if (!after) return before;

  return `${before}

추가 질문:
${after}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const brandId = cleanText(formData.get("brand_id"));
    const productId = cleanText(formData.get("product_id"));
    const crop = cleanText(formData.get("crop"));
    const farmSize = cleanNumber(formData.get("farm_size"));

    const previousQuestion = cleanText(formData.get("previous_question"));
    const question = cleanText(formData.get("question"));
    const mergedQuestion = appendQuestion(previousQuestion, question);

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "product_id가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: product, error: productError } = await supabase
      .from("expo_brand_products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        { ok: false, error: productError.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "제품 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const baseArea = cleanNumber(product.base_area_pyeong);
    const rounds = cleanNumber(product.recommended_rounds);

    let recommendedQuantity = 1;
    let quantityNote = "자동 추천수량 기준 정보가 부족합니다.";

    if (farmSize > 0 && baseArea > 0 && rounds > 0) {
      const oneTimeQty = Math.ceil(farmSize / baseArea);
      recommendedQuantity = Math.max(1, oneTimeQty * rounds);

      quantityNote = `${farmSize.toLocaleString(
        "ko-KR"
      )}평 기준 / 1회 사용량 약 ${oneTimeQty}개 / 권장 ${rounds}회 / 총 ${recommendedQuantity}개 추천`;
    }

    const prompt = `
제품명:
${product.product_name || ""}

제품 설명:
${product.detail_description || ""}

제품 특징:
${product.short_description || ""}

추천 작물:
${product.target_crops || ""}

사용 시기:
${product.use_period || product.use_season || ""}

사용 방법:
${product.how_to_use || ""}

희석배수:
${product.dosage_guide || ""}

주의사항:
${product.cautions || ""}

농민 재배작물:
${crop || "미입력"}

재배평수:
${farmSize || 0}평

농민 질문:
${mergedQuestion || "질문 없음"}

추천 주문 수량 계산:
${quantityNote}

답변 형식:
반드시 아래 형식으로만 답변한다.

결론:
- 질문에 대한 핵심 답을 1~2문장으로 말한다.

언제 쓰면 좋은가:
- 사용 시기와 생육 단계를 짧게 정리한다.

얼마나 쓰면 좋은가:
- 희석배수, 평수 기준, 추천 수량이 있으면 짧게 정리한다.

주의할 점:
- 혼용 주의, 고온기 주의, 한낮 살포 주의를 짧게 정리한다.

한줄 요약:
- 농민이 바로 기억할 수 있게 한 문장으로 끝낸다.

중요 규칙:
- 답변은 전체 900자 이내.
- 말투는 농민에게 설명하듯 쉽게.
- 제품 자료에 없는 효과를 단정하지 않는다.
- 불확실한 혼용은 “확인 후 혼용”이라고 말한다.
- 병해가 심하면 단독 해결처럼 말하지 말고 진단과 병행 관리가 필요하다고 말한다.
- 광고 문구처럼 과장하지 않는다.
`.trim();

    let aiAnswer = "";

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_CONSULT_MODEL || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "당신은 한국 농민을 돕는 농업 상담사입니다. 답변은 짧고 실용적으로 하며, 농민이 바로 행동할 수 있게 안내합니다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.35,
      });

      aiAnswer =
        completion.choices[0]?.message?.content?.trim() ||
        "AI 상담 답변을 생성하지 못했습니다.";
    } catch (aiError) {
      console.error("[ai-consult/product] OpenAI error:", aiError);

      aiAnswer =
        "AI 상담 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    const { data: saved, error: saveError } = await supabase
      .from("expo_ai_consult_logs")
      .insert({
        brand_id: brandId || null,
        product_id: productId || null,
        crop: crop || null,
        farm_size: farmSize || 0,
        question: mergedQuestion || null,
        ai_answer: aiAnswer || null,
        recommended_quantity: recommendedQuantity || 0,
        quantity_note: quantityNote || null,
      })
      .select("id")
      .single();

    if (saveError || !saved?.id) {
      console.error("[ai-consult/product] save error:", saveError);

      return NextResponse.json(
        { ok: false, error: "상담 저장 실패" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL(`/ai-consult/product-result?id=${saved.id}`, req.url),
      303
    );
  } catch (error) {
    console.error("[ai-consult/product] error:", error);

    return NextResponse.json(
      { ok: false, error: "AI 상담 처리 실패" },
      { status: 500 }
    );
  }
}