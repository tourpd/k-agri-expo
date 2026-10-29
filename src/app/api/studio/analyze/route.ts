import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzeInput = {
  channel?: string;
  duration?: string;
  programType?: string;
  sourceUrl?: string;
  memo?: string;
  sourceText?: string;
  fileNames?: string[];
};

const SYSTEM_PROMPT = `
당신은 JOPD PD ENGINE이다.

단순한 글쓰기 AI가 아니다.
30년 경력의 한국 방송 PD처럼 소재를 판단하고
실제 촬영 가능한 방송으로 설계한다.

가장 중요한 판단 순서는 다음과 같다.

1. 왜 지금 이 이야기를 방송해야 하는가
2. 시청자가 가장 궁금해할 질문은 무엇인가
3. 중심인물은 누구인가
4. 가장 강력한 숫자는 무엇인가
5. 문제와 갈등은 무엇인가
6. 예상 밖의 반전은 무엇인가
7. 첫 5초에 무엇을 보여줘야 하는가
8. 현장에서 추가로 무엇을 촬영해야 하는가
9. 어떤 순서로 보여줘야 끝까지 보게 되는가
10. 시청자가 보고 나서 무엇을 기억하거나 행동해야 하는가

절대 자료에 없는 사실, 숫자, 효과, 인물을 만들어내지 마라.

자료에서 확인되지 않으면 반드시
"자료에서 확인되지 않음"
이라고 표시한다.

특히 한국농수산TV에서는
농민에게 실제로 도움이 되는가,
돈을 더 벌거나 손실을 줄일 수 있는가,
현장에서 따라 할 수 있는가를 중요하게 판단한다.

제품이나 농자재를 다룰 경우
업체의 주장과 현장 검증 결과를 명확히 구분한다.

광고 문구를 그대로 방송 문구로 사용하지 않는다.

제목은 정보 나열형보다
인물, 결과, 숫자, 갈등, 반전을 활용한다.

첫 장면은 인사말이나 설명으로 시작하지 않는다.

쇼츠는 첫 1~2초,
장편은 첫 5~30초의 이탈 방지가 핵심이다.

반드시 JSON만 출력한다.
마크다운 코드블록은 사용하지 않는다.

JSON 구조:

{
  "materialSummary": "자료 핵심 요약",

  "pdJudgement": {
    "whyNow": "왜 지금 방송해야 하는가",
    "audienceQuestion": "시청자의 가장 큰 질문",
    "strongestPerson": "중심인물",
    "strongestNumber": "가장 강한 숫자",
    "conflict": "문제와 갈등",
    "twist": "반전",
    "firstFiveSeconds": "첫 5초 장면"
  },

  "titleCandidates": [
    "제목1",
    "제목2",
    "제목3",
    "제목4",
    "제목5"
  ],

  "thumbnailCandidates": [
    "썸네일 문구1",
    "썸네일 문구2",
    "썸네일 문구3"
  ],

  "openingHook": "실제 오프닝",

  "coreMessage": "방송 전체 핵심 한 문장",

  "storyStructure": [
    {
      "section": "구간",
      "purpose": "목적",
      "content": "내용",
      "visual": "필요 화면"
    }
  ],

  "interviewQuestions": [
    "인터뷰 질문"
  ],

  "shootingChecklist": [
    "추가 촬영 항목"
  ],

  "warnings": [
    "확인 또는 검증이 필요한 부분"
  ],

  "ending": "엔딩 방향"
}
`;

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  if (!Array.isArray(data?.output)) {
    return "";
  }

  const texts: string[] = [];

  for (const item of data.output) {
    if (!Array.isArray(item?.content)) continue;

    for (const content of item.content) {
      if (
        (content?.type === "output_text" ||
          content?.type === "text") &&
        typeof content?.text === "string"
      ) {
        texts.push(content.text);
      }
    }
  }

  return texts.join("\n");
}

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD PD ENGINE",
    version: "0.2.0",
    ai: true,
    model:
      process.env.OPENAI_JOPD_MODEL ||
      "gpt-5.6-terra",
    status: "ready",
  });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY가 없습니다.",
        },
        { status: 500 },
      );
    }

    const body =
      (await request.json()) as AnalyzeInput;

    const channel =
      body.channel || "한국농수산TV";

    const duration =
      body.duration || "10분";

    const programType =
      body.programType || "현장취재";

    const material = [
      body.sourceText
        ? `원문 자료:\n${body.sourceText}`
        : "",

      body.memo
        ? `조PD 추가 지시:\n${body.memo}`
        : "",

      body.sourceUrl
        ? `참고 URL:\n${body.sourceUrl}`
        : "",

      body.fileNames?.length
        ? `첨부파일 이름:\n${body.fileNames.join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!material.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "분석할 자료가 없습니다. 메모나 자료를 입력해 주세요.",
        },
        { status: 400 },
      );
    }

    const userPrompt = `
[방송 제작 조건]

채널: ${channel}
영상 길이: ${duration}
방송 유형: ${programType}

[입력 자료]

${material}

위 자료를 JOPD PD ENGINE 원칙으로 분석하라.

단순 요약하지 말고
실제로 촬영하고 편집할 수 있는 방송 설계도를 만들어라.

자료에 없는 사실은 만들지 마라.
`;

    const model =
      process.env.OPENAI_JOPD_MODEL ||
      "gpt-5.6-terra";

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,

          input: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],

          text: {
            format: {
              type: "json_object",
            },
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "[JOPD OPENAI ERROR]",
        JSON.stringify(data),
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.message ||
            "OpenAI 분석 요청에 실패했습니다.",
        },
        {
          status: response.status,
        },
      );
    }

    const outputText =
      extractOutputText(data);

    if (!outputText) {
      console.error(
        "[JOPD EMPTY OUTPUT]",
        JSON.stringify(data),
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "AI 분석 결과가 비어 있습니다.",
        },
        { status: 500 },
      );
    }

    let analysis;

    try {
      analysis = JSON.parse(
        cleanJson(outputText),
      );
    } catch {
      console.error(
        "[JOPD JSON ERROR]",
        outputText,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "AI 결과를 JSON으로 변환하지 못했습니다.",
          raw: outputText,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,

      engine: "JOPD PD ENGINE",
      version: "0.2.0",

      model,

      input: {
        channel,
        duration,
        programType,
      },

      analysis,
    });
  } catch (error) {
    console.error(
      "[JOPD ANALYZE ERROR]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "조PD PD ENGINE 오류",
      },
      { status: 500 },
    );
  }
}
