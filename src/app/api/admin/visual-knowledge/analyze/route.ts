import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "knowledge_visual_pages";

function safeJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");
    return JSON.parse(match[0]);
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id가 없습니다." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 .env.local에 없습니다." },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: row, error: rowError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (rowError || !row) {
      return NextResponse.json(
        { error: rowError?.message || "자료를 찾지 못했습니다." },
        { status: 404 }
      );
    }

    const imageUrl = row.image_url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "image_url이 없습니다." },
        { status: 400 }
      );
    }

    const imagePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    const prompt = `
너는 K-AGRI EXPO 농업 AI 두뇌센터의 시각자료 분석가다.
이 이미지는 농진청 PDF, 농업 교육자료, 병해충 자료, 표, 그래프, 기상자료, 재배자료 중 하나다.

반드시 아래 JSON 형식으로만 답하라.
설명 문장, 마크다운, 코드블록은 절대 쓰지 마라.

{
  "visual_type": "자료 유형. 예: 기상예보표, 병해충 사진, 병해충 표, 재배력, 농약표, 생육자료, 그래프, 일반자료",
  "crop_name": "작물이 명확하면 작물명, 없으면 공통",
  "disease_name": "병해충명이 명확하면 병해충명, 없으면 없음",
  "growth_stage": "생육단계가 보이면 입력, 없으면 미분류",
  "key_info": "운영자가 3초 안에 이해할 핵심정보 1~2문장",
  "ai_summary": "이미지 전체 내용 요약 2~3문장",
  "action_instruction": "농민에게 실제로 지시할 행동 1~3개",
  "broadcast_material": "한국농수산TV 방송소재로 쓸 수 있는 관점",
  "shorts_material": "1분 쇼츠 제목 또는 훅 문장",
  "next_action": "다음 작업. 예: 판단규칙 생성, 세환PD 검수, 방송소재화, 추가분석 필요",
  "confidence": 0부터 100 사이 숫자
}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
      }),
    });

    const openaiJson = await openaiRes.json();

    if (!openaiRes.ok) {
      return NextResponse.json(
        { error: openaiJson.error?.message || "OpenAI Vision 분석 실패" },
        { status: 500 }
      );
    }

    const outputText =
      openaiJson.output_text ||
      openaiJson.output?.[0]?.content?.[0]?.text ||
      "";

    const result = safeJson(outputText);

    const updateData = {
      visual_type: result.visual_type || row.visual_type || "자료화면",
      crop: result.crop_name || "분석필요",
      disease_name: result.disease_name || "",
      growth_stage: result.growth_stage || "",
      key_info: result.key_info || "",
      ai_summary: result.ai_summary || "",
      action_guide: result.action_instruction || "",
      broadcast_angle: result.broadcast_material || "",
      ai_shorts_topic: result.shorts_material || "",
      next_action: result.next_action || "세환PD 검수",
      ai_status: "vision_complete",
      ai_confidence: Number(result.confidence || 70),
      ai_visual_type: result.visual_type || "자료화면",
      ai_broadcast_topic: result.broadcast_material || "",
    };

    const { error: updateError } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: {
        id,
        crop_name: updateData.crop,
        disease_name: updateData.disease_name,
        growth_stage: updateData.growth_stage,
        key_info: updateData.key_info,
        ai_summary: updateData.ai_summary,
        action_instruction: updateData.action_guide,
        broadcast_material: updateData.broadcast_angle,
        shorts_material: updateData.ai_shorts_topic,
        next_action: updateData.next_action,
      },
      raw: result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "분석 중 오류" },
      { status: 500 }
    );
  }
}
