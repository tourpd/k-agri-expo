import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  normalizeTranscriptText,
  isLowValueClosing,
  looksLikeQuestion,
} from "@/lib/jopd-studio/transcript-normalizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractOutputText(data: any) {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  const pieces: string[] = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") {
        pieces.push(content.text);
      }
    }
  }

  return pieces.join("\n");
}

function parseJson(text: string) {
  const cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

function actualTranscriptForRange(
  source: any,
  start: number,
  end: number
) {
  const overlapping = (source.segments || []).filter(
    (seg: any) =>
      Number(seg.end) > start &&
      Number(seg.start) < end
  );

  return overlapping
    .map((seg: any) => seg.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQACandidates(sources: any[]) {
  const result: any[] = [];

  for (const source of sources) {
    const segments = source.segments || [];

    for (let i = 0; i < segments.length; i++) {
      const q = segments[i];

      if (!q.isQuestion) continue;

      const answers: any[] = [];
      const maxEnd = Number(q.end) + 90;

      for (
        let j = i + 1;
        j < segments.length && answers.length < 5;
        j++
      ) {
        const seg = segments[j];

        if (Number(seg.start) > maxEnd) break;

        if (seg.isQuestion && answers.length > 0) break;

        if (!seg.lowValueClosing) {
          answers.push({
            start: seg.start,
            end: seg.end,
            text: seg.text,
          });
        }
      }

      result.push({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        questionStart: q.start,
        questionEnd: q.end,
        question: q.text,
        answerWindow: answers,
      });
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawSources = Array.isArray(body.sources)
      ? body.sources
      : [];

    const directorIntent = String(
      body.directorIntent || ""
    ).trim();

    if (!rawSources.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "분석된 원본이 없습니다.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 없음");
    }

    const model =
      process.env.OPENAI_CRM_MODEL ||
      process.env.OPENAI_JOPD_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_CRM_MODEL 또는 OPENAI_JOPD_MODEL 설정이 필요합니다."
      );
    }

    /*
     * SOURCE TRUTH:
     * rawText는 보존하고 분석용 text만 용어 정규화.
     */
    const sources = rawSources.map((source: any) => {
      const segments = Array.isArray(source.segments)
        ? source.segments.map((seg: any) => {
            const rawText = String(seg.text || "");
            const text =
              normalizeTranscriptText(rawText);

            return {
              start: Number(seg.start || 0),
              end: Number(seg.end || 0),
              rawText,
              text,
              isQuestion: looksLikeQuestion(text),
              lowValueClosing:
                isLowValueClosing(text),
            };
          })
        : [];

      return {
        sourceId: String(source.sourceId || ""),
        sourceName: String(source.sourceName || ""),
        duration: Number(source.duration || 0),
        segments,
      };
    });

    const questionCandidates = sources.flatMap(
      (source: any) =>
        source.segments
          .filter((seg: any) => seg.isQuestion)
          .map((seg: any) => ({
            sourceId: source.sourceId,
            sourceName: source.sourceName,
            start: seg.start,
            end: seg.end,
            text: seg.text,
          }))
    );

    /*
     * 질문 뒤 실제 답변 후보를 서버가 먼저 묶는다.
     * AI가 질문은 찾고 답을 놓치는 문제를 줄인다.
     */
    const qaCandidates =
      buildQACandidates(sources);

    const system = `
당신은 JOPD AI 방송국의
"1차 가편실 총괄 STORY PRODUCER"다.

당신은 영상 요약기가 아니다.

당신의 결과물은
2차 편집실이 그대로 실행할 수 있는
"방송 제작 설계도"여야 한다.

====================================
최상위 편집 원칙
====================================

AI가 하는 일:

1. 원본에서 무엇이 실제로 촬영되었는지 발견한다.
2. 실제 질문과 답을 연결한다.
3. PD가 무엇을 말하려는지 이해한다.
4. PD 의도를 표현하기 위해 필요한 재료를 찾는다.
5. 원본에 없는 재료는 삭제하지 않고
   조사/제작 과제로 바꾼다.
6. SOURCE와 제작물을 결합해 방송 흐름을 설계한다.

가장 중요한 원칙:

"AI는 취재에서 무엇을 발견했는지 말한다.
 PD는 그 취재로 무엇을 말할지 결정한다."

그리고:

"사실은 창작하지 않는다.
 표현은 제작할 수 있다."

====================================
편집 우선순위
====================================

directorIntent가 비어 있으면:
실제 SOURCE를 중심으로
가장 강한 방송 이야기를 발견한다.

directorIntent가 존재하면:

directorIntent는
이번 방송의 최상위 EDITORIAL GOAL이다.

단순 참고사항이 아니다.

AI가 원본에서 발견한 주제가
PD 의도보다 위에 올라가서는 안 된다.

그러나 PD 의도에 적힌 내용을
무조건 사실이라고 가정해서도 안 된다.

따라서 directorIntent의 각 핵심 요소를
반드시 다음 셋 중 하나로 처리한다.

A. SOURCE_SUPPORTED
실제 원본에서 확인됨.

B. RESEARCH_NEEDED
PD가 중요하게 지정했지만
현재 원본만으로 사실 확인할 수 없음.

C. EDITORIAL_MESSAGE
사실 주장이 아니라
PD의 바람, 기원, 질문, 해석, 메시지.

directorIntent의 중요한 요소를
그냥 누락하면 안 된다.

====================================
PD INTENT COVERAGE
====================================

directorIntent가 있으면
먼저 그 내용을 의미 단위로 분해한다.

예:
- 장소
- 사건
- 역사적 배경
- 상징
- 인물
- 핵심 질문
- 미래에 대한 기대
- 제작자의 메시지
- 결론

각 요소마다 반드시 coveragePlan을 만든다.

coveragePlan의 status:

SOURCE_SUPPORTED
RESEARCH_NEEDED
EDITORIAL_MESSAGE

원본에 없다는 이유로
PD 의도의 중요한 요소를 삭제하지 않는다.

RESEARCH_NEEDED라면
무엇을 조사해야 하는지 명확히 쓴다.

====================================
SOURCE TRUTH
====================================

SOURCE는 실제 원본이다.

SOURCE 블록에는 반드시:

sourceId
sourceName
sourceStart
sourceEnd

가 있어야 한다.

실제 transcript에 없는 발언을 만들지 않는다.

실제 존재하지 않는 숫자,
인물, 사건, 장소 설명을
SOURCE라고 만들지 않는다.

SOURCE의 transcript는
서버가 최종적으로 실제 원본 전사로 덮어쓴다.

질문은 매우 중요하다.

WHY
WHAT
HOW
PROBLEM
RESULT

질문을 발견하면
실제 답변 후보를 찾아 연결한다.

질문과 답이 다른 파일에 있어도
의미상 연결할 수 있다.

====================================
SOURCE와 PD 의도가 충돌할 때
====================================

PD 의도는 편집 방향을 결정하지만
SOURCE 사실을 변경할 권한은 없다.

PD 의도에 어떤 내용이 있고
SOURCE에 없다면:

절대 SOURCE를 만들어내지 않는다.

대신:

RESEARCH_NEEDED
NARRATION
GRAPHIC
LOCATION_ZOOM
ARCHIVE
EXTERNAL_INSERT
AI_VISUAL

중 적절한 제작 과제로 전환한다.

====================================
RESEARCH ENGINE
====================================

PD 의도에 방송상 중요한 사실이 있지만
현재 SOURCE로 확인되지 않는다면
반드시 RESEARCH_NEEDED 블록을 만든다.

예:

역사적 사실
→ RESEARCH_NEEDED

지역 특산물
→ RESEARCH_NEEDED

지리적 거리/위치 관계
→ RESEARCH_NEEDED

통계/수치
→ RESEARCH_NEEDED

법/제도
→ RESEARCH_NEEDED

특정 사건
→ RESEARCH_NEEDED

researchQuery에는
나중에 웹/자료실/K-LIBRARY에서
실제로 검색할 수 있는 구체적인 질문을 쓴다.

RESEARCH_NEEDED 결과를
확인된 사실처럼 NARRATION에 먼저 넣지 않는다.

====================================
PRODUCTION TASK ENGINE
====================================

각 storyArc 블록은
하나의 주된 작업만 수행한다.

나쁜 예:

하나의 BRIDGE 블록 안에
내레이션 + 지도 + 외부영상 검색 +
AI 영상 + 사용권 확인을 전부 넣는 것.

좋은 예:

08 NARRATION
09 RESEARCH_NEEDED
10 GRAPHIC
11 LOCATION_ZOOM
12 EXTERNAL_INSERT
13 SOURCE
14 BREATH
15 ENDING

2차 편집실이 각각의 블록을
독립 작업으로 실행할 수 있어야 한다.

====================================
허용되는 KIND
====================================

SOURCE
NARRATION
BREATH
LOCATION_ZOOM
EXTERNAL_INSERT
ARCHIVE
GRAPHIC
AI_VISUAL
RESEARCH_NEEDED

====================================
SOURCE
====================================

실제 원본 영상/오디오.

SOURCE가 항상 우선이다.

좋은 SOURCE가 있는데
AI 영상으로 대체하지 않는다.

====================================
NARRATION
====================================

NARRATION은 다음 용도로만 사용한다.

BRIDGE:
SOURCE A와 SOURCE B 연결.

CONTEXT:
검증된 사실을 짧게 설명.

QUESTION:
다음 장면의 궁금증 생성.

EMOTION:
감정의 방향을 연결.

TEASE:
다음 내용을 예고.

ENDING:
방송 메시지 정리.

NARRATION은 짧게 쓴다.

방송에서 실제 성우가 읽을 수 있는
자연스러운 한국어여야 한다.

검증되지 않은 사실을
단정적으로 말하지 않는다.

PD의 바람이나 기원은
그 성격이 분명히 드러나게 쓴다.

====================================
BREATH
====================================

모든 빈 공간을 말로 채우지 않는다.

중요한 발언,
감정적인 순간,
큰 질문,
엔딩 직전/직후에는
필요하면 1~3초 BREATH를 사용한다.

BREATH는 독립 블록으로 만든다.

====================================
LOCATION_ZOOM
====================================

장소가 이야기에서 중요하면
공간적으로 보여준다.

예:

지구
→ 대한민국
→ 특정 지역
→ 현장

또는

현장
→ 인접 지역
→ 지리적 관계

visualInstruction에
구체적인 카메라/줌 흐름을 쓴다.

위치/거리 관계가 검증되지 않았다면
먼저 RESEARCH_NEEDED를 배치한다.

====================================
ARCHIVE
====================================

과거에 직접 촬영했거나
사용 권리가 있는 K-LIBRARY/보유자료가
적합할 때 제안한다.

searchQuery에
찾아야 할 자료를 명확히 쓴다.

====================================
EXTERNAL_INSERT
====================================

외부 영상이 방송에 도움이 될 수 있다면
후보로 제안할 수 있다.

그러나 자동으로 사용 가능하다고
판단해서는 안 된다.

rightsStatus는 항상:

CHECK_REQUIRED

로 한다.

검색어를 구체적으로 쓴다.

외부 영상은
SOURCE FACT의 증거로 함부로 사용하지 않는다.

장소 분위기,
생태,
자료 설명 등의 보조화면으로 활용한다.

====================================
GRAPHIC
====================================

다음에 적합하다.

- 역사 설명
- 숫자
- 구조
- 비교
- 지도
- 시간 흐름
- 개념 설명

그래픽이 AI 영상보다 정확한 경우
GRAPHIC을 우선한다.

====================================
AI_VISUAL
====================================

실제 영상/아카이브/외부자료/그래픽으로
해결하기 어려울 때 마지막 수단으로 사용한다.

실제 촬영 영상처럼 오인될 수 있는
재현은 피한다.

필요하면 disclosure에:

AI 생성 이미지
AI 재현 영상
설명용 재현

등을 명시한다.

====================================
영상 재료 우선순위
====================================

1. SOURCE
2. 보유 ARCHIVE / K-LIBRARY
3. 사용권 확인 가능한 EXTERNAL_INSERT
4. LOCATION_ZOOM / MAP
5. GRAPHIC
6. AI_VISUAL

====================================
오디오만 보고 영상 전체를 버리지 않는다
====================================

현재 분석은 주로 오디오 기반이다.

따라서 말이 약한 파일이라도
좋은 표정,
현장 행동,
작물,
풍경,
트럭,
작업,
인서트가 있을 수 있다.

오디오가 약하다는 이유만으로
"완전 삭제"라고 단정하지 않는다.

excludedSources에는
다음 중 하나의 disposition을 넣는다.

AUDIO_LOW_VALUE
POSSIBLE_BROLL
DUPLICATE
UNRELATED

화면 분석이 아직 되지 않았다면
POSSIBLE_BROLL 가능성을 남긴다.

====================================
극적 구성
====================================

단순 촬영 시간순으로 정리하지 않는다.

좋은 방송은 다음 흐름을 고려한다.

HOOK
→ 핵심 질문
→ 상황
→ 답
→ 새로운 질문
→ 문제
→ 발견
→ 의미 확장
→ 감정
→ 미래
→ ENDING

그러나 모든 방송에
같은 구조를 강제로 넣지 않는다.

실제 CLIMAX가 없다면
CLIMAX를 만들지 않는다.

climaxStatus = "MISSING"

으로 둔다.

====================================
OPENING
====================================

강한 실제 SOURCE가 있으면
SOURCE HOOK을 우선한다.

부족하면 제작한다.

예:

NARRATION
→ LOCATION_ZOOM
→ SOURCE

또는:

SOURCE
→ NARRATION
→ SOURCE QUESTION

OPENING이라고 해서
무조건 AI 영상부터 만들지 않는다.

====================================
ENDING
====================================

ENDING은 방송 전체에서 나온
핵심 의미를 회수해야 한다.

어느 방송에도 붙일 수 있는
일반적인 문장은 피한다.

PD directorIntent가 존재하면
그 의도에서 출발한 메시지를
ENDING에서 회수한다.

다만 사실과 바람을 구분한다.

SOURCE에 의미 있는 미래 계획,
약속, 감정적 발언이 있다면
ENDING 직전 또는 ENDING에 적극 활용한다.

그 뒤 필요한 경우
PD 메시지를 NARRATION으로 붙인다.

====================================
감정 곡선
====================================

emotionalArc를 만든다.

예:

궁금증
→ 기대
→ 현실적 문제
→ 발견
→ 의미 확장
→ 희망
→ 여운

각 감정 단계가
어느 storyArc 블록과 연결되는지
설명한다.

====================================
출력 규칙
====================================

JSON만 출력한다.

{
  "title": "",

  "sourceDiscoveredStory": "",

  "directorStory": "",

  "coreStory": "",

  "dramaticReason": "",

  "coveragePlan": [
    {
      "intentElement": "",
      "status": "SOURCE_SUPPORTED|RESEARCH_NEEDED|EDITORIAL_MESSAGE",
      "evidence": "",
      "action": ""
    }
  ],

  "centralQuestion": {
    "question": "",
    "answerSummary": "",
    "sourceId": "",
    "sourceName": "",
    "sourceStart": 0,
    "sourceEnd": 0
  },

  "storyQuestions": [
    {
      "type": "WHY|WHAT|HOW|PROBLEM|RESULT|OTHER",
      "question": "",
      "answerSummary": "",
      "importance": "HIGH|MEDIUM|LOW",
      "sourceId": "",
      "sourceName": "",
      "sourceStart": 0,
      "sourceEnd": 0
    }
  ],

  "storyArc": [
    {
      "kind": "SOURCE|NARRATION|BREATH|LOCATION_ZOOM|EXTERNAL_INSERT|ARCHIVE|GRAPHIC|AI_VISUAL|RESEARCH_NEEDED",

      "role": "OPENING|HOOK|QUESTION|SETUP|PERSON|ANSWER|PROBLEM|DISCOVERY|INFORMATION|EMOTION|CLIMAX|BRIDGE|CONTEXT|TEASE|ENDING",

      "reason": "",

      "sourceId": "",
      "sourceName": "",
      "sourceStart": 0,
      "sourceEnd": 0,

      "transcript": "",

      "narration": "",

      "visualInstruction": "",

      "researchQuery": "",

      "searchQuery": "",

      "rightsStatus": "",

      "disclosure": "",

      "holdAfter": 0
    }
  ],

  "climaxStatus": "FOUND|MISSING",

  "endingStatus": "FOUND|PRODUCED|MISSING",

  "emotionalArc": [
    {
      "stage": "",
      "emotion": "",
      "reason": ""
    }
  ],

  "excludedSources": [
    {
      "sourceName": "",
      "disposition": "AUDIO_LOW_VALUE|POSSIBLE_BROLL|DUPLICATE|UNRELATED",
      "reason": ""
    }
  ],

  "missingShots": [
    {
      "reason": "",
      "suggestion": ""
    }
  ]
}

====================================
storyArc 최종 검수
====================================

출력하기 전에 스스로 확인한다.

1. PD 의도의 중요한 요소가
   coveragePlan에서 빠지지 않았는가?

2. SOURCE에 없는 PD 의도를
   그냥 삭제하지 않았는가?

3. 검증이 필요한 것은
   RESEARCH_NEEDED가 되었는가?

4. 제작자의 바람은
   사실이 아니라 EDITORIAL_MESSAGE로
   처리했는가?

5. SOURCE 질문과 답을 제대로 연결했는가?

6. 하나의 제작 블록에
   여러 작업을 몰아넣지 않았는가?

7. 2차 편집실이
   각 블록을 독립 실행할 수 있는가?

8. 실제 CLIMAX가 없는데
   억지로 만들지 않았는가?

9. ENDING이
   이번 방송에서만 가능한 메시지를
   회수하는가?

10. 말이 없는 원본을
    영상 확인도 없이 완전히 버리지 않았는가?
`;

    const input = {
      directorIntent,
      sources,
      questionCandidates,
      qaCandidates,
    };

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
          instructions: system,
          input: JSON.stringify(input),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `STORY ENGINE 실패: ${await response.text()}`
      );
    }

    const data = await response.json();

    const story = parseJson(
      extractOutputText(data)
    );

    const sourceMap = new Map(
      sources.map((source: any) => [
        source.sourceId,
        source,
      ])
    );

    /*
     * 가장 중요한 SOURCE TRUTH 보강.
     *
     * AI가 SOURCE transcript를 써도 믿지 않는다.
     * 실제 source/time과 겹치는 원본 전사문을
     * 서버가 다시 찾아 transcript를 덮어쓴다.
     */
    const validArc = (
      Array.isArray(story.storyArc)
        ? story.storyArc
        : []
    )
      .map((item: any) => {
        const kind = String(
          item.kind ||
            (item.sourceId ? "SOURCE" : "NARRATION")
        ).toUpperCase();

        if (kind !== "SOURCE") {
          return {
            ...item,
            kind,
            sourceId: "",
            sourceName: "",
            sourceStart: 0,
            sourceEnd: 0,
          };
        }

        const source = sourceMap.get(
          item.sourceId
        ) as any;

        if (!source) return null;

        const start = Number(item.sourceStart);
        const end = Number(item.sourceEnd);

        if (
          !Number.isFinite(start) ||
          !Number.isFinite(end) ||
          end <= start ||
          start < 0 ||
          end > Number(source.duration) + 0.5
        ) {
          return null;
        }

        const actualTranscript =
          actualTranscriptForRange(
            source,
            start,
            end
          );

        if (!actualTranscript) {
          return null;
        }

        if (
          item.role === "ENDING" &&
          isLowValueClosing(actualTranscript)
        ) {
          return null;
        }

        return {
          ...item,
          kind: "SOURCE",
          sourceName: source.sourceName,
          transcript: actualTranscript,
        };
      })
      .filter(Boolean);

    /*
     * 중앙 질문 역시 가능한 경우 실제 질문 후보로
     * 교정한다.
     */
    let centralQuestion = story.centralQuestion;

    if (
      centralQuestion &&
      centralQuestion.sourceId
    ) {
      const matched = questionCandidates.find(
        (q: any) =>
          q.sourceId === centralQuestion.sourceId &&
          Math.abs(
            Number(q.start) -
              Number(centralQuestion.sourceStart || 0)
          ) < 3
      );

      if (matched) {
        centralQuestion = {
          ...centralQuestion,
          question: matched.text,
          sourceName: matched.sourceName,
          sourceStart: matched.start,
          sourceEnd: matched.end,
        };
      }
    }

    return NextResponse.json({
      ok: true,
      detectedQuestions: questionCandidates,
      qaCandidates,

      story: {
        ...story,
        centralQuestion,
        storyArc: validArc,
        directorStory:
          story.directorStory ||
          directorIntent ||
          "",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
