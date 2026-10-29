import type { CreativeBrief } from "./creative-interpreter";
import {
  buildStoryLabInput,
  type StoryLabResult,
} from "./story-lab";

function extractText(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const value = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ text?: unknown }>;
    }>;
  };

  if (typeof value.output_text === "string") {
    return value.output_text;
  }

  return (value.output || [])
    .flatMap((item) => item.content || [])
    .map((item) =>
      typeof item.text === "string" ? item.text : ""
    )
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function parseStoryLabResult(
  text: string
): StoryLabResult {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");

  const result = JSON.parse(cleaned) as StoryLabResult;

  if (
    result.version !== "JOPD_STORY_LAB_V1" ||
    result.truthClass !== "CREATED"
  ) {
    throw new Error("STORY_LAB_CONTRACT_MISMATCH");
  }

  if (
    !Array.isArray(result.candidates) ||
    result.candidates.length !== 3
  ) {
    throw new Error("STORY_LAB_REQUIRES_3_CANDIDATES");
  }

  for (const [index, candidate] of result.candidates.entries()) {
    const validBeat =
      Array.isArray(candidate?.beats) &&
      candidate.beats.length >= 6 &&
      candidate.beats.every(
        (beat) =>
          typeof beat?.order === "number" &&
          typeof beat?.beat === "string" &&
          typeof beat?.because === "string" &&
          typeof beat?.therefore === "string" &&
          typeof beat?.dialogueFuel?.AWant === "string" &&
          typeof beat?.dialogueFuel?.BWant === "string" &&
          typeof beat?.dialogueFuel?.informationGap === "string" &&
          typeof beat?.dialogueFuel?.power === "string" &&
          typeof beat?.dialogueFuel?.unspokenTruth === "string"
      );

    if (
      !candidate ||
      typeof candidate.id !== "string" ||
      typeof candidate.title !== "string" ||
      typeof candidate.logline !== "string" ||
      typeof candidate.hook !== "string" ||
      typeof candidate.eventCause !== "string" ||
      typeof candidate.centralConflict !== "string" ||
      typeof candidate.protagonistChoice !== "string" ||
      typeof candidate.emotionalReversal !== "string" ||
      typeof candidate.payoff !== "string" ||
      typeof candidate.pv5Function !== "string" ||
      typeof candidate.comedicMechanism !== "string" ||
      typeof candidate.stakes !== "string" ||
      !validBeat ||
      typeof candidate.dialogueFuel?.AWant !== "string" ||
      typeof candidate.dialogueFuel?.BWant !== "string" ||
      typeof candidate.dialogueFuel?.informationGap !== "string" ||
      typeof candidate.dialogueFuel?.power !== "string" ||
      typeof candidate.dialogueFuel?.unspokenTruth !== "string" ||
      typeof candidate.selfCheck?.causalChain !== "string" ||
      typeof candidate.selfCheck?.humorChangesPlot !== "boolean" ||
      typeof candidate.selfCheck?.emotionRequiresExposition !== "boolean" ||
      typeof candidate.selfCheck?.pv5Replaceability !== "string" ||
      typeof candidate.selfCheck?.realCostForProtagonist !== "string" ||
      typeof candidate.selfCheck?.seedPayoff !== "string" ||
      typeof candidate.selfCheck?.risk !== "string"
    ) {
      throw new Error(
        `STORY_LAB_CANDIDATE_${index + 1}_CONTRACT_MISMATCH`
      );
    }
  }

  return result;
}

export function prepareStoryLab(
  brief: CreativeBrief
) {
  return buildStoryLabInput(brief);
}

export { extractText };

export async function runStoryLabAI(
  brief: CreativeBrief
): Promise<StoryLabResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 없음");
  }

  const model =
    process.env.OPENAI_JOPD_MODEL ||
    process.env.OPENAI_CRM_MODEL;

  if (!model) {
    throw new Error(
      "OPENAI_CRM_MODEL 또는 OPENAI_JOPD_MODEL 없음"
    );
  }

  const input = prepareStoryLab(brief);

  const instructions = `
당신은 조PD AI 방송국의 STORY LAB 책임작가다.

지금은 대본을 쓰지 않는다.
좋은 대사를 쓰려고도 하지 않는다.

먼저 "방송으로 보고 싶은 이야기"를 만든다.

핵심 공식은 단순한 기승전결이 아니다.

인물의 욕망
→ 사건
→ 행동 또는 선택
→ 예상하지 못한 결과
→ 더 어려워진 상황
→ 새로운 선택
→ 웃음 또는 관계 변화
→ 감정적 발견
→ 앞에서 심은 것의 회수
→ 결말

모든 주요 beat는
"그런데 그 다음에"가 아니라

"그 일 때문에"
"그래서"
"그 선택의 결과로"

연결되어야 한다.

==================================================
WRITERS' ROOM IDEA FIGHT — 첫 생각을 작품으로 착각하지 마라
==================================================

최종 구성안을 쓰기 전에 내부 작가회의를 먼저 한다.

사용자에게 이 내부 후보들을 출력하지 않는다.

1. 최소 12개의 서로 다른 STORY SEED를 먼저 발명한다.

각 seed는 최소한 다음 중 하나가 달라야 한다.

- 사고가 터지는 원인
- 주인공이 숨기거나 오해하는 것
- 인물 관계의 충돌
- 웃음을 만드는 행동
- 주인공이 잃을 수 있는 것
- 중간에 뒤집히는 정보
- 마지막에 다시 의미가 바뀌는 물건/행동/약속
- PV5가 사건에 개입하는 방식

2. 가장 먼저 떠오르는 안전한 아이디어를 의심한다.

다음 유형은 우선 탈락 후보로 본다.

- 판매왕이 농촌에 가서 주민의 어려움을 듣고 해결한다
- 주민이 처음에는 반대하지만 결국 마음을 연다
- 체험 행사에서 사고가 나고 모두 협력해 해결한다
- 청년 농부의 꿈을 판매왕이 도와준다
- PV5가 농촌의 희망이나 혁신의 상징이 된다
- 마지막에 모두가 판매왕의 진심을 알아준다

이 소재 자체가 절대 금지는 아니다.
하지만 이것만으로 이야기가 성립한다면 너무 예상 가능하다.

3. 각 seed에 대해 스스로 묻는다.

"첫 30초만 봐도 다음 이야기가 예상되는가?"
그렇다면 버리거나 비튼다.

"이 사건은 이 캐릭터라서 벌어졌는가?"
아니라면 버린다.

"웃기는 행동이 나중에 다른 의미로 돌아올 수 있는가?"
아니라면 약하다.

"주인공이 실제로 손해를 감수하는 선택을 하는가?"
아니라면 약하다.

"마지막 장면이 처음 장면을 새롭게 보이게 하는가?"
아니라면 약하다.

4. 정상적인 해결책만 찾지 않는다.

다음 방향도 경쟁시킨다.

- 체면을 지키려다 일이 더 커지는 이야기
- 좋은 의도로 한 행동이 엉뚱한 문제를 만드는 이야기
- 판매왕이 고객을 설득하러 왔다가 오히려 부려먹히는 이야기
- 별것 아닌 물건 하나 때문에 관계가 뒤집히는 이야기
- 누군가가 알고 있는 것을 다른 사람이 몰라서 행동이 계속 어긋나는 이야기
- 처음에는 실패처럼 보인 행동이 마지막에 가장 중요한 행동으로 바뀌는 이야기
- 판매하지 않는 선택이 오히려 판매왕의 정체성을 보여 주는 이야기
- 인물이 끝까지 말하지 않는 것을 관객이 행동으로 먼저 알아차리는 이야기

5. 12개 이상을 경쟁시킨 뒤
서로 가장 다른 3개만 살아남힌다.

최종 3개는 단순히 "괜찮은 이야기"가 아니라
각각 한 문장만 들어도
"그다음이 보고 싶다"는 질문이 생겨야 한다.

중요:
기괴함 자체가 창의성은 아니다.
억지 반전도 창의성이 아니다.
캐릭터의 욕망과 행동 때문에 예상 밖의 사건이 생겨야 한다.

==================================================
구성안 3개의 차이
==================================================

정확히 3개를 만든다.

같은 이야기를
시트콤 / 다큐 / 광고로 포장한 것은
3개의 이야기가 아니다.

세 구성안은 각각:

- 사건이 시작되는 이유
- 중심 갈등
- 주인공이 내려야 하는 선택
- 감정이 뒤집히는 발견
- 마지막 회수

중 최소 3개 이상이 본질적으로 달라야 한다.

==================================================
웃음
==================================================

농담을 삽입하지 않는다.

웃음은:

욕망
+ 오해 또는 정보차
+ 행동
+ 예상과 실제의 차이
+ 상대의 반응

에서 발생한다.

웃긴 사건을 제거했을 때
줄거리가 똑같이 진행된다면
그 웃음은 실패다.

==================================================
감동
==================================================

"사실 저는..."
같은 설명 대사로 감동시키지 않는다.

관객이 앞에서 이미 본:

행동
물건
습관
관계
약속
실수
웃긴 사건

중 하나가 뒤에서
다른 의미로 보이게 만드는 것을 우선한다.

==================================================
PV5
==================================================

PV5를 광고 문구로 삽입하지 않는다.

PV5가:

사건을 만들거나,
문제를 드러내거나,
인물의 선택을 가능하게 하거나,
관계를 변화시키거나,
엔딩의 회수에 참여해야 한다.

그렇지 않으면 다시 설계한다.

==================================================
판매왕
==================================================

판매왕이 모든 것을 알고
좋은 말만 하는 완벽한 해결사가 되면 실패다.

판매왕도:

오해할 수 있고,
거절당할 수 있고,
곤란해질 수 있고,
잘못 짐작할 수 있고,
선택해야 하고,
행동으로 신뢰를 얻어야 한다.

다만 핵심에서는
"차보다 사람을 먼저 본다"는 가치가
설명문이 아니라 행동으로 드러날 수 있다.

==================================================
판매왕 CHARACTER COMEDY — 좋은 사람이기 전에 살아 있는 인간
==================================================

판매왕을 매 작품마다
"처음에는 판매 욕심 → 주민을 이해함 → 판매를 포기함 → 좋은 사람이 됨"
으로 반복하지 않는다.

그것은 캐릭터가 아니라 교훈의 반복이다.

판매왕에게 매 이야기마다
사건을 실제로 발생시키는 인간적 결함 또는 이상한 집착을 하나 선택한다.

예:
- 한번 궁금해지면 계약보다 원인을 끝까지 확인한다.
- 자기가 전문가라는 체면 때문에 모른다는 말을 30초 늦게 한다.
- 고객의 한마디를 너무 문자 그대로 받아들여 일을 키운다.
- 부탁을 거절하지 못해 판매 상담이 전혀 다른 노동으로 변한다.
- 작은 약속을 지나치게 지키려다가 큰 일정을 망친다.
- 실패를 숨기려는 임기응변이 다음 사건을 만든다.
- 사람 이름과 사소한 말을 이상할 만큼 기억한다.
- 경쟁심이 붙으면 쓸데없는 것까지 증명하려 든다.
- 남의 사정에는 눈치가 빠르면서 자기 감정에는 둔하다.
- 고객에게 차를 팔지 말아야겠다고 판단하면 오히려 너무 적극적으로 말린다.

위 예시를 그대로 반복하지 말고
이야기에 맞는 새로운 행동 규칙도 발명한다.

중요한 것은 "결함을 설정했다"고 설명하는 것이 아니다.

그 결함 때문에:
1. 판매왕이 잘못된 행동을 하고,
2. 상대가 예상 밖으로 반응하고,
3. 판매왕이 체면 때문에 한 번 더 행동하고,
4. 상황이 더 커지고,
5. 같은 성격이 나중에는 문제를 해결하거나 감정을 회수해야 한다.

즉 같은 성격이
초반에는 사고의 원인,
중반에는 웃음의 원인,
후반에는 인간적인 장점이 될 수 있다.

판매왕만 이상해서도 안 된다.

주요 상대 인물도 최소 하나의
고집 / 체면 / 습관 / 오해 / 말하지 않는 욕망을 가져야 하며,
판매왕의 성격과 부딪힐 때 장면이 발생해야 한다.

캐릭터의 끼는
재치 있는 대사를 많이 하는 것이 아니라
"저 인간이라면 저럴 것 같다"는 반복 가능한 행동에서 나온다.


==================================================
장면과 대사 준비
==================================================

아직 완성 대사를 쓰지 않는다.

대신 dialogueFuel에:

- A가 원하는 것
- B가 원하는 것
- 서로 알고 있는 정보의 차이
- 누가 관계의 우위를 갖는지
- 누구도 직접 말하지 않는 진실

을 남긴다.

이것이 다음 Dialogue Engine의 재료가 된다.

==================================================
출력
==================================================

입력의 계약과 qualityGate를 모두 따른다.

JSON만 출력한다.
Markdown이나 코드펜스를 쓰지 않는다.

version은 JOPD_STORY_LAB_V1.
truthClass는 CREATED.
candidates는 정확히 3개.

각 후보는 story-lab.ts의
StoryCandidate 구조를 완전히 채운다.

각 후보의 beats는
최소 6개 이상 작성한다.

selfCheck는 실제 구성에 근거해 판단한다.
기계적으로 전부 true라고 쓰지 않는다.
`;

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
        instructions,
        input: JSON.stringify(input),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Story Lab AI 실패: ${await response.text()}`
    );
  }

  const data: unknown = await response.json();
  const output = extractText(data);

  if (!output) {
    throw new Error("Story Lab 빈 응답");
  }

  try {
    return parseStoryLabResult(output);
  } catch (error) {
    console.error("===== STORY LAB RAW OUTPUT =====");
    console.error(output);
    console.error("===== END RAW OUTPUT =====");
    throw error;
  }
}
