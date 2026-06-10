import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasText(v: unknown) {
  return String(v || "").trim().length > 0;
}

function hasArray(v: unknown) {
  return Array.isArray(v) && v.length > 0;
}

function add(value: boolean, point: number) {
  return value ? point : 0;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body.product_id || "").trim();

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "product_id가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: product, error: productError } = await supabase
      .from("expo_brand_products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        { ok: false, error: productError.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "제품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: growth, error: growthError } = await supabase
      .from("expo_product_growth_answers")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (growthError) {
      return NextResponse.json(
        { ok: false, error: growthError.message },
        { status: 500 }
      );
    }

    if (!growth) {
      return NextResponse.json(
        { ok: false, error: "AI 제품 성장진단 자료가 없습니다." },
        { status: 404 }
      );
    }

    const hasProductLabel = hasText(growth.product_label_url);
    const hasCatalog = hasText(growth.catalog_url) || hasText(product.catalog_url);
    const hasOrganicCert = hasText(growth.organic_cert_url);
    const hasTestReport = hasText(growth.test_report_url);
    const hasPatent = hasText(growth.patent_url);
    const hasBeforeAfter = Boolean(growth.has_before_after) || hasText(growth.before_after_url);
    const hasFarmerInterview = Boolean(growth.has_farmer_interview);
    const hasYoutube = hasArray(growth.youtube_urls);

    const hasFarmerProblem = hasText(growth.farmer_problem);
    const hasCompetitorAdvantage = hasText(growth.competitor_advantage);
    const hasSuccessCase = hasText(growth.success_case);
    const hasWeakPoint = hasText(growth.weak_point);

    const documentScore = clamp(
      add(hasProductLabel, 8) +
        add(hasCatalog, 12) +
        add(hasOrganicCert, 10) +
        add(hasTestReport, 15) +
        add(hasPatent, 5)
    );

    const evidenceScore = clamp(
      add(hasBeforeAfter, 25) +
        add(hasTestReport, 25) +
        add(hasFarmerInterview, 20) +
        add(hasSuccessCase, 20) +
        add(hasOrganicCert, 10)
    );

    const marketingScore = clamp(
      add(hasYoutube, 15) +
        add(hasFarmerProblem, 20) +
        add(hasCompetitorAdvantage, 20) +
        add(hasSuccessCase, 15) +
        add(hasWeakPoint, 10)
    );

    const promotionScore = clamp(
      add(hasYoutube, 20) +
        add(hasFarmerInterview, 20) +
        add(hasBeforeAfter, 20) +
        add(hasSuccessCase, 20)
    );

    const totalScore = clamp(
      documentScore * 0.25 +
        evidenceScore * 0.3 +
        marketingScore * 0.25 +
        promotionScore * 0.2
    );

    let grade = "D";
    if (totalScore >= 90) grade = "S";
    else if (totalScore >= 80) grade = "A";
    else if (totalScore >= 70) grade = "B";
    else if (totalScore >= 60) grade = "C";

    const weakPoints: string[] = [];

    if (!hasCatalog) weakPoints.push("제품 카탈로그 부족");
    if (!hasProductLabel) weakPoints.push("제품 라벨·제품 사진 부족");
    if (!hasOrganicCert) weakPoints.push("공시·등록허가 자료 부족");
    if (!hasTestReport) weakPoints.push("시험성적서·실험결과 부족");
    if (!hasBeforeAfter) weakPoints.push("전후사진 부족");
    if (!hasFarmerInterview) weakPoints.push("사용농가 인터뷰·후기 부족");
    if (!hasYoutube) weakPoints.push("홍보영상·사용영상 부족");
    if (!hasCompetitorAdvantage) weakPoints.push("경쟁제품 대비 차별점 부족");

    const recommendations: string[] = [];

    if (!hasCatalog || !hasProductLabel) {
      recommendations.push("제품 라벨과 카탈로그를 먼저 보강해 AI 분석 정확도를 높이세요.");
    }

    if (!hasTestReport) {
      recommendations.push("수확량·당도·비대·병해 감소 등 시험성적서 또는 실험결과를 추가하세요.");
    }

    if (!hasBeforeAfter) {
      recommendations.push("실증농가 사용 전후사진을 확보하면 농민 신뢰도가 크게 올라갑니다.");
    }

    if (!hasFarmerInterview) {
      recommendations.push("실제 사용농가 후기나 인터뷰를 확보하세요.");
    }

    if (!hasYoutube) {
      recommendations.push("제품 소개영상, 사용법 영상, 농가 사용영상을 유튜브 링크로 연결하세요.");
      recommendations.push("영상자료가 없으면 한국농수산TV 콘텐츠 제작 상담을 검토하세요.");
    }

    recommendations.push("샘플 제공 의향이 있다면 협력농가 실증부터 시작하는 것이 좋습니다.");
    recommendations.push("자료가 보강되면 공동구매 및 한국농수산TV 연계 가능성이 높아집니다.");

    const growthActions = [
      {
        title: "제품 라벨·카탈로그 보강",
        point: "+10점",
        desc: "제품의 기본 신뢰도를 올리는 첫 단계입니다.",
      },
      {
        title: "시험성적서·실험결과 추가",
        point: "+15점",
        desc: "업체 주장보다 객관 자료가 농민 설득에 더 강합니다.",
      },
      {
        title: "전후사진·농가후기 확보",
        point: "+20점",
        desc: "농민이 실제로 믿는 가장 강력한 증거입니다.",
      },
      {
        title: "홍보영상·사용영상 연결",
        point: "+15점",
        desc: "제품을 이해시키고 구매 결정을 앞당깁니다.",
      },
      {
        title: "한국농수산TV 콘텐츠 상담",
        point: "+20점",
        desc: "단순 광고가 아니라 실증 콘텐츠와 공동구매로 연결할 수 있습니다.",
      },
      {
        title: "홍산마늘 연구회장 이성준 검증",
        point: "+25점",
        desc: "마늘·밭작물 중심 제품의 현장 신뢰도를 높일 수 있습니다.",
      },
      {
        title: "슈퍼농부 이승민 검증",
        point: "+30점",
        desc: "농민 영향력이 큰 실증 콘텐츠로 강한 신뢰를 만들 수 있습니다.",
      },
    ];

    const report = {
      product_id: product.id,
      product_name: product.product_name,

      total_score: totalScore,
      grade,

      document_score: documentScore,
      evidence_score: evidenceScore,
      marketing_score: marketingScore,
      promotion_score: promotionScore,

      product_power_score: clamp(documentScore * 0.5 + evidenceScore * 0.5),
      farmer_empathy_score: clamp(marketingScore),
      content_power_score: clamp(promotionScore),

      weak_points: weakPoints,
      recommendations,
      growth_actions: growthActions,

      ai_summary: `
현재 제품 성장등급은 ${grade}등급, 성장점수는 ${totalScore}점입니다.

제품 자체를 설명할 자료는 ${documentScore}점 수준이고,
농민이 믿을 수 있는 실증·후기·전후사진 등 증거력은 ${evidenceScore}점입니다.

현재 가장 큰 보완점은
${weakPoints.slice(0, 4).join(", ") || "큰 부족 항목 없음"} 입니다.

이 제품은 단순히 제품 설명을 늘리는 것보다
농민이 믿을 수 있는 증거자료와 사용영상, 실증사례를 확보할 때 성장 가능성이 커집니다.

특히 홍보영상이 부족한 경우 한국농수산TV 콘텐츠 제작,
전후사진이 부족한 경우 협력농가 실증,
사용후기가 부족한 경우 샘플 제공 후 후기 회수가 필요합니다.
      `.trim(),
    };

    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (error) {
    console.error("[ai-growth-report] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 성장보고서 생성 실패",
      },
      { status: 500 }
    );
  }
}