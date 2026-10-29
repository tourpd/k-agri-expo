import type { CreativeBrief } from "./creative-interpreter";
import {
  buildCharacterLabInput,
  type CharacterLabResult,
} from "./character-lab";
import {
  formatKhosMemoryForPrompt,
  retrieveKhosCreativeMemory,
} from "./khos-memory";

export function prepareCharacterLab(
  brief: CreativeBrief
) {
  const query = [
    brief.originalInput,
    ...brief.characters,
    ...brief.places,
    ...brief.products,
    ...brief.emotions,
    "인물 관계 욕망 갈등 모순 캐릭터",
  ].join(" ");

  const memories =
    retrieveKhosCreativeMemory(query, 8);

  return {
    input: buildCharacterLabInput(brief),
    khosMemory:
      formatKhosMemoryForPrompt(memories),
    memorySources: memories.map((m) => m.path),
  };
}

export function validateCharacterLabResult(
  value: unknown
): CharacterLabResult {
  if (!value || typeof value !== "object") {
    throw new Error("CHARACTER_LAB_INVALID_RESULT");
  }

  const result = value as CharacterLabResult;

  if (
    result.version !== "JOPD_CHARACTER_LAB_V1" ||
    result.truthClass !== "CREATED"
  ) {
    throw new Error("CHARACTER_LAB_CONTRACT_MISMATCH");
  }

  if (
    !Array.isArray(result.candidates) ||
    result.candidates.length !== 3
  ) {
    throw new Error(
      "CHARACTER_LAB_REQUIRES_3_CANDIDATES"
    );
  }

  return result;
}

export async function runCharacterLabAI(
  brief: CreativeBrief
): Promise<CharacterLabResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 없음");
  }

  const model =
    process.env.OPENAI_CRM_MODEL ||
    process.env.OPENAI_JOPD_MODEL;

  if (!model) {
    throw new Error(
      "OPENAI_CRM_MODEL 또는 OPENAI_JOPD_MODEL 없음"
    );
  }

  const prepared = prepareCharacterLab(brief);

  const instructions = `
당신은 조PD AI 방송국의 Character Lab 책임작가다.

캐릭터 프로필이 아니라
반복해서 사건을 만들어내는 STORY GENERATOR를 설계한다.

핵심:
- 후보는 정확히 3명.
- 세 사람은 기능, 욕망, 결함, 행동, 말투가 달라야 한다.
- 기존 중심인물과 충돌할 구체적 이유가 있어야 한다.
- 캐릭터의 욕망이 행동을 만들고 행동이 사건을 만들어야 한다.
- 형용사보다 관찰 가능한 행동으로 정의한다.
- 행동 가능한 모순을 최소 2개 만든다.
- 압박받을 때 나오는 고유 행동을 만든다.
- 반복 가능한 코미디 발생 규칙을 만든다.
- 웃음을 만들던 특징이 훗날 감정의 원인으로 전환될 수 있게 한다.
- sampleLines는 설명문이나 명언이 아니라 실제 장면의 짧은 대사여야 한다.
- episodeGenerators는 후보마다 최소 5개.
- 농민, 노인, 지방 사람, 영업사원에 대한 고정관념에 의존하지 않는다.
- 확인되지 않은 현실 정보를 사실처럼 만들지 않는다.
- 이번 캐릭터 후보는 창작물이므로 truthClass는 CREATED다.

특히 판매왕이 중심인물이라면
모든 조연이 판매왕을 존경하고 말을 잘 듣게 만들지 않는다.
오해, 경쟁, 시험, 귀찮게 함, 이용, 무시, 애정과 반감 등
관계 자체가 사건 발생기가 되어야 한다.

K-HOS 기억은 캐릭터 복제용이 아니다.
인간 욕망과 관계를 생각하기 위한 참고자료일 뿐이다.

JSON만 출력한다.
Markdown과 코드펜스를 출력하지 않는다.

최상위 구조는 반드시:
{
  "version": "JOPD_CHARACTER_LAB_V1",
  "truthClass": "CREATED",
  "sourceBrief": {...},
  "existingCharacters": [],
  "candidates": [],
  "ensembleDesign": {
    "centralRelationship": "",
    "relationshipTensions": [],
    "missingCharacterFunctions": []
  },
  "auditionQuestions": [],
  "nextStep": "JOPD_CHARACTER_SELECTION"
}

각 candidate는 character-lab.ts의 CharacterCandidate 계약에 맞춰
모든 필드를 빠짐없이 작성한다.
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
        input: JSON.stringify({
          creativeBrief: prepared.input,
          khosReference: prepared.khosMemory,
        }),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Character Lab AI 실패: ${await response.text()}`
    );
  }

  const data = await response.json();

  let output = "";

  if (typeof data.output_text === "string") {
    output = data.output_text;
  } else if (Array.isArray(data.output)) {
    const items = data.output as Array<{
      content?: Array<{ text?: unknown }>;
    }>;

    output = items
      .flatMap((item) => item.content || [])
      .map((item) =>
        typeof item.text === "string" ? item.text : ""
      )
      .filter(Boolean)
      .join("\n");
  }

  output = output
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");

  if (!output) {
    throw new Error("Character Lab 빈 응답");
  }

  return validateCharacterLabResult(
    JSON.parse(output)
  );
}

