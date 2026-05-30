// src/app/api/admin/farmer-ai-summary/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fallbackSummary(memo: string) {
  return {
    success: true,
    summary: memo || "상담 내용 없음",
    stage: "상담중",
    next_contact_at: "",
    repurchase_score: 50,
    action: "추가 상담 필요",
  };
}

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start < 0 || end < 0) {
    throw new Error("JSON 형식 응답을 찾지 못했습니다.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const farmerName = safe(body.farmer_name);
    const crop = safe(body.crop);
    const product = safe(body.product);
    const memo = safe(body.memo);

    if (!memo) {
      return NextResponse.json(
        {
          success: false,
          error: "상담 메모가 없습니다.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(fallbackSummary(memo));
    }

    const prompt = `
너는 한국 농자재 상담 CRM 관리자다.

아래 농민 상담 메모를 읽고 CRM에 저장할 요약을 만들어라.

농민명: ${farmerName || "-"}
작물: ${crop || "-"}
최근 상품: ${product || "-"}
오늘 날짜: ${today()}

상담 메모:
${memo}

반드시 JSON만 출력해라.

형식:
{
  "summary": "상담 요약 한 줄",
  "stage": "신규 | 상담중 | 견적발송 | 구매완료 | 재구매관리 | VIP | 휴면 중 하나",
  "next_contact_at": "YYYY-MM-DD 또는 빈 문자열",
  "repurchase_score": 0부터 100 사이 숫자,
  "action": "다음에 해야 할 행동 한 줄"
}
`;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CRM_MODEL || "gpt-4.1-mini",
        input: prompt,
        store: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(fallbackSummary(memo));
    }

    const outputText =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "";

    const parsed = extractJson(outputText);

    return NextResponse.json({
      success: true,
      summary: safe(parsed.summary),
      stage: safe(parsed.stage) || "상담중",
      next_contact_at: safe(parsed.next_contact_at),
      repurchase_score: Number(parsed.repurchase_score || 50),
      action: safe(parsed.action),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "AI 상담요약 실패",
      },
      { status: 500 }
    );
  }
}