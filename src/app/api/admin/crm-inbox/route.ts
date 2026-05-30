// src/app/api/admin/crm-inbox/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function phoneOnly(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function asArray(v: unknown) {
  return Array.isArray(v) ? v : [];
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start < 0 || end < 0) {
    throw new Error("JSON 응답을 찾지 못했습니다.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function fallbackAnalyze(body: any) {
  return {
    category: safe(body.category) || "ETC",
    business_area: safe(body.business_area) || "K_AGRI_EXPO",
    ai_summary: safe(body.ai_summary) || safe(body.content).slice(0, 160),
    ai_action: safe(body.ai_action) || "내용 확인 후 후속 연락",
    priority: safe(body.priority) || "C",
    estimated_value: Number(body.estimated_value || 0),
    assigned_to: safe(body.assigned_to) || "미지정",
  };
}

async function analyzeLead(body: any) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return fallbackAnalyze(body);

  const prompt = `
너는 K-Agri Expo와 한국농수산TV의 AI 영업실장이다.

아래 문의를 읽고 어떤 종류의 리드인지 분류하라.
농민 문의만 보는 것이 아니라 바이어, 해외업체, 입점기업, OEM, 건강기능식품, 곤충산업, 농기계, 광고/제휴 문의까지 모두 판단해야 한다.

입력:
채널: ${safe(body.channel) || "-"}
이름: ${safe(body.contact_name) || safe(body.sender_name) || "-"}
회사: ${safe(body.company_name) || "-"}
전화: ${safe(body.phone) || "-"}
이메일: ${safe(body.email) || safe(body.sender_email) || "-"}
제목: ${safe(body.title) || "-"}
내용:
${safe(body.content) || "-"}

category 값은 반드시 아래 중 하나:
FARMER, BUYER, VENDOR, OEM, EXPORT, IMPORT, HEALTH_FOOD, INSECT, MACHINERY, MEDIA, AGENCY, INVESTOR, ORDER_CS, ETC

business_area 값은 반드시 아래 중 하나:
K_AGRI_EXPO, KFFR, KOREAN_GARLIC, DOFF, KOREA_AGRO, YOUTUBE, OVERSEAS, GENERAL

priority 기준:
S = 대량거래, 바이어, 수출입, OEM, 투자, 입점 고가 문의
A = 입점, 광고, 공동구매, 구매 가능성 높은 문의
B = 일반 제품/상담 문의
C = 단순 질문 또는 불명확

estimated_value:
예상 거래금액을 원 단위 숫자로 추정. 모르면 0.

assigned_to:
대표, 입점팀, 바이어팀, KFFR, 농자재팀, 농기계팀, 고객센터, 미지정 중 하나.

반드시 JSON만 출력:
{
  "category": "BUYER",
  "business_area": "OVERSEAS",
  "ai_summary": "문의 핵심 한 줄",
  "ai_action": "다음에 해야 할 행동",
  "priority": "S",
  "estimated_value": 300000000,
  "assigned_to": "대표"
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

  if (!res.ok) return fallbackAnalyze(body);

  const outputText =
    data?.output_text ||
    data?.output?.[0]?.content?.[0]?.text ||
    "";

  try {
    const parsed = extractJson(outputText);

    return {
      category: safe(parsed.category) || "ETC",
      business_area: safe(parsed.business_area) || "GENERAL",
      ai_summary: safe(parsed.ai_summary),
      ai_action: safe(parsed.ai_action),
      priority: safe(parsed.priority) || "C",
      estimated_value: Number(parsed.estimated_value || 0),
      assigned_to: safe(parsed.assigned_to) || "미지정",
    };
  } catch {
    return fallbackAnalyze(body);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const limit = Math.min(Number(url.searchParams.get("limit") || 500), 1000);
    const category = safe(url.searchParams.get("category"));
    const priority = safe(url.searchParams.get("priority"));
    const businessArea = safe(url.searchParams.get("business_area"));
    const status = safe(url.searchParams.get("status"));
    const channel = safe(url.searchParams.get("channel"));
    const sourceType = safe(url.searchParams.get("source_type"));

    let query = supabase
      .from("crm_inbox")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (priority) query = query.eq("priority", priority);
    if (businessArea) query = query.eq("business_area", businessArea);
    if (status) query = query.eq("status", status);
    if (channel) query = query.eq("channel", channel);
    if (sourceType) query = query.eq("source_type", sourceType);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, rows: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rows: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "조회 실패",
        rows: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const content = safe(body.content);
    const title = safe(body.title);

    if (!content && !title) {
      return NextResponse.json(
        { success: false, error: "문의 제목 또는 내용이 필요합니다." },
        { status: 400 }
      );
    }

    const useAi = body.use_ai !== false;
    const ai = useAi ? await analyzeLead(body) : fallbackAnalyze(body);

    const senderEmail = safe(body.sender_email) || safe(body.email);
    const senderName = safe(body.sender_name) || safe(body.contact_name);

    const row = {
      channel: safe(body.channel) || "manual",
      category: ai.category,
      business_area: ai.business_area,

      contact_name: safe(body.contact_name) || senderName,
      company_name: safe(body.company_name),

      phone: phoneOnly(body.phone),
      email: safe(body.email) || senderEmail,

      title,
      content,

      ai_summary: ai.ai_summary,
      ai_action: ai.ai_action,
      priority: ai.priority,
      estimated_value: Number(ai.estimated_value || 0),

      status: safe(body.status || "new"),
      assigned_to: ai.assigned_to,

      source_file_url: safe(body.source_file_url),

      sender_email: senderEmail,
      sender_name: senderName,
      raw_email: safe(body.raw_email) || content,
      source_type: safe(body.source_type || "manual"),
      source_message_id: safe(body.source_message_id),
      attachment_urls: asArray(body.attachment_urls),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("crm_inbox")
      .insert(row)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      row: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "저장 실패",
      },
      { status: 500 }
    );
  }
}