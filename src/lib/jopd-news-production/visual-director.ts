import OpenAI from "openai";

import {
  type NewsArticleSegmentInput,
  type NewsVisualKind,
  type NewsVisualRequirement,
} from "./visual-plan";

export const ACTION_NEWS_VISUAL_DIRECTOR_VERSION =
  "K_AGRI_ACTION_NEWS_VISUAL_DIRECTOR_V1";

const ALLOWED_KINDS: NewsVisualKind[] = [
  "FIELD_VIDEO",
  "RELATED_FOOTAGE",
  "INTERVIEW",
  "PHOTO",
  "OFFICIAL_DOCUMENT",
  "OFFICIAL_WEBPAGE",
  "DATA_GRAPHIC",
  "MAP",
  "ACTION_CARD",
  "TITLE_CARD",
];

type RawRequirement = {
  segmentId?: unknown;
  purpose?: unknown;
  preferredKinds?: unknown;
  factIds?: unknown;
  evidenceRequired?: unknown;
  searchIntents?: unknown;
};

type RawDirectorResponse = {
  requirements?: unknown;
};

export type NewsVisualDirectorResult = {
  version: typeof ACTION_NEWS_VISUAL_DIRECTOR_VERSION;
  model: string;
  requirements: NewsVisualRequirement[];
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function parseJsonObject(raw: string): RawDirectorResponse {
  const text = raw.trim();

  if (!text) {
    throw new Error("VISUAL_DIRECTOR: OpenAI 응답이 비었습니다.");
  }

  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence) as RawDirectorResponse;
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");

    if (start < 0 || end <= start) {
      throw new Error("VISUAL_DIRECTOR: JSON 객체를 찾지 못했습니다.");
    }

    return JSON.parse(
      withoutFence.slice(start, end + 1),
    ) as RawDirectorResponse;
  }
}

function normalizeKinds(value: unknown): NewsVisualKind[] {
  return stringArray(value).filter(
    (kind): kind is NewsVisualKind =>
      ALLOWED_KINDS.includes(kind as NewsVisualKind),
  );
}

function validateRequirements(params: {
  raw: RawDirectorResponse;
  segments: NewsArticleSegmentInput[];
}): NewsVisualRequirement[] {
  if (!Array.isArray(params.raw.requirements)) {
    throw new Error(
      "VISUAL_DIRECTOR: requirements 배열이 없습니다.",
    );
  }

  const segmentById = new Map(
    params.segments.map((segment) => [
      segment.segmentId,
      segment,
    ]),
  );

  const requirements: NewsVisualRequirement[] = [];

  for (const [index, item] of params.raw.requirements.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(
        `VISUAL_DIRECTOR: requirement ${index + 1} 형식 오류`,
      );
    }

    const raw = item as RawRequirement;
    const segmentId = String(raw.segmentId || "").trim();
    const segment = segmentById.get(segmentId);

    if (!segment) {
      throw new Error(
        `VISUAL_DIRECTOR: 존재하지 않는 segmentId ${segmentId}`,
      );
    }

    const purpose = String(raw.purpose || "").trim();

    if (!purpose) {
      throw new Error(
        `VISUAL_DIRECTOR: ${segmentId} purpose가 없습니다.`,
      );
    }

    const preferredKinds = normalizeKinds(raw.preferredKinds);

    if (!preferredKinds.length) {
      throw new Error(
        `VISUAL_DIRECTOR: ${segmentId} 화면 종류가 없습니다.`,
      );
    }

    const requestedFactIds = stringArray(raw.factIds);

    const factIds = requestedFactIds.filter((factId) =>
      segment.factIds.includes(factId),
    );

    if (factIds.length !== requestedFactIds.length) {
      throw new Error(
        `VISUAL_DIRECTOR: ${segmentId}에 없는 FACT ID를 생성했습니다.`,
      );
    }

    const evidenceRequired =
      raw.evidenceRequired === true;

    const searchIntents = stringArray(raw.searchIntents);

    requirements.push({
      requirementId: `VIS-${String(index + 1).padStart(3, "0")}`,
      segmentId,
      purpose,
      preferredKinds,
      factIds,
      evidenceRequired,
      searchIntents,
    });
  }

  const coveredSegments = new Set(
    requirements.map((item) => item.segmentId),
  );

  for (const segment of params.segments) {
    if (!coveredSegments.has(segment.segmentId)) {
      throw new Error(
        `VISUAL_DIRECTOR: ${segment.segmentId} 화면 요구가 없습니다.`,
      );
    }
  }

  return requirements;
}

function buildPrompt(segments: NewsArticleSegmentInput[]): string {
  return [
    "당신은 K-AGRI ACTION NEWS의 Visual Director다.",
    "",
    "임무:",
    "이미 완성된 뉴스 기사와 실제 내레이션 구간을 읽고,",
    "각 구간에서 시청자가 무엇을 봐야 뉴스를 이해하고 신뢰할 수 있는지 결정한다.",
    "",
    "절대 규칙:",
    "1. 존재하지 않는 영상·사진·인터뷰·문서를 있다고 말하지 않는다.",
    "2. 실제 자산의 존재 여부를 판단하지 않는다. 그것은 후단 Reality Gate의 역할이다.",
    "3. 당신은 필요한 화면의 목적과 종류와 검색 의도만 정의한다.",
    "4. 기사에 없는 새로운 사실을 만들지 않는다.",
    "5. 입력 segment에 없는 FACT ID를 만들지 않는다.",
    "6. 공식 정책·금액·자격·기한·주의사항 등 사실 증명이 중요한 경우 evidenceRequired=true로 한다.",
    "7. 공식 주장에 대한 직접 증거가 필요하면 OFFICIAL_DOCUMENT 또는 OFFICIAL_WEBPAGE를 우선 고려한다.",
    "8. 그렇다고 모든 구간을 문서 화면으로 만들지 않는다.",
    "9. 실제 뉴스처럼 현장영상, 관련영상, 사진, 공식문서, 데이터그래픽, 지도, 행동카드 등을 내용에 맞게 조합한다.",
    "10. 화면 종류를 role 이름만 보고 기계적으로 결정하지 않는다. narration의 의미를 읽는다.",
    "11. FIELD_VIDEO나 INTERVIEW가 필요하다고 판단해도 확보됐다고 주장하지 않는다.",
    "12. searchIntents는 Hunter가 실제 자료를 찾을 수 있도록 구체적인 검색 목적을 적는다.",
    "13. 정치적 해설이나 평가를 추가하지 않는다.",
    "",
    `허용 화면 종류: ${ALLOWED_KINDS.join(", ")}`,
    "",
    "반드시 JSON 객체 하나만 반환한다.",
    "형식:",
    JSON.stringify(
      {
        requirements: [
          {
            segmentId: "SEG-001",
            purpose: "이 구간에서 화면이 해야 할 일",
            preferredKinds: [
              "FIELD_VIDEO",
              "RELATED_FOOTAGE",
            ],
            factIds: ["FACT-001"],
            evidenceRequired: false,
            searchIntents: [
              "Hunter가 찾아야 할 실제 자료의 검색 목적",
            ],
          },
        ],
      },
      null,
      2,
    ),
    "",
    "모든 segment에는 최소 1개의 requirement가 있어야 한다.",
    "필요하면 하나의 segment에 여러 requirement를 만들 수 있다.",
    "",
    "입력 기사:",
    JSON.stringify(segments, null, 2),
  ].join("\n");
}

export async function directNewsVisuals(input: {
  segments: NewsArticleSegmentInput[];
  model?: string;
}): Promise<NewsVisualDirectorResult> {
  if (!input.segments.length) {
    throw new Error(
      "VISUAL_DIRECTOR: 기사 segment가 없습니다.",
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 없습니다.");
  }

  const model =
    input.model ||
    process.env.OPENAI_NEWS_VISUAL_MODEL ||
    "gpt-4.1-mini";

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildPrompt(input.segments),
          },
        ],
      },
    ] as any,
  });

  const parsed = parseJsonObject(
    response.output_text || "",
  );

  const requirements = validateRequirements({
    raw: parsed,
    segments: input.segments,
  });

  return {
    version: ACTION_NEWS_VISUAL_DIRECTOR_VERSION,
    model,
    requirements,
  };
}
