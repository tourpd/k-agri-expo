import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  analyzeConsultText,
  recommendFromDb,
} from "@/lib/expo/consult-recommender";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculateLeadScore(payload: {
  consult_text: string;
  source_channel?: string;
}) {
  let score = 10;

  if (payload.source_channel === "ai_consult") score += 20;

  const text = payload.consult_text || "";

  if (text.length >= 10) score += 5;
  if (text.includes("총채") || text.includes("노균") || text.includes("비대")) score += 10;
  if (text.includes("평")) score += 5;
  if (text.includes("노지") || text.includes("시설") || text.includes("하우스")) score += 5;

  return score;
}

function calculatePriority(score: number) {
  if (score >= 60) return "VERY_HOT";
  if (score >= 40) return "HOT";
  if (score >= 20) return "WARM";
  return "LOW";
}

function buildSafeConsultInsertPayload(input: {
  consultText: string;
  audienceType: string;
  sourceChannel: string;
  clickedCta: string;
  inflowPage: string;
  analysis: ReturnType<typeof analyzeConsultText>;
  recommendedBooths: any[];
  recommendedProducts: any[];
  recommendedDeals: any[];
  leadScore: number;
  priorityRank: string;
}) {
  const {
    consultText,
    audienceType,
    sourceChannel,
    clickedCta,
    inflowPage,
    analysis,
    recommendedBooths,
    recommendedProducts,
    recommendedDeals,
    leadScore,
    priorityRank,
  } = input;

  return {
    consult_text: consultText,
    audience_type: audienceType,
    source_channel: sourceChannel,
    clicked_cta: clickedCta,
    inflow_page: inflowPage,

    crop_key: analysis.cropKey,
    issue_key: analysis.issueKey,
    interest_topic: analysis.issueTopic,

    recommended_booths: recommendedBooths,
    recommended_products: recommendedProducts,
    recommended_deals: recommendedDeals,

    lead_score: leadScore,
    priority_rank: priorityRank,
    status: "new",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const consultText = String(body.consult_text ?? "").trim();
    const audienceType =
      String(body.audience_type ?? "farmer").trim() || "farmer";
    const sourceChannel =
      String(body.source_channel ?? "ai_consult").trim() || "ai_consult";
    const clickedCta =
      String(body.clicked_cta ?? "상담 시작").trim() || "상담 시작";
    const inflowPage = String(body.inflow_page ?? "/expo").trim() || "/expo";

    if (!consultText) {
      return NextResponse.json(
        { ok: false, error: "상담 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const analysis = analyzeConsultText(consultText);

    let recommendedBooths: any[] = [];
    let recommendedProducts: any[] = [];
    let recommendedDeals: any[] = [];
    let recommendationError: string | null = null;

    try {
      const recommended = await recommendFromDb(analysis);
      recommendedBooths = recommended.booths ?? [];
      recommendedProducts = recommended.products ?? [];
      recommendedDeals = recommended.deals ?? [];
    } catch (e) {
      recommendationError =
        e instanceof Error ? e.message : "추천 엔진 오류가 발생했습니다.";

      recommendedBooths = [
        {
          booth_key: "fallback",
          booth_name: "한국농수산TV 추천 부스",
          booth_url: "/expo/booths",
          reason: "추천 엔진 오류로 기본 추천을 표시합니다.",
          score: 1,
        },
      ];

      recommendedProducts = [
        {
          product_name: "추천 제품 모아보기",
          product_url: "/expo/consult",
          reason: "추천 엔진 오류로 기본 추천을 표시합니다.",
          score: 1,
        },
      ];

      recommendedDeals = [
        {
          deal_id: "fallback",
          deal_title: "진행 중 특가 보기",
          deal_url: "/expo/deals",
          reason: "추천 엔진 오류로 기본 추천을 표시합니다.",
          score: 1,
        },
      ];
    }

    const leadScore = calculateLeadScore({
      consult_text: consultText,
      source_channel: sourceChannel,
    });

    const priorityRank = calculatePriority(leadScore);

    const insertPayload = buildSafeConsultInsertPayload({
      consultText,
      audienceType,
      sourceChannel,
      clickedCta,
      inflowPage,
      analysis,
      recommendedBooths,
      recommendedProducts,
      recommendedDeals,
      leadScore,
      priorityRank,
    });

    const { data, error } = await supabaseAdmin
      .from("ai_consult_leads")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          debug: {
            recommendationError,
            insertPayload,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      lead: data,
      analysis,
      recommended_booths: recommendedBooths,
      recommended_products: recommendedProducts,
      recommended_deals: recommendedDeals,
      recommendation_error: recommendationError,
      message: "상담 요청이 저장되었습니다.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}