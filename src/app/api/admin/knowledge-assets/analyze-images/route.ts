import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end >= 0) return JSON.parse(cleaned.slice(start, end + 1));
  return JSON.parse(cleaned);
}

async function analyzeOneImage(params: {
  imageUrl: string;
  title: string;
  crop: string;
  slideNo: number;
}) {
  const imagePath = path.join(process.cwd(), "public", params.imageUrl.replace(/^\//, ""));
  const buffer = await fs.readFile(imagePath);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  const prompt = `
너는 K-AGRI 농업 두뇌센터의 농업 이미지 분석가다.

이 이미지는 농업 강의자료, 병해충 사진, 표, 그래프, 재배력, 농약표, 생육장해 사진 중 하나다.

반드시 JSON 객체만 출력하라.

{
  "crop": "작물명. 모르면 공통",
  "disease_name": "병해충명 또는 생리장해명. 없으면 없음",
  "symptom_name": "사진/표에서 보이는 핵심 증상",
  "visual_type": "병해충사진 | 생리장해사진 | 농약표 | 재배표 | 그래프 | 일반슬라이드",
  "description": "이 이미지가 보여주는 상태를 2문장으로 설명",
  "content_use": "이 이미지를 언제 어떤 콘텐츠로 써야 하는지. 예: 6월 고추 탄저병 경고 쇼츠, 장마 전 예방살포 카드뉴스",
  "action_instruction": "농민에게 줄 실제 행동지시 1문장",
  "tags": ["태그1","태그2","태그3"],
  "confidence_score": 0.0
}

자료명: ${params.title}
기본작물: ${params.crop}
슬라이드번호: ${params.slideNo}
`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || "이미지 AI 분석 실패");
  }

  const text = json.output_text || json.output?.[0]?.content?.[0]?.text || "";
  if (!text.trim()) throw new Error("이미지 AI 응답이 비어 있습니다.");

  return safeJson(text);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const title = String(body.title || "자료 이미지").trim();
    const crop = String(body.crop || "").trim();
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
    const limit = Math.min(Number(body.limit || 30), 50);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY가 없습니다." }, { status: 500 });
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "분석할 이미지가 없습니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const results: any[] = [];
    const imageRows: any[] = [];
    const topicRows: any[] = [];

    for (let i = 0; i < Math.min(imageUrls.length, limit); i++) {
      const imageUrl = String(imageUrls[i] || "");
      if (!imageUrl) continue;

      const slideNo = i + 1;
      const result = await analyzeOneImage({
        imageUrl,
        title,
        crop,
        slideNo,
      });

      const cropName = String(result.crop || crop || "공통");
      const diseaseName = String(result.disease_name || "없음");
      const symptomName = String(result.symptom_name || "");
      const description = String(result.description || "");
      const contentUse = String(result.content_use || "");
      const actionInstruction = String(result.action_instruction || "");
      const tags = Array.isArray(result.tags) ? result.tags.map(String) : [];
      const confidence = Number(result.confidence_score || 0.7);

      imageRows.push({
        crop: cropName,
        disease_name: diseaseName,
        symptom_name: symptomName,
        image_url: imageUrl,
        source_slide: slideNo,
        description: `${description}\n\n콘텐츠 활용: ${contentUse}\n행동지시: ${actionInstruction}`,
        tags,
        confidence_score: confidence,
      });

      if (diseaseName && diseaseName !== "없음") {
        topicRows.push({
          crop: cropName,
          topic: diseaseName,
          category: String(result.visual_type || "이미지분석"),
          content_score: confidence * 100,
          youtube_title: `${cropName} ${diseaseName}, 지금 확인해야 합니다`,
          shorts_title: `${cropName} ${diseaseName} 놓치면 피해 커집니다`,
          news_title: `${cropName} ${diseaseName} 주의보`,
        });
      }

      results.push({
        imageUrl,
        slideNo,
        ...result,
      });
    }

    if (imageRows.length > 0) {
      const { error } = await supabase.from("knowledge_images").insert(imageRows);
      if (error) throw new Error(`knowledge_images 저장 실패: ${error.message}`);
    }

    if (topicRows.length > 0) {
      const { error } = await supabase.from("knowledge_topics").insert(topicRows);
      if (error) throw new Error(`knowledge_topics 저장 실패: ${error.message}`);
    }

    return NextResponse.json({
      ok: true,
      analyzed: results.length,
      image_saved: imageRows.length,
      topic_saved: topicRows.length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "이미지 분석 실패" },
      { status: 500 }
    );
  }
}
