import { NextResponse } from "next/server";
import OpenAI from "openai";
import { loadPV5Specs, loadPV5KnowledgeText } from "@/lib/ai-garage/pv5-knowledge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userText = String(body.text || "");
    const selectedVehicle = String(body.selected_vehicle || "");

    const specs = loadPV5Specs();
    const knowledge = loadPV5KnowledgeText();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ok: false,
        error: "OPENAI_API_KEY 없음"
      }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
너는 K-AGRI AI Garage의 PV5 전문 설계 AI다.

목표:
고객이 말한 내용을 바탕으로 PV5 실제 제원 안에서 설계안 3개를 만든다.

절대 규칙:
1. 차량은 반드시 아래 DB의 model 중에서만 선택한다.
2. image_url은 반드시 DB의 값을 그대로 사용한다.
3. 차량 외관을 새로 만들거나 다른 차처럼 바꾸지 않는다.
4. 사용자가 말하지 않은 옵션을 반복 추천하지 않는다.
5. 고객의 개인 상황을 설계 이유에 반영한다.
6. 각 설계안은 서로 달라야 한다.
7. 실제 제원에 맞지 않으면 "확인필요" 또는 "불가"라고 표시한다.
8. 결과는 JSON만 출력한다.

PV5 DB:
${JSON.stringify(specs, null, 2)}

저장 자료:
${knowledge}

고객이 선택한 차량:
${selectedVehicle || "선택 안 함"}

고객 요청:
${userText}

출력 JSON:
{
  "customer_understanding": {
    "summary": "",
    "important_context": [],
    "main_use_cases": [],
    "questions_to_ask_next": []
  },
  "proposals": [
    {
      "id": "A",
      "concept_name": "",
      "vehicle": "",
      "image_url": "",
      "spec": {
        "length_mm": 0,
        "width_mm": 0,
        "height_mm": 0,
        "wheelbase_mm": 0
      },
      "why": [],
      "visible_scene": "",
      "layout_strategy": "",
      "zones": [
        {
          "name": "",
          "purpose": "",
          "fit_status": "가능|확인필요|불가"
        }
      ],
      "pros": [],
      "tradeoffs": [],
      "revise_suggestions": [],
      "estimate_note": "",
      "production_period": ""
    }
  ]
}
`;

    const r = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    const raw = r.choices[0]?.message?.content || "{}";
    const json = JSON.parse(raw);

    const specMap = new Map(specs.map((s: any) => [s.model, s]));

    json.proposals = (json.proposals || []).slice(0, 3).map((p: any, idx: number) => {
      const fallback = specs[idx] || specs[0];
      const v: any = specMap.get(p.vehicle) || fallback;

      return {
        ...p,
        id: p.id || String.fromCharCode(65 + idx),
        vehicle: v.model,
        image_url: v.image_url,
        spec: {
          length_mm: v.length_mm,
          width_mm: v.width_mm,
          height_mm: v.height_mm,
          wheelbase_mm: v.wheelbase_mm
        }
      };
    });

    return NextResponse.json({
      ok: true,
      source: "pv5_spec_grounded_ai",
      ...json
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
