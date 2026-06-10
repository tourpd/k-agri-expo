import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const prompt = `
당신은 한국농수산TV의 AI 판매작가입니다.

아래 상세페이지 카드 내용을 농민이 바로 공감하고 구매 행동을 하도록 다시 작성하십시오.

요청:
${body.instruction || "더 강하게 다시 작성"}

프로젝트명:
${body.projectName || ""}

현재 카드:
제목: ${body.card?.title || ""}
부제목: ${body.card?.subtitle || ""}
본문: ${body.card?.content || ""}
버튼문구: ${body.card?.buttonText || ""}

반드시 JSON만 반환하십시오.

형식:
{
  "title": "새 제목",
  "subtitle": "새 부제목",
  "content": "새 본문",
  "buttonText": "새 버튼문구",
  "reason": "왜 이렇게 바꿨는지"
}
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "농민 대상 상세페이지, 공동구매, 농자재 광고 문구를 잘 쓰는 한국농수산TV 판매작가입니다.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data?.error?.message || "AI 재작성 실패" },
        { status: res.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({
      success: true,
      result: JSON.parse(cleaned),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "서버 오류",
      },
      { status: 500 }
    );
  }
}
