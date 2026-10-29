import OpenAI from "openai";

import {
  type NewsArticleSegmentInput,
  type NewsVisualKind,
} from "./visual-plan";

export const ACTION_NEWS_VISUAL_DIRECTOR_V2_VERSION =
  "K_AGRI_ACTION_NEWS_VISUAL_DIRECTOR_BEATS_V2";

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

export type NewsVisualBeat = {
  beatId: string;
  segmentId: string;

  /**
   * Seconds relative to the beginning of the segment.
   * A beat occupies real editorial screen time.
   */
  relativeStartSeconds: number;
  relativeEndSeconds: number;

  purpose: string;

  /**
   * Alternatives for THIS beat.
   * One verified asset of any listed kind may satisfy this beat.
   * If two different screens are required, they MUST be separate beats.
   */
  preferredKinds: NewsVisualKind[];

  factIds: string[];
  evidenceRequired: boolean;
  searchIntents: string[];
};

export type NewsVisualDirectorV2Result = {
  version: typeof ACTION_NEWS_VISUAL_DIRECTOR_V2_VERSION;
  model: string;
  beats: NewsVisualBeat[];
};

type RawBeat = {
  segmentId?: unknown;
  relativeStartSeconds?: unknown;
  relativeEndSeconds?: unknown;
  purpose?: unknown;
  preferredKinds?: unknown;
  factIds?: unknown;
  evidenceRequired?: unknown;
  searchIntents?: unknown;
};

type RawDirectorResponse = {
  beats?: unknown;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeKinds(value: unknown): NewsVisualKind[] {
  return stringArray(value).filter(
    (kind): kind is NewsVisualKind =>
      ALLOWED_KINDS.includes(kind as NewsVisualKind),
  );
}

function finiteNumber(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").trim());

  if (!Number.isFinite(n)) {
    throw new Error(
      `VISUAL_DIRECTOR_V2: 유효하지 않은 시간값 ${String(value)}`,
    );
  }

  return n;
}

function roundTime(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function parseJsonObject(raw: string): RawDirectorResponse {
  const text = raw.trim();

  if (!text) {
    throw new Error(
      "VISUAL_DIRECTOR_V2: OpenAI 응답이 비었습니다.",
    );
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
      throw new Error(
        "VISUAL_DIRECTOR_V2: JSON 객체를 찾지 못했습니다.",
      );
    }

    return JSON.parse(
      withoutFence.slice(start, end + 1),
    ) as RawDirectorResponse;
  }
}

function validateBeats(params: {
  raw: RawDirectorResponse;
  segments: NewsArticleSegmentInput[];
}): NewsVisualBeat[] {
  if (!Array.isArray(params.raw.beats)) {
    throw new Error(
      "VISUAL_DIRECTOR_V2: beats 배열이 없습니다.",
    );
  }

  const segmentById = new Map(
    params.segments.map((segment) => [
      segment.segmentId,
      segment,
    ]),
  );

  const beats: NewsVisualBeat[] = [];

  for (const [index, item] of params.raw.beats.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(
        `VISUAL_DIRECTOR_V2: beat ${index + 1} 형식 오류`,
      );
    }

    const raw = item as RawBeat;
    const segmentId = String(raw.segmentId || "").trim();
    const segment = segmentById.get(segmentId);

    if (!segment) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: 존재하지 않는 segmentId ${segmentId}`,
      );
    }

    const duration = roundTime(
      segment.endSeconds - segment.startSeconds,
    );

    if (!(duration > 0)) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segmentId} duration 오류`,
      );
    }

    const relativeStartSeconds = roundTime(
      finiteNumber(raw.relativeStartSeconds),
    );

    const relativeEndSeconds = roundTime(
      finiteNumber(raw.relativeEndSeconds),
    );

    if (
      relativeStartSeconds < 0 ||
      relativeEndSeconds <= relativeStartSeconds ||
      relativeEndSeconds > duration + 0.05
    ) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segmentId} beat 시간이 segment 범위를 벗어났습니다. ` +
          `${relativeStartSeconds}-${relativeEndSeconds} / ${duration}`,
      );
    }

    const purpose = String(raw.purpose || "").trim();

    if (!purpose) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segmentId} purpose가 없습니다.`,
      );
    }

    const preferredKinds = normalizeKinds(
      raw.preferredKinds,
    );

    if (!preferredKinds.length) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segmentId} 화면 종류가 없습니다.`,
      );
    }

    const requestedFactIds = stringArray(raw.factIds);

    const factIds = requestedFactIds.filter((factId) =>
      segment.factIds.includes(factId),
    );

    if (factIds.length !== requestedFactIds.length) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segmentId}에 없는 FACT ID를 생성했습니다.`,
      );
    }

    beats.push({
      beatId: `BEAT-${String(index + 1).padStart(3, "0")}`,
      segmentId,
      relativeStartSeconds,
      relativeEndSeconds,
      purpose,
      preferredKinds,
      factIds,
      evidenceRequired:
        raw.evidenceRequired === true,
      searchIntents: stringArray(raw.searchIntents),
    });
  }

  const EPSILON = 0.08;

  for (const segment of params.segments) {
    const duration = roundTime(
      segment.endSeconds - segment.startSeconds,
    );

    const segmentBeats = beats
      .filter((beat) => beat.segmentId === segment.segmentId)
      .sort(
        (a, b) =>
          a.relativeStartSeconds - b.relativeStartSeconds,
      );

    if (!segmentBeats.length) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segment.segmentId} beat가 없습니다.`,
      );
    }

    if (
      Math.abs(segmentBeats[0].relativeStartSeconds) >
      EPSILON
    ) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segment.segmentId} 화면이 0초부터 시작하지 않습니다.`,
      );
    }

    for (let i = 1; i < segmentBeats.length; i += 1) {
      const previous = segmentBeats[i - 1];
      const current = segmentBeats[i];

      const delta =
        current.relativeStartSeconds -
        previous.relativeEndSeconds;

      if (Math.abs(delta) > EPSILON) {
        throw new Error(
          `VISUAL_DIRECTOR_V2: ${segment.segmentId} beat 사이에 ` +
            `공백 또는 겹침이 있습니다. ${previous.beatId} -> ${current.beatId}`,
        );
      }
    }

    const last =
      segmentBeats[segmentBeats.length - 1];

    if (
      Math.abs(last.relativeEndSeconds - duration) >
      EPSILON
    ) {
      throw new Error(
        `VISUAL_DIRECTOR_V2: ${segment.segmentId} 전체 시간을 덮지 못했습니다. ` +
          `beatEnd=${last.relativeEndSeconds}, duration=${duration}`,
      );
    }
  }

  return beats;
}

function buildPrompt(
  segments: NewsArticleSegmentInput[],
): string {
  return [
    "당신은 K-AGRI ACTION NEWS의 Visual Director다.",
    "",
    "임무:",
    "완성된 뉴스 기사와 실제 내레이션 시간을 읽고,",
    "각 segment를 실제 방송 편집 단위인 visual beat로 나눈다.",
    "",
    "visual beat란:",
    "화면에서 하나의 시각적 목적을 수행하는 연속 시간 구간이다.",
    "한 segment에 실제로 서로 다른 화면이 필요하면 반드시 여러 beat로 나눈다.",
    "",
    "절대 규칙:",
    "1. 존재하지 않는 영상·사진·인터뷰·문서를 확보됐다고 주장하지 않는다.",
    "2. 실제 자산 존재 여부는 판단하지 않는다. 후단 Reality Gate가 판단한다.",
    "3. 기사에 없는 새로운 사실을 만들지 않는다.",
    "4. segment에 없는 FACT ID를 만들지 않는다.",
    "5. preferredKinds는 한 beat를 만족할 수 있는 대체 가능한 종류다.",
    "6. preferredKinds에 여러 종류를 넣었다고 여러 화면을 확보한 것이 아니다.",
    "7. 서로 다른 화면이 필요하면 반드시 별도 beat로 분리한다.",
    "8. 모든 beat는 해당 segment의 시간을 처음부터 끝까지 빈틈없이 덮어야 한다.",
    "9. beat끼리 시간을 겹치게 하지 않는다.",
    "10. 고정된 초수 공식이나 고정된 화면 조합을 사용하지 않는다.",
    "11. narration의 의미와 실제 segment 길이에 따라 beat 수와 길이를 판단한다.",
    "11-A. 긴 segment를 하나의 화면으로 단순히 끝까지 덮지 않는다.",
    "11-B. narration 안에서 대상·장소·근거·수치·행동·설명의 역할이 바뀌는 지점을 찾아 별도 visual beat로 분리한다.",
    "11-C. 단일 visual beat는 9초를 넘기지 않는다. 단, 이를 일정 간격으로 기계적으로 자르라는 뜻이 아니며 실제 의미 변화 지점을 사용한다.",
    "11-D. 여러 preferredKinds를 한 beat에 넣는 것으로 화면 전환을 대신하지 않는다.",
    "12. 공식 정책·금액·자격·기한·주의사항을 직접 증명하는 beat는 evidenceRequired=true로 한다.",
    "13. 공식 증거 beat에는 OFFICIAL_DOCUMENT 또는 OFFICIAL_WEBPAGE를 우선 고려한다.",
    "14. 공식 증거가 있다고 해서 segment 전체를 문서로 채우지 않는다.",
    "15. 현장영상·관련영상·사진·공식문서·데이터그래픽·지도·행동카드 등을 뉴스 내용에 맞게 조합할 수 있다.",
    "16. FIELD_VIDEO나 INTERVIEW가 필요해도 존재한다고 가정하지 않는다.",
    "17. searchIntents는 Hunter가 실제 자산을 찾기 위한 구체적 검색 목적이다.",
    "18. 정치적 해설이나 평가를 추가하지 않는다.",
    "",
    `허용 화면 종류: ${ALLOWED_KINDS.join(", ")}`,
    "",
    "시간 규칙:",
    "- relativeStartSeconds와 relativeEndSeconds는 segment 시작점을 0초로 본 상대시간이다.",
    "- 첫 beat는 반드시 0초에서 시작한다.",
    "- 다음 beat는 직전 beat가 끝나는 시간에서 시작한다.",
    "- 마지막 beat는 segment 전체 duration에서 끝난다.",
    "",
    "반드시 JSON 객체 하나만 반환한다.",
    "형식:",
    JSON.stringify(
      {
        beats: [
          {
            segmentId: "SEG-001",
            relativeStartSeconds: 0,
            relativeEndSeconds: 4.2,
            purpose: "이 시간 동안 화면이 해야 할 일",
            preferredKinds: [
              "FIELD_VIDEO",
              "RELATED_FOOTAGE",
            ],
            factIds: [],
            evidenceRequired: false,
            searchIntents: [
              "Hunter가 실제 자료를 찾기 위한 검색 목적",
            ],
          },
          {
            segmentId: "SEG-001",
            relativeStartSeconds: 4.2,
            relativeEndSeconds: 10.52,
            purpose: "다음 화면이 해야 할 별도 역할",
            preferredKinds: [
              "OFFICIAL_DOCUMENT",
              "DATA_GRAPHIC",
            ],
            factIds: ["FACT-001"],
            evidenceRequired: true,
            searchIntents: [
              "필요한 실제 증거 또는 자료의 검색 목적",
            ],
          },
        ],
      },
      null,
      2,
    ),
    "",
    "위 숫자와 FACT ID는 형식 설명용 예시일 뿐이다.",
    "실제 출력은 아래 입력 segment의 시간과 FACT만 사용한다.",
    "",
    "입력 기사:",
    JSON.stringify(
      segments.map((segment) => ({
        ...segment,
        canonicalDurationSeconds: roundTime(
          segment.endSeconds - segment.startSeconds,
        ),
      })),
      null,
      2,
    ),
  ].join("\n");
}

export async function directNewsVisualsV2(input: {
  segments: NewsArticleSegmentInput[];
  model?: string;
}): Promise<NewsVisualDirectorV2Result> {
  if (!input.segments.length) {
    throw new Error(
      "VISUAL_DIRECTOR_V2: 기사 segment가 없습니다.",
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

  const originalPrompt = buildPrompt(input.segments);
  let prompt = originalPrompt;
  let beats: NewsVisualBeat[] | null = null;
  let lastError: unknown = null;

  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ] as any,
    });

    const rawOutput = response.output_text || "";

    try {
      const parsed = parseJsonObject(rawOutput);

      beats = validateBeats({
        raw: parsed,
        segments: input.segments,
      });

      break;
    } catch (error) {
      lastError = error;

      if (attempt >= MAX_ATTEMPTS) {
        break;
      }

      const validationError =
        error instanceof Error ? error.message : String(error);

      const canonicalDurations = input.segments
        .map((segment) =>
          `${segment.segmentId}=${roundTime(segment.endSeconds - segment.startSeconds)}초`
        )
        .join(", ");

      prompt = [
        originalPrompt,
        "",
        "이전 출력은 deterministic Reality/Timeline Gate를 통과하지 못했다.",
        "아래의 실제 이전 JSON 출력과 검증 오류를 직접 비교해서 수정하라.",
        "검증 오류와 관계없는 segment는 불필요하게 변경하지 마라.",
        "JSON 전체를 다시 반환하라.",
        "기사와 FACT를 변경하거나 새로운 사실을 추가하지 마라.",
        "존재하지 않는 영상·사진·문서 자산을 존재한다고 주장하지 마라.",
        "각 segment의 visual beats는 0초부터 정확한 segment duration까지",
        "공백과 겹침 없이 연속으로 전체 시간을 덮어야 한다.",
        "",
        `검증 오류: ${validationError}`,
        "",
        "이전 JSON 출력:",
        rawOutput,
      ].join("\n");
    }
  }

  if (!beats) {
    const message =
      lastError instanceof Error
        ? lastError.message
        : String(lastError || "unknown validation error");

    throw new Error(
      `VISUAL_DIRECTOR_V2: ${MAX_ATTEMPTS}회 검증 후에도 실패했습니다. ${message}`,
    );
  }

  return {
    version: ACTION_NEWS_VISUAL_DIRECTOR_V2_VERSION,
    model,
    beats,
  };
}
