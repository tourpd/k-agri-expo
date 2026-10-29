import { NextResponse } from "next/server";
import OpenAI from "openai";
import { loadPV5Specs, loadPV5KnowledgeText } from "@/lib/ai-garage/pv5-knowledge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });
    }

    const specs = loadPV5Specs();
    const knowledge = loadPV5KnowledgeText();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ok: true,
        answer: "OPENAI_API_KEY가 없어 AI 답변은 실행하지 못했습니다. PV5 제원 DB는 정상 로드되었습니다.",
        specs
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
너는 PV5 전문 상담원이다.

규칙:
- 반드시 저장된 PV5 제원과 자료를 우선 근거로 답한다.
- 모르면 지어내지 말고 "현재 저장된 자료 기준으로는 확인 필요"라고 말한다.
- 사용자가 묻지 않은 옵션을 먼저 추천하지 않는다.
- 답변은 짧고 명확하게 한다.
- 저장 자료 안에 URL이 있으면 반드시 답변에 포함한다.
- 실제 사례가 있으면 "참고 영상" 항목으로 제목과 URL을 함께 보여준다.
- 마지막에 "근거: 저장된 PV5 제원/자료"라고 적는다.

PV5 제원:
${JSON.stringify(specs, null, 2)}

저장 자료:
${knowledge}

질문:
${question}
`;

    const r = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    return NextResponse.json({
      ok: true,
      answer: r.choices[0]?.message?.content || "답변 없음"
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
