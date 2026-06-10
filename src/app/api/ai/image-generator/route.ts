import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  industry?: string;
  product?: string;
  target?: string;
  problem?: string;
  cropOrField?: string;
  style?: string;
  purpose?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const product = body.product?.trim() || "제품명 미입력";
    const target = body.target?.trim() || "타겟 미입력";
    const problem = body.problem?.trim() || "고객 고민 미입력";
    const cropOrField = body.cropOrField?.trim() || "작물/분야 미입력";
    const style = body.style?.trim() || "농촌 현장형";
    const purpose = body.purpose?.trim() || "쇼츠 썸네일/배너";
    const notes = body.notes?.trim() || "추가 메모 없음";

    const result = `
━━━━━━━━━━━━━━━━━━
AI 이미지 생성 프롬프트
━━━━━━━━━━━━━━━━━━

용도: ${purpose}
제품명: ${product}
타겟: ${target}
고민: ${problem}
작물/분야: ${cropOrField}
스타일: ${style}

1. Gemini 이미지 프롬프트

한국 농촌 현장 광고 이미지.
${cropOrField} 현장에서 ${target}이 겪는 문제인 "${problem}"를 시각적으로 보여준다.
제품 ${product}는 마지막 해결 장면에서 자연스럽게 등장한다.
과장된 글자나 자막 없이 깨끗한 광고 이미지.
실사 느낌, 자연광, 농민이 바로 이해할 수 있는 장면.
9:16 세로형 쇼츠 썸네일에 적합한 구도.

2. 배너 이미지 프롬프트

Korean rural commercial banner image.
Photorealistic.
A worried Korean farmer facing the problem: ${problem}.
Clear before-and-after feeling.
Product concept: ${product}.
Crop or field: ${cropOrField}.
Clean composition.
No text.
No logo.
No captions.
Mobile-friendly vertical composition.

3. 썸네일 문구 후보

1) ${problem}, 지금 그냥 넘기면 늦습니다
2) 옆집은 벌써 준비했습니다
3) ${cropOrField} 농가 지금 확인하세요
4) ${product}, 현장에서 찾는 이유
5) 피해 오기 전에 준비하십시오

4. 제작 메모

${notes}
`;

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("image-generator error:", error);
    return NextResponse.json(
      { success: false, result: "AI 이미지 프롬프트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
