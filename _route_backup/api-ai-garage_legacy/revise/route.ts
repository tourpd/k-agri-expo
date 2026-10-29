import { NextResponse } from "next/server";
import OpenAI from "openai";
import { loadPV5Specs } from "@/lib/ai-garage/pv5-knowledge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { proposal, feedback } = await req.json();
    const specs = loadPV5Specs();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY 없음" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
PV5 설계안을 고객 피드백에 맞춰 수정하라.

규칙:
- 차량은 PV5 DB 안의 모델만 사용한다.
- image_url과 spec은 DB 기준을 유지한다.
- 고객 피드백을 반영해 공간 구성, 장단점, 확인사항을 수정한다.
- JSON만 출력한다.

PV5 DB:
${JSON.stringify(specs, null, 2)}

기존 설계안:
${JSON.stringify(proposal, null, 2)}

고객 수정 요청:
${feedback}
`;

    const r = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    const json = JSON.parse(r.choices[0]?.message?.content || "{}");

    return NextResponse.json({ ok: true, revised: json });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
