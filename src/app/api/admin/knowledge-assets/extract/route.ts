import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rule = {
  crop: string;
  month: string;
  growth_stage: string;
  symptom: string;
  cause: string;
  countermeasure: string;
  action_instruction: string;
  confidence_score?: number;
  source_reference?: string;
};

function fallbackExtract(input: {
  title: string;
  author: string;
  crop: string;
  month: string;
  raw_content: string;
}): Rule[] {
  const crop = input.crop || "작물 미지정";
  const text = input.raw_content;

  const months = ["5월", "6월", "7월", "8월", "9월", "10월"];
  const foundMonths = months.filter((m) => text.includes(m));
  const targetMonths = foundMonths.length ? foundMonths : [input.month || "월 미지정"];

  return targetMonths.map((m) => ({
    crop,
    month: m,
    growth_stage: "원문 기반 생육단계 확인 필요",
    symptom: "원문 기반 증상 추출 필요",
    cause: "원문 기반 원인 확인 필요",
    countermeasure: "원문 기반 대책 확인 필요",
    action_instruction: `${m} ${crop} 자료를 확인하고 생육상태, 병해충, 양분관리, 방제시기를 점검합니다.`,
    confidence_score: 0.4,
    source_reference: `${input.author || "출처 미지정"} ${input.title}`,
  }));
}

function safeJsonParse(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start >= 0 && end >= 0) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  return JSON.parse(cleaned);
}

async function aiExtract(input: {
  title: string;
  author: string;
  crop: string;
  month: string;
  raw_content: string;
}): Promise<Rule[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackExtract(input);
  }

  const prompt = `
너는 K-AGRI 농업 AI 두뇌센터의 농업자료 해체 엔진이다.

아래 농업자료 원문에서 농민 행동규칙을 추출하라.

반드시 JSON 배열만 출력하라.
설명 문장, 마크다운, 코드블록 금지.

각 항목 형식:
{
  "crop": "작물",
  "month": "월",
  "growth_stage": "생육단계",
  "symptom": "증상 또는 문제",
  "cause": "원인",
  "countermeasure": "대책",
  "action_instruction": "농민이 실제로 해야 할 행동지시",
  "confidence_score": 0.8,
  "source_reference": "출처"
}

추출 기준:
- 원문에 근거가 있는 내용만 추출
- 월별 작업지시를 우선 추출
- 증상 → 원인 → 대책 → 행동지시 구조로 정리
- 행동지시는 농민에게 바로 말할 수 있는 문장으로 작성
- 불확실하면 confidence_score를 낮춰라

자료 제목: ${input.title}
저자/출처: ${input.author}
기본 작물: ${input.crop}
기본 월: ${input.month}

원문:
${input.raw_content}
`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`OpenAI 추출 실패: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const text =
    data.output_text ||
    data.output?.[0]?.content?.[0]?.text ||
    "";

  if (!text.trim()) {
    throw new Error("OpenAI 응답이 비어 있습니다.");
  }

  const parsed = safeJsonParse(text);

  if (!Array.isArray(parsed)) {
    throw new Error("OpenAI 응답이 JSON 배열이 아닙니다.");
  }

  return parsed.map((r) => ({
    crop: String(r.crop || input.crop || ""),
    month: String(r.month || input.month || ""),
    growth_stage: String(r.growth_stage || ""),
    symptom: String(r.symptom || ""),
    cause: String(r.cause || ""),
    countermeasure: String(r.countermeasure || ""),
    action_instruction: String(r.action_instruction || ""),
    confidence_score: Number(r.confidence_score || 0.7),
    source_reference: String(r.source_reference || `${input.author} ${input.title}`),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mode = body.mode;
    const title = String(body.title || "").trim();
    const author = String(body.author || "").trim();
    const crop = String(body.crop || "").trim();
    const month = String(body.month || "").trim();
    const raw_content = String(body.raw_content || "").trim();

    if (!title) {
      return NextResponse.json({ error: "자료 제목이 필요합니다." }, { status: 400 });
    }

    if (mode === "extract") {
      if (!raw_content) {
        return NextResponse.json({ error: "원문이 필요합니다." }, { status: 400 });
      }

      const rules = await aiExtract({ title, author, crop, month, raw_content });

      return NextResponse.json({ rules });
    }

    if (mode === "save") {
      const rules = (body.rules || []) as Rule[];

      if (!Array.isArray(rules) || rules.length === 0) {
        return NextResponse.json({ error: "저장할 판단규칙이 없습니다." }, { status: 400 });
      }

      const supabase = createSupabaseAdminClient();

      const { data: asset, error: assetError } = await supabase
        .from("knowledge_assets")
        .insert({
          title,
          source_type: "text",
          author,
          crop,
          month,
          raw_content,
          ai_summary: `${rules.length}건의 판단규칙 추출`,
          status: "approved",
        })
        .select("id")
        .single();

      if (assetError) {
        return NextResponse.json({ error: assetError.message }, { status: 500 });
      }

      const rows = rules.map((r) => ({
        knowledge_id: asset.id,
        crop: r.crop || crop,
        month: r.month || month,
        growth_stage: r.growth_stage || null,
        symptom: r.symptom || null,
        cause: r.cause || null,
        countermeasure: r.countermeasure || null,
        action_instruction: r.action_instruction || null,
        confidence_score: r.confidence_score || 0.7,
        source_reference: r.source_reference || `${author} ${title}`,
        status: "approved",
      }));

      const { error: ruleError } = await supabase
        .from("knowledge_rules")
        .insert(rows);

      if (ruleError) {
        return NextResponse.json({ error: ruleError.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        assetId: asset.id,
        savedRules: rows.length,
      });
    }

    return NextResponse.json({ error: "mode가 올바르지 않습니다." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "서버 오류" },
      { status: 500 }
    );
  }
}
