import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  industry?: string;
  product?: string;
  target?: string;
  problem?: string;
  cropOrField?: string;
  price?: string;
  style?: string;
  duration?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const product = body.product?.trim() || "제품명 미입력";
    const target = body.target?.trim() || "타겟 미입력";
    const problem = body.problem?.trim() || "고객 고민 미입력";
    const cropOrField = body.cropOrField?.trim() || "작물/분야 미입력";
    const price = body.price?.trim() || "가격 미입력";
    const style = body.style?.trim() || "웃긴반전형";
    const duration = body.duration?.trim() || "8초";
    const notes = body.notes?.trim() || "추가 메모 없음";

    const result = `
━━━━━━━━━━━━━━━━━━
AI 영상 생성 전략
━━━━━━━━━━━━━━━━━━

제품명: ${product}
타겟: ${target}
문제: ${problem}
작물/분야: ${cropOrField}
가격/조건: ${price}
스타일: ${style}
길이: ${duration}

━━━━━━━━━━━━━━━━━━
1. BEST 영상 콘티
━━━━━━━━━━━━━━━━━━

0~2초
${target}이 ${problem} 때문에 당황하는 장면.
제품은 아직 보여주지 않는다.

2~5초
옆집 또는 성공 농가와 비교되는 장면.
농민이 "왜 저기는 다르지?"라고 느끼는 표정.

5~8초
${product}가 해결책으로 등장.
신청, 공동구매, 상담으로 연결되는 흐름.

━━━━━━━━━━━━━━━━━━
2. 대안 영상 콘티
━━━━━━━━━━━━━━━━━━

0~3초
문제가 이미 터진 현장.
피해 장면을 강하게 보여준다.

3~6초
농민의 한숨, 손해, 불안 표현.

6~8초
${product}를 통해 지금 준비해야 한다는 메시지.

━━━━━━━━━━━━━━━━━━
3. 실험 영상 콘티
━━━━━━━━━━━━━━━━━━

농촌 시트콤 방식.
몽몽이가 사고를 치고, 처제가 팩트폭격을 하며, 마지막에 제품이 자연스럽게 등장.

━━━━━━━━━━━━━━━━━━
4. Gemini / Veo 프롬프트
━━━━━━━━━━━━━━━━━━

Create a ${duration} vertical 9:16 YouTube Shorts video.

Korean rural sitcom commercial.
No subtitles.
No captions.
No text overlays.
No logos.
No watermarks.

Product: ${product}
Target customer: ${target}
Problem: ${problem}
Crop or field: ${cropOrField}

Scene:
A Korean farmer discovers a serious field problem.
Show the problem visually first.
A funny rural situation happens.
The solution appears naturally at the end.
Photorealistic.
Natural sunlight.
Korean countryside.
Clean cinematic video only.
Strong emotional hook in first 3 seconds.

━━━━━━━━━━━━━━━━━━
5. CapCut 자막용 대사
━━━━━━━━━━━━━━━━━━

0~2초:
"${problem}, 그냥 넘기면 늦습니다."

2~5초:
"옆집은 벌써 준비했습니다."

5~8초:
"${product}, 지금 확인하세요."

━━━━━━━━━━━━━━━━━━
6. 제작 메모
━━━━━━━━━━━━━━━━━━

${notes}
`;

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("video-generator error:", error);
    return NextResponse.json(
      { success: false, result: "AI 영상 전략 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
