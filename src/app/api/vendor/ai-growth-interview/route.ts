import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GrowthFile = {
  id: string;
  product_id: string;
  file_type: string;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
};

type OpenAiOutputItem = {
  content?: Array<{
    text?: string;
  }>;
};

type OpenAiResponseJson = {
  output_text?: string;
  output?: OpenAiOutputItem[];
  error?: {
    message?: string;
  };
};

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function cleanBool(v: unknown) {
  return v === true;
}

function cleanUrlList(v: unknown) {
  if (Array.isArray(v)) {
    return v.map((item) => cleanText(item)).filter(Boolean);
  }

  return String(v || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isImageFile(file: GrowthFile) {
  const mime = String(file.mime_type || "").toLowerCase();
  const url = String(file.file_url || "").toLowerCase();
  const name = String(file.file_name || "").toLowerCase();

  return (
    mime.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp", ".gif"].some(
      (ext) => url.includes(ext) || name.endsWith(ext),
    )
  );
}

function isSupportedInputFile(file: GrowthFile) {
  const mime = String(file.mime_type || "").toLowerCase();
  const url = String(file.file_url || "").toLowerCase();
  const name = String(file.file_name || "").toLowerCase();

  return (
    mime.includes("pdf") ||
    name.endsWith(".pdf") ||
    url.includes(".pdf") ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("powerpoint") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".txt") ||
    name.endsWith(".csv")
  );
}

function fileTypeLabel(type: string) {
  switch (type) {
    case "label":
      return "제품 라벨/사진";
    case "catalog":
      return "제품 카탈로그";
    case "organic_cert":
      return "유기농 공시자료/등록허가 자료";
    case "test_report":
      return "시험성적서/실험결과";
    case "before_after":
      return "전후사진/사용후기";
    case "patent":
      return "특허자료";
    default:
      return "기타자료";
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callOpenAiForFirstAnalysis({
  product,
  files,
  youtubeUrls,
}: {
  product: {
    id: string;
    product_name?: string | null;
    category?: string | null;
    short_description?: string | null;
  };
  files: GrowthFile[];
  youtubeUrls: string[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const fileInputs = files
    .filter((file) => file.file_url)
    .map((file) => {
      if (isImageFile(file)) {
        return {
          type: "input_image",
          image_url: file.file_url,
        };
      }

      if (isSupportedInputFile(file)) {
        return {
          type: "input_file",
          file_url: file.file_url,
        };
      }

      return {
        type: "input_text",
        text: `[첨부파일: ${fileTypeLabel(file.file_type)}] ${
          file.file_name || "파일명 없음"
        } ${file.file_url}`,
      };
    });

  const fileSummary = files
    .map(
      (file, index) =>
        `${index + 1}. ${fileTypeLabel(file.file_type)} / ${
          file.file_name || "파일명 없음"
        } / ${file.mime_type || "mime 없음"} / ${file.file_url}`,
    )
    .join("\n");

  const prompt = `
너는 한국농수산TV와 K-Agri Expo의 농자재 제품 성장진단 컨설턴트다.

절대 원칙:
- 파일 개수만 보고 판단하지 마라.
- 업로드된 카탈로그, 이미지, PDF, 시험자료, 전후사진의 실제 내용을 읽고 판단하라.
- 카탈로그 안에 시험사례, 균 실험, 적용병해표, 사용량표, 공시번호, 전후사진, 처리구/무처리구 비교가 들어 있으면 반드시 근거로 인정하라.
- 단, "공식 시험성적서 원본"과 "카탈로그 내 시험사례"는 구분해서 표현하라.
- 유튜브 링크는 영상 URL 존재 여부와 제목/URL 기반 보조자료로 반영하되, 영상 내용을 직접 볼 수 없으면 "영상 내용 직접 판독은 제한적"이라고 써라.
- 결과는 반드시 JSON으로만 반환하라.

고함량 성분 판단 원칙:
- 제품 자료에서 원료 함량, 유효성분 함량, 보증성분, 배합비, N-P-K, CaO, MgO, TE, 아미노산, 해조추출물, 폴리인산, 칼슘, 탄산칼슘, 미량요소 같은 수치가 확인되면 반드시 "고함량 성분 강점"으로 추출하라.
- "국내 최고", "최고 함량", "100%", "65%", "50% 이상", "72%", "40%", "23% 이상" 같은 표현은 제품 차별화 근거로 인정하라.
- 아미65처럼 아미노산 65% 함량이 확인되면 "고함량 아미노산 제품"이라는 점을 반드시 강점으로 인정하라.
- 블로킹-칼처럼 탄산칼슘 72%가 확인되면 "고함량 탄산칼슘 기반 일소 방지제"로 인정하라.
- 씨에스타처럼 해조추출물 50% 이상이 확인되면 "고함량 해조추출물 기반 스트레스 회복·생육 탄력 소구"로 인정하라.
- 도프 파워폴리인산처럼 폴리인산 100%가 확인되면 "고함량 폴리인산 기반 인산 이용성 소구"로 인정하라.
- 하이 CaO 23처럼 칼슘 23% 이상이 확인되면 "고함량 액상 칼슘제"로 인정하라.
- 메가파워칼 40처럼 칼슘 40%가 확인되면 "고함량 분말 칼슘제"로 인정하라.
- 시험성적서가 없다는 이유만으로 고함량 성분 강점을 낮게 평가하지 마라.
- 반드시 "함량 강점"과 "효능 실증자료 보완 필요성"을 분리해서 판단하라.
- 예: "아미노산 65% 고함량은 강한 제품 차별점이다. 다만 작물별 실증자료가 추가되면 구매 설득력이 더 강해진다."

농민 구매 소구점 판단 원칙:
- 농민은 추상적 설명보다 "함량", "적용 작물", "사용 시기", "사용량", "전후사진", "무처리구 비교", "농가 사례"에 반응한다.
- 고함량 제품은 "적은 양으로도 공급 효율 기대", "기능성 성분이 명확함", "경쟁제품 대비 설명이 쉬움"을 소구점으로 반영하라.
- 병해관리 제품은 균 실험, 방제 사례, 처리 전후 사진, 적용병해표를 중요 근거로 반영하라.
- 영양제 제품은 함량, 흡수성, 생육단계별 사용 목적, 작물별 사용량을 중요 근거로 반영하라.

점수 기준:
- material_score: 자료 자체의 충실도. 카탈로그 안에 사용량표·성분표·실험사례·전후사진이 있으면 높게 평가하라.
- trust_score: 제품 신뢰도. 공시번호, 등록자료, 시험사례, 균 실험, 무처리구 비교, 전후사진, 성분 함량이 있으면 높게 평가하라.
- farmer_purchase_score: 농민 구매 설득력. 고함량, 사용법 명확성, 작물별 적용성, 실제 사례, 한국농수산TV 영상화 가능성이 있으면 높게 평가하라.

제품 정보:
- 제품명: ${product.product_name || "제품명 없음"}
- 카테고리: ${product.category || "카테고리 없음"}
- 설명: ${product.short_description || "설명 없음"}

업로드 파일 목록:
${fileSummary || "파일 없음"}

유튜브 링크:
${youtubeUrls.length ? youtubeUrls.join("\n") : "없음"}

반환 JSON 형식:
{
  "summary": "제품 자료를 실제로 읽고 요약한 3~5문장",
  "material_score": 0,
  "trust_score": 0,
  "farmer_purchase_score": 0,
  "ingredient_strengths": [
    {
      "title": "확인된 고함량 성분 또는 원료 강점",
      "detail": "자료에서 확인한 함량 수치와 농민 소구점",
      "source_type": "catalog | label | organic_cert | test_report | before_after | youtube | other"
    }
  ],
  "evidence_found": [
    {
      "title": "확인된 근거 제목",
      "detail": "파일 안에서 확인한 구체 내용",
      "source_type": "catalog | label | organic_cert | test_report | before_after | youtube | other"
    }
  ],
  "missing_evidence": [
    {
      "title": "부족하거나 추가 확인할 자료",
      "reason": "왜 필요한지"
    }
  ],
  "farmer_selling_points": [
    "농민이 살 수밖에 없는 소구점"
  ],
  "recommended_questions": [
    "2차 질문으로 물어볼 내용"
  ],
  "kafs_tv_strategy": [
    "한국농수산TV 영상, 공동구매, 상담, 실증 연결 제안"
  ],
  "final_comment": "업체가 이해할 수 있는 한 문단 조언"
}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AI_GROWTH_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            ...fileInputs,
          ],
        },
      ],
      temperature: 0.2,
    }),
  });

  const json = (await response.json()) as OpenAiResponseJson;

  if (!response.ok) {
    throw new Error(json.error?.message || "OpenAI 분석 요청 실패");
  }

  const outputText =
    json.output_text ||
    json.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n") ||
    "";

  const parsed = safeJsonParse(outputText);

  if (!parsed) {
    throw new Error("AI 분석 결과 JSON 파싱 실패");
  }

  return parsed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = cleanText(body.product_id);
    const step = cleanText(body.step);
    const youtubeUrls = cleanUrlList(body.youtube_urls);

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "product_id가 없습니다." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: product, error: productError } = await supabase
      .from("expo_brand_products")
      .select("id, product_name, category, short_description, brand_id")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        { ok: false, error: productError.message },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "제품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const { data: files, error: filesError } = await supabase
      .from("expo_product_growth_files")
      .select("id, product_id, file_type, file_url, file_name, mime_type, file_size")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (filesError) {
      return NextResponse.json(
        { ok: false, error: filesError.message },
        { status: 500 },
      );
    }

    const growthFiles = (files || []) as GrowthFile[];

    if (step === "first_analysis") {
      if (growthFiles.length === 0 && youtubeUrls.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "분석할 업로드 자료나 유튜브 링크가 없습니다.",
          },
          { status: 400 },
        );
      }

      const analysis = await callOpenAiForFirstAnalysis({
        product,
        files: growthFiles,
        youtubeUrls,
      });

      return NextResponse.json({
        ok: true,
        mode: "first_analysis",
        analysis,
      });
    }

    const farmerProblem = cleanText(body.farmer_problem);
    const competitorAdvantage = cleanText(body.competitor_advantage);
    const successCase = cleanText(body.success_case);
    const weakPoint = cleanText(body.weak_point);

    const hasBeforeAfter =
      cleanBool(body.has_before_after) ||
      growthFiles.some((file) => file.file_type === "before_after");

    const hasTestData =
      cleanBool(body.has_test_data) ||
      growthFiles.some((file) =>
        ["test_report", "organic_cert", "patent", "catalog"].includes(file.file_type),
      );

    const hasFarmerInterview = cleanBool(body.has_farmer_interview);

    const evidenceCount = [
      growthFiles.length > 0 ? "files" : "",
      youtubeUrls.length > 0 ? "youtube" : "",
      farmerProblem,
      competitorAdvantage,
      successCase,
    ].filter(Boolean).length;

    if (evidenceCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "제품 자료, 영상 또는 간단한 설명 중 하나 이상은 입력해야 합니다.",
        },
        { status: 400 },
      );
    }

    const payload = {
      product_id: productId,
      youtube_urls: youtubeUrls,
      farmer_problem: farmerProblem,
      competitor_advantage: competitorAdvantage,
      success_case: successCase,
      has_before_after: hasBeforeAfter,
      has_test_data: hasTestData,
      has_farmer_interview: hasFarmerInterview,
      weak_point: weakPoint,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await supabase
      .from("expo_product_growth_answers")
      .select("id")
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 },
      );
    }

    const query = existing?.id
      ? supabase
          .from("expo_product_growth_answers")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single()
      : supabase
          .from("expo_product_growth_answers")
          .insert(payload)
          .select()
          .single();

    const { data: item, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "save_interview",
      item,
    });
  } catch (error) {
    console.error("[ai-growth-interview] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 성장진단 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}