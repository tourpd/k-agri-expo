import { NextResponse } from "next/server";
import {
  classifyIndustry,
  industryGroupLabels,
} from "@/lib/ai-sales/industry-classifier";
import { getIndustryPrompt } from "@/lib/ai-sales/industry-prompts";
import { selectCreativeConcepts } from "@/lib/ai-sales/creative-engine/concept-selector";
import { mixCreativeConcepts } from "@/lib/ai-sales/creative-engine/creative-mixer";
import { recommendCreativeDirection } from "@/lib/ai-sales/creative-engine/concept-recommender";
import { recommendTrends } from "@/lib/ai-sales/trend-engine/trend-engine";
import { analyzeProduct } from "@/lib/ai-sales/product-engine/product-analyzer";
import { inferCustomerProfile } from "@/lib/ai-sales/customer-engine/customer-analyzer";
import { buildContentOutputPrompt } from "@/lib/ai-sales/content-engine/content-generator";
import { predictCrmTags } from "@/lib/ai-sales/crm-engine/crm-predictor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  productId?: string;
  productName?: string;
  companyName?: string;
  industry?: string;
  imageAnalysis?: string;
  pdfAnalysis?: string;
  youtubeAnalysis?: string;
  youtubeUrls?: string;
  aiProductAnalysis?: string;
  notes?: string;
  customConcept?: string;
};

const industryLabels: Record<string, string> = {
  agriculture: "농자재",
  produce: "농산물",
  processed: "가공식품",
  fishery: "수산물",
  health: "건강기능식품",
  futurefood: "미래식량",
  healing: "치유농업",
  education: "교육상품",
  machinery: "농기계",
  smartfarm: "스마트농업",
  seed: "종자·묘종·묘목",
  dryer: "건조기·저장설비",
  solar: "태양광·에너지",
  facility: "시설자재",
  livestock: "축산자재",
  aquaculture: "양식·수산기자재",
  flower: "화훼·꽃",
  landscape: "조경·정원",
  forestry: "산림·임업",
  beekeeping: "양봉",
  compost: "퇴비·상토·토양개량",
  packaging: "포장재·유통자재",
  drone: "농업드론",
  irrigation: "관수·양액·물관리",
  coldchain: "저장·선별·포장·콜드체인",
  farmtour: "농촌체험·관광",
  unknown: "미분류",
};

function safeTrim(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v.trim() : "";
  return s || fallback;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const industry = safeTrim(body.industry, "unknown");
    const notes = safeTrim(body.notes, "");
    const customConcept = safeTrim(body.customConcept, "");
    const youtubeUrls = safeTrim(body.youtubeUrls, "");
    const youtubeAnalysis = safeTrim(
      body.youtubeAnalysis || body.youtubeUrls,
      "유튜브 분석 없음"
    );

    const rawProductName = safeTrim(
      body.productName,
      notes || youtubeUrls || "제품명 미확인"
    );

    const companyName = safeTrim(body.companyName, "업체명 미확인");
    const imageAnalysis = safeTrim(body.imageAnalysis, "제품사진 분석 없음");
    const pdfAnalysis = safeTrim(body.pdfAnalysis, "PDF 분석 없음");
    const aiProductAnalysis = safeTrim(
      body.aiProductAnalysis,
      "제품 기본 분석 없음"
    );

    const product = analyzeProduct({
      productName: rawProductName,
      companyName,
      industry,
      imageAnalysis,
      pdfAnalysis,
      youtubeAnalysis,
      notes,
    });

    const productName = product.productName;

    const industryGroup = classifyIndustry({
      industry,
      productName,
      imageAnalysis,
      pdfAnalysis,
      youtubeAnalysis,
      aiProductAnalysis,
      notes,
    });

    const industryLabel = industryLabels[industry] || industryLabels.unknown;
    const industryGroupLabel =
      industryGroupLabels[industryGroup] || "미분류";
    const industrySpecificPrompt = getIndustryPrompt(industryGroup);

    const creative = selectCreativeConcepts({
      industry: industryGroup,
      limit: 5,
    });

    const selectedConcepts = creative.recommended.map((item) => item.concept);
    const creativePrompt = mixCreativeConcepts(selectedConcepts);

    const creativeDirection = recommendCreativeDirection({
      industry: industryGroup,
      customConcept,
      limit: 5,
    });

    const trends = recommendTrends({
      industry: industryGroup,
      limit: 5,
    });

    const customer = inferCustomerProfile({
      industry: industryGroup,
      productText: [
        productName,
        imageAnalysis,
        pdfAnalysis,
        youtubeAnalysis,
        notes,
        customConcept,
      ].join("\n"),
    });

    const crmTags = predictCrmTags({
      industry: industryGroup,
      productName,
    });

    const contentPrompt = buildContentOutputPrompt(selectedConcepts);

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          result:
            "OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일에 OPENAI_API_KEY를 추가하십시오.",
        },
        { status: 500 }
      );
    }

    const trendPrompt = `

AI 추천 최신 트렌드/밈:

${trends.recommendedMemes

  .map((item, index) => `${index + 1}. ${item.label} - ${item.description}`)

  .join("\n")}

AI 추천 패러디 컨셉:

${trends.recommendedParodies

  .map(

    (item, index) =>

      `${index + 1}. ${item.label} - ${item.safeDescription}`

  )

  .join("\n")}
`;

    const prompt = `
당신은 한국농수산TV 전속 AI 크리에이티브 디렉터입니다.

목표는 단순 광고 문구 작성이 아닙니다.
제품사진, PDF, 유튜브, 메모, 사용자가 원하는 컨셉을 바탕으로
제품분석, 고객심리, 광고컨셉, 장르믹스, 패러디, 쇼츠, 상세페이지, 이미지 프롬프트, 영상 프롬프트, CRM까지 생성하십시오.

━━━━━━━━━━━━━━━━━━
입력 자료
━━━━━━━━━━━━━━━━━━

기존 선택 산업군:
${industryLabel}

AI 자동분류 산업군:
${industryGroupLabel}

제품명:
${productName}

업체명:
${companyName}

제품사진 분석:
${imageAnalysis}

PDF 분석:
${pdfAnalysis}

유튜브 링크/분석:
${youtubeAnalysis}

제품 기본 분석:
${aiProductAnalysis}

추가 메모:
${notes || "추가 메모 없음"}

사용자가 원하는 광고 컨셉:
${customConcept || "사용자 지정 컨셉 없음"}

━━━━━━━━━━━━━━━━━━
산업군별 전문 분석 지시
━━━━━━━━━━━━━━━━━━

${industrySpecificPrompt}

━━━━━━━━━━━━━━━━━━
고객 분석
━━━━━━━━━━━━━━━━━━

주요 고객:
${customer.primaryCustomer}

고객 고민:
${customer.painPoints.map((v) => `- ${v}`).join("\n")}

구매동기:
${customer.purchaseMotives.map((v) => `- ${v}`).join("\n")}

CRM 기본 태그:
${crmTags.map((v) => `- ${v}`).join("\n")}

━━━━━━━━━━━━━━━━━━
AI 추천 광고 컨셉
━━━━━━━━━━━━━━━━━━

${creative.recommended
  .map(
    (item, index) =>
      `${index + 1}. ${item.label} / ${item.score}점 / ${item.reason}`
  )
  .join("\n")}

${creativePrompt}

━━━━━━━━━━━━━━━━━━
사용자 요청 컨셉 해석 / 장르 믹스
━━━━━━━━━━━━━━━━━━

${creativeDirection.promptText}

━━━━━━━━━━━━━━━━━━
AI 추천 트렌드 / 패러디
━━━━━━━━━━━━━━━━━━

${trendPrompt}

━━━━━━━━━━━━━━━━━━
작성 규칙
━━━━━━━━━━━━━━━━━━

1. 제품 성격에 맞는 광고 톤을 선택하십시오.
2. 사용자가 원하는 컨셉이 있으면 반드시 반영하십시오.
3. 사용자가 원하는 컨셉이 위험하거나 특정 저작물을 직접 베끼는 방식이면, 분위기와 장르 문법만 안전하게 변형하십시오.
4. 농자재·병해충·공동구매는 공포, 옆집비교, 농촌 시트콤을 강하게 사용하십시오.
5. 농기계·시설·태양광·스마트팜은 전문가형, 비교실험형, 투자회수형, 다큐형을 우선하십시오.
6. 건강식품은 가족, 부모님, 건강관리, 후기, 감성 드라마형을 우선하십시오.
7. 농산물·수산물·가공식품은 프리미엄, 산지직송, 신선도, 선물, 라이브커머스를 우선하십시오.
8. 뮤직비디오 컨셉이 들어오면 노래 가사, 후렴, 장면 구성, Gemini/Veo 프롬프트까지 작성하십시오.
9. 최신 밈은 직접 유행명을 단정하지 말고 “쇼츠형 문법”으로 안전하게 변형하십시오.
10. AI 티 나는 표현, 기업 홍보자료 말투, 교과서식 설명은 금지합니다.
11. 제품명은 처음부터 외치지 말고, 문제와 상황을 먼저 보여준 뒤 자연스럽게 등장시키십시오.
12. CTA는 상담, 공동구매, 신청, 라이브방송, 재구매로 연결하십시오.

━━━━━━━━━━━━━━━━━━
농촌 시트콤이 선택된 경우 추가 규칙
━━━━━━━━━━━━━━━━━━

충청도 말투:
- 뭐여?
- 왜 그려?
- 뭐가 오른다는겨?
- 오늘까지여?
- 그게 진짜여?
- 또 돈 들어가네...
- 아이고 망했네...
- 그럼 나도 끼워줘유
- 말 안 들으니께 그렇쥬
- 개도 아는 걸 왜 몰랐대유
- 워쩐대유
- 그려유
- 했슈
- 아녀유

고정 캐릭터:
1) 투덜이 박씨
2) 이성준 회장
3) 영희 아줌마
4) 이장님
5) 몽몽이

좋은 리듬 예시:
이장님:
"오늘까지여~"

박씨:
"뭐가 오늘까진디유?"

이장님:
"내일부터 오른다니께~"

박씨:
"뭐가 오른다는겨유?"

이장님:
(제품 들며)
"이거."

박씨:
"아이고메!!"

박씨:
"그럼 나도 끼워줘유!!"

━━━━━━━━━━━━━━━━━━
출력 형식
━━━━━━━━━━━━━━━━━━

${contentPrompt}

반드시 아래 번호와 제목을 그대로 지키십시오.

1. 제품 한 줄 파악

2. 추천 광고 컨셉 TOP 5
- AI 추천 컨셉:
- 사용자 요청 컨셉 반영:
- 장르 믹스 제안:
- 피해야 할 컨셉:

3. 3초 후킹 20개

4. 쇼츠 5편

5. 광고 대본 5종
- 제품에 맞는 메인 컨셉형
- 공포·손해회피형
- 옆집 비교형 또는 비교실험형
- 전문가 설명형
- 현장 다큐형

6. 패러디/장르 믹스 광고 3종
- 사극/영화/예능/뉴스/뮤직비디오/홈쇼핑 중 적합한 장르로 변형
- 특정 작품 직접 복제 금지
- 분위기와 구조만 차용

7. 뮤직비디오형 콘텐츠
- 어울리는 음악 장르:
- 제목:
- 15초 가사:
- 후렴:
- 장면 구성:
- Gemini/Veo MV 프롬프트:

8. Gemini/Veo 영상 프롬프트 5개

9. 상세페이지 설계
- SECTION 01 HERO
- SECTION 02 문제 공감
- SECTION 03 비교
- SECTION 04 제품 신뢰
- SECTION 05 사용 장면
- SECTION 06 후기/증거
- SECTION 07 공동구매 CTA

10. 상세페이지 이미지 패키지 7장
- IMAGE_01_HERO
- IMAGE_02_PROBLEM
- IMAGE_03_COMPARE
- IMAGE_04_PRODUCT_TRUST
- IMAGE_05_USAGE
- IMAGE_06_REVIEW
- IMAGE_07_CTA

11. Gemini 상세페이지 이미지 프롬프트 7개
각 프롬프트는 최소 8줄 이상.
반드시 포함:
- 9:16 vertical
- 8K ultra realistic
- Korean rural field 또는 제품에 맞는 실제 사용 현장
- real farmer 또는 실제 고객
- cinematic commercial photography
- no text
- no watermark
- product placement natural

12. 배너 문구 10개

13. 문자 문구 6개

14. CRM 태그

15. 공동구매 전략

16. HTML 판매페이지 초안
Tailwind CSS 기준으로 작성.
실제 Next.js 페이지에 붙여넣기 쉬운 HTML 구조로 작성.

마지막 규칙:
- 적게 만들더라도 강하게 쓰십시오.
- 설명보다 장면.
- 보고서보다 광고.
- AI 말투 금지.
- 제품에 맞지 않는 억지 코믹 금지.
- 사용자 요청 컨셉을 무시하지 마십시오.
- 산업군에 맞는 컨셉을 우선하십시오.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "당신은 K-Agri Expo AI Creative OS입니다. 제품, 산업군, 사용자 요청 컨셉에 맞는 광고 컨셉을 추천하고, 쇼츠, 장르믹스, 패러디, 뮤직비디오, 상세페이지, 이미지 프롬프트, 영상 프롬프트, CRM까지 생성합니다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.82,
        max_tokens: 8000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);

      return NextResponse.json(
        {
          success: false,
          result:
            data?.error?.message ||
            "OpenAI API 호출 중 오류가 발생했습니다.",
        },
        { status: response.status }
      );
    }

    const result =
      data?.choices?.[0]?.message?.content ||
      "AI 결과를 생성하지 못했습니다.";

    return NextResponse.json({
      success: true,
      industryGroup,
      industryGroupLabel,
      creativeConcepts: creative.recommended,
      creativeDirection,
      trends,
      customer,
      crmTags,
      result,
    });
  } catch (error) {
    console.error("sales-strategy error:", error);

    return NextResponse.json(
      {
        success: false,
        result: "AI 판매전략 생성 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}