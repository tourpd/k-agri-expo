import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          result:
            "OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하십시오.",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          result: "이미지가 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!isImageFile(file)) {
      return NextResponse.json(
        {
          success: false,
          result: "이미지 파일만 분석할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          result: "이미지 용량은 8MB 이하로 올려주십시오.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "당신은 K-Agri Expo AI 판매자동화센터의 제품사진 분석 전문가입니다. 농자재, 농기계, 종자, 묘종, 묘목, 농산물, 건강식품, 수산물, 화훼, 조경, 스마트농업, 태양광, 미래식량 제품을 한국어로 분석합니다.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
이 이미지는 K-Agri Expo에 등록될 제품 사진입니다.

사진만 보고 단정하지 말고, 보이는 정보와 추정 정보를 구분하십시오.
제품명, 업체명, 성분, 효능, 가격 등 확실하지 않은 내용은 "추정"이라고 표시하십시오.

반드시 아래 형식으로 한국어 작성:

1. 이미지에서 보이는 정보
- 포장/제품 형태:
- 보이는 글자:
- 색상/디자인:
- 제품 카테고리 추정:

2. 제품명 추정
- 제품명:
- 업체명:
- 확실도:

3. 산업군 자동분류
- 1차 산업군:
- 세부 분야:
- 분류 근거:

4. 대상 고객 추정
- 주요 고객:
- 관련 작물/분야:
- 사용 상황:

5. 고객 고민 추정
- 고객이 겪는 문제:
- 구매 욕망:
- 손해 회피 포인트:

6. 판매 포인트
- 핵심 판매 포인트 1:
- 핵심 판매 포인트 2:
- 핵심 판매 포인트 3:

7. 공동구매 가능성
- 가능성:
- 이유:
- 공동구매 문구:

8. CRM 태그
- 구매상품 태그:
- 관심문제 태그:
- 작물/분야 태그:
- 재구매 태그:
- 추천상품 태그:

9. AI 판매전략용 요약
- 이 제품을 한 문장으로 요약:
`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.35,
        max_tokens: 1800,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Vision API Error:", data);

      return NextResponse.json(
        {
          success: false,
          result:
            data?.error?.message ||
            "이미지 분석 중 OpenAI API 오류가 발생했습니다.",
        },
        { status: response.status }
      );
    }

    const result =
      data?.choices?.[0]?.message?.content || "이미지 분석 결과가 비어 있습니다.";

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      result,
    });
  } catch (error) {
    console.error("analyze-image error:", error);

    return NextResponse.json(
      {
        success: false,
        result: "이미지 분석 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}