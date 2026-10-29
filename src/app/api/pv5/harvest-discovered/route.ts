import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("JSON 응답을 찾지 못했습니다.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function analyzeVideo(row: any) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY가 없습니다.");

  const prompt = `
너는 대한민국 최고의 PV5 유튜브 실자료 채굴 분석가다.

목표:
유튜브 제목/설명/조회수/채널 정보에서 실제 PV5 사업 데이터만 추출한다.

절대 규칙:
- 추정 금지
- 제목/설명에 실제 나온 것만 confirmed로 기록
- 가격은 실제 나온 금액만 숫자로 기록
- 업체명, 주소, 연락처가 나오면 반드시 추출
- 제품/옵션/패키지/차량종류/고객유형/공간구조를 분리한다
- 안 나온 정보는 빈 문자열 또는 빈 배열
- 반드시 JSON만 출력한다

영상 URL:
${row.video_url}

제목:
${row.title || "-"}

채널:
${row.channel || "-"}

조회수:
${row.view_count || 0}

업로드일:
${row.published_at || "-"}

설명:
${row.description || "-"}

반드시 아래 JSON 형식으로 출력하라.

{
  "summary": "",
  "builder": {
    "name": "",
    "location": "",
    "contact": "",
    "source_confirmed": true
  },
  "vehicle": {
    "model": "",
    "type": "Cargo | Passenger | Unknown",
    "confirmed_features": []
  },
  "main_category": "",
  "sub_category": "",
  "confirmed_costs": [
    {
      "item": "",
      "price_krw": 0,
      "included": "",
      "source": "title | description"
    }
  ],
  "products": [
    {
      "name": "",
      "category": "",
      "brand": "",
      "price_krw": 0,
      "confirmed": true
    }
  ],
  "space_layout": [
    {
      "zone": "front | middle | rear | side | roof | outside",
      "element": "",
      "purpose": "",
      "confirmed": true
    }
  ],
  "electrical": [],
  "furniture": [],
  "human_activity": [],
  "target_customer": [
    {
      "type": "",
      "fit_score": 0,
      "reason": ""
    }
  ],
  "design_rules": [
    {
      "rule": "",
      "reason": ""
    }
  ],
  "cost_meaning": "",
  "writer_room_notes": "",
  "business_notes": "",
  "developer_notes": "",
  "content_notes": "",
  "warnings": []
}
`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        process.env.OPENAI_PV5_ANALYSIS_MODEL ||
        process.env.OPENAI_CRM_MODEL ||
        "gpt-4.1-mini",
      input: prompt,
      store: false,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "OpenAI 분석 실패");
  }

  const outputText =
    data?.output_text ||
    data?.output?.[0]?.content?.[0]?.text ||
    "";

  return extractJson(outputText);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Number(body.limit || 20);

    const { data: rows, error } = await supabase
      .from("pv5_youtube_discovery")
      .select("*")
      .eq("status", "discovered")
      .order("evidence_score", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const results: any[] = [];

    for (const row of rows || []) {
      try {
        const parsed = await analyzeVideo(row);

        const insertPayload = {
          video_url: row.video_url,
          video_title: row.title,
          source_channel: row.channel,

          builder_name: safe(parsed.builder?.name),
          builder_region: safe(parsed.builder?.location),
          builder_contact: safe(parsed.builder?.contact),

          vehicle_type: safe(parsed.vehicle?.type),
          vehicle_model: safe(parsed.vehicle?.model),

          main_category: safe(parsed.main_category),
          sub_category: safe(parsed.sub_category),

          summary: safe(parsed.summary),
          target_customer: JSON.stringify(parsed.target_customer || []),

          confirmed_costs: parsed.confirmed_costs || [],
          products: parsed.products || [],
          space_layout: parsed.space_layout || [],
          electrical: parsed.electrical || [],
          furniture: parsed.furniture || [],
          human_activity: parsed.human_activity || [],
          design_rules: parsed.design_rules || [],

          cost_meaning: safe(parsed.cost_meaning),
          writer_room_notes: safe(parsed.writer_room_notes),
          business_notes: safe(parsed.business_notes),
          developer_notes: safe(parsed.developer_notes),
          content_notes: safe(parsed.content_notes),

          transcript: "",
          raw_analysis: {
            discovery: row,
            analysis: parsed,
          },

          status: "draft",
        };

        const saved = await supabase
          .from("pv5_video_analysis")
          .insert(insertPayload)
          .select("id")
          .single();

        if (saved.error) throw new Error(saved.error.message);

        await supabase
          .from("pv5_youtube_discovery")
          .update({ status: "analyzed", updated_at: new Date().toISOString() })
          .eq("id", row.id);

        results.push({
          video_id: row.video_id,
          url: row.video_url,
          title: row.title,
          saved: true,
          analysis_id: saved.data?.id,
          summary: parsed.summary,
        });
      } catch (e: any) {
        await supabase
          .from("pv5_youtube_discovery")
          .update({
            status: "error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        results.push({
          video_id: row.video_id,
          url: row.video_url,
          title: row.title,
          saved: false,
          error: e?.message || "분석 실패",
        });
      }
    }

    return NextResponse.json({
      success: true,
      requested: limit,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Harvest 실패" },
      { status: 500 }
    );
  }
}
