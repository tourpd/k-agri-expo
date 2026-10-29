import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type VisualFrameInput = {
  index: number;
  timeSeconds: number;
  imagePath: string;
};

export type VisualFrameObservation = {
  frameIndex: number;
  timeSeconds: number;

  observed: {
    setting: string | null;
    people: string[];
    actions: string[];
    objects: string[];
    screenText: string[];
    shotDescription: string | null;
    cameraOrComposition: string | null;
    graphicElements: string[];
  };

  possibleFunctions: string[];

  uncertainty: string[];

  evidencePolicy: {
    observedFactOnly: true;
    creatorIntentIsNotFact: true;
  };
};

export type VisualEvidence = {
  version: "JOPD_BROADCAST_VISUAL_EVIDENCE_V1";
  visualEvidenceId: string;
  createdAt: string;

  truthClass: "OBSERVED_EVENT";
  evidenceType: "VIDEO_OBSERVATION";

  model: string;

  source: {
    frameCount: number;
    sourceTimebase: "SECONDS_FROM_SOURCE_START";
  };

  observations: VisualFrameObservation[];

  evidencePolicy: {
    approvedMemory: false;
    requiresDeepResearch: true;
    noIdentityGuessing: true;
    noCreatorIntentGuessing: true;
    screenTextIsObservationNotTranscript: true;
  };
};

type ResponsesApiOutput = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type RawVisualObservation = {
  frameIndex?: number;
  timeSeconds?: number;

  observed?: {
    setting?: string | null;
    people?: unknown;
    actions?: unknown;
    objects?: unknown;
    screenText?: unknown;
    shotDescription?: string | null;
    cameraOrComposition?: string | null;
    graphicElements?: unknown;
  };

  possibleFunctions?: unknown;
  uncertainty?: unknown;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractOutputText(payload: ResponsesApiOutput): string {
  if (
    typeof payload.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  const texts: string[] = [];

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        typeof content.text === "string" &&
        content.text.trim()
      ) {
        texts.push(content.text.trim());
      }
    }
  }

  return texts.join("\n").trim();
}

function parseJsonText(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(
      /```(?:json)?\s*([\s\S]*?)```/i,
    );

    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }

    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");

    if (
      firstBracket >= 0 &&
      lastBracket > firstBracket
    ) {
      return JSON.parse(
        trimmed.slice(firstBracket, lastBracket + 1),
      );
    }

    throw new Error(
      "Visual Evidence 응답에서 JSON을 찾지 못했습니다",
    );
  }
}

async function atomicJsonWrite(
  targetPath: string,
  value: unknown,
): Promise<void> {
  const tempPath = `${targetPath}.tmp-${process.pid}`;

  await fs.writeFile(
    tempPath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );

  await fs.rename(tempPath, targetPath);
}

async function imageToDataUrl(
  imagePath: string,
): Promise<string> {
  const bytes = await fs.readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();

  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function normalizeObservation(
  raw: RawVisualObservation,
  expected: VisualFrameInput,
): VisualFrameObservation {
  const observed = raw.observed ?? {};

  return {
    frameIndex: expected.index,
    timeSeconds: expected.timeSeconds,

    observed: {
      setting:
        typeof observed.setting === "string"
          ? observed.setting.trim() || null
          : null,

      people: stringArray(observed.people),
      actions: stringArray(observed.actions),
      objects: stringArray(observed.objects),
      screenText: stringArray(observed.screenText),

      shotDescription:
        typeof observed.shotDescription === "string"
          ? observed.shotDescription.trim() || null
          : null,

      cameraOrComposition:
        typeof observed.cameraOrComposition === "string"
          ? observed.cameraOrComposition.trim() || null
          : null,

      graphicElements: stringArray(
        observed.graphicElements,
      ),
    },

    possibleFunctions: stringArray(
      raw.possibleFunctions,
    ),

    uncertainty: stringArray(raw.uncertainty),

    evidencePolicy: {
      observedFactOnly: true,
      creatorIntentIsNotFact: true,
    },
  };
}

export async function createVisualEvidence(input: {
  frames: VisualFrameInput[];
  outputDir: string;
  batchSize?: number;
}): Promise<VisualEvidence> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 없음");
  }

  if (!input.frames.length) {
    throw new Error("분석할 프레임이 없습니다");
  }

  const model =
    process.env.OPENAI_JOPD_VISION_MODEL ||
    process.env.OPENAI_CRM_MODEL ||
    process.env.OPENAI_JOPD_MODEL ||
    "gpt-5.6";

  const batchSize = Math.max(
    1,
    Math.min(input.batchSize ?? 5, 8),
  );

  const observations: VisualFrameObservation[] = [];

  for (
    let offset = 0;
    offset < input.frames.length;
    offset += batchSize
  ) {
    const batch = input.frames.slice(
      offset,
      offset + batchSize,
    );

    const content: Array<
      | {
          type: "input_text";
          text: string;
        }
      | {
          type: "input_image";
          image_url: string;
        }
    > = [];

    content.push({
      type: "input_text",
      text: `
당신은 JOPD BROADCAST HUNTER의 Visual Evidence Observer다.

이 단계는 작품평론도, 요약도, 창작도 아니다.
오직 각 방송 프레임에서 실제로 관찰 가능한 시각 Evidence를 기록한다.

절대 규칙:

1. 실제 인물의 이름이나 신원을 추측하지 않는다.
2. 창작자의 의도를 사실처럼 단정하지 않는다.
3. 화면에서 보이지 않는 사건을 만들어내지 않는다.
4. 자막은 보이는 범위에서 정확히 읽되 불확실하면 uncertainty에 기록한다.
5. possibleFunctions는 "가능한 화면 기능"일 뿐 FACT가 아니다.
6. 프레임 사이에서 일어난 행동을 상상하지 않는다.
7. 사람은 "남성 1명", "여성 여러 명", "인터뷰 대상처럼 보이는 인물"처럼 시각적으로만 기술한다.
8. 화면구도, 클로즈업/와이드, 그래픽 자막, 장소, 행동, 물체를 관찰한다.
9. JSON 외의 문장은 출력하지 않는다.

아래 프레임들은 SOURCE 영상의 시간 순서다.

${batch
  .map(
    (frame, i) =>
      `IMAGE_${i + 1}: frameIndex=${frame.index}, timeSeconds=${frame.timeSeconds}`,
  )
  .join("\n")}

반드시 아래 JSON 배열 하나만 출력한다.

[
  {
    "frameIndex": 0,
    "timeSeconds": 0,
    "observed": {
      "setting": null,
      "people": [],
      "actions": [],
      "objects": [],
      "screenText": [],
      "shotDescription": null,
      "cameraOrComposition": null,
      "graphicElements": []
    },
    "possibleFunctions": [],
    "uncertainty": []
  }
]

배열의 원소 수와 순서는 입력 이미지 수와 정확히 같아야 한다.
`.trim(),
    });

    for (const frame of batch) {
      content.push({
        type: "input_image",
        image_url: await imageToDataUrl(
          frame.imagePath,
        ),
      });
    }

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
              role: "user",
              content,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Visual Evidence API 실패: ${await response.text()}`,
      );
    }

    const payload =
      (await response.json()) as ResponsesApiOutput;

    const text = extractOutputText(payload);

    if (!text) {
      throw new Error(
        "Visual Evidence API가 빈 응답을 반환했습니다",
      );
    }

    const parsed = parseJsonText(text);

    if (!Array.isArray(parsed)) {
      throw new Error(
        "Visual Evidence 응답이 JSON 배열이 아닙니다",
      );
    }

    if (parsed.length !== batch.length) {
      throw new Error(
        `Visual Evidence 프레임 수 불일치: expected=${batch.length}, actual=${parsed.length}`,
      );
    }

    for (let i = 0; i < batch.length; i += 1) {
      observations.push(
        normalizeObservation(
          parsed[i] as RawVisualObservation,
          batch[i],
        ),
      );
    }
  }

  const visualEvidenceId = createHash("sha256")
    .update(
      observations
        .map(
          (item) =>
            `${item.frameIndex}:${item.timeSeconds}:${JSON.stringify(item.observed)}`,
        )
        .join("\n"),
    )
    .digest("hex")
    .slice(0, 20);

  const result: VisualEvidence = {
    version:
      "JOPD_BROADCAST_VISUAL_EVIDENCE_V1",

    visualEvidenceId,
    createdAt: new Date().toISOString(),

    truthClass: "OBSERVED_EVENT",
    evidenceType: "VIDEO_OBSERVATION",

    model,

    source: {
      frameCount: input.frames.length,
      sourceTimebase:
        "SECONDS_FROM_SOURCE_START",
    },

    observations,

    evidencePolicy: {
      approvedMemory: false,
      requiresDeepResearch: true,
      noIdentityGuessing: true,
      noCreatorIntentGuessing: true,
      screenTextIsObservationNotTranscript: true,
    },
  };

  const outputDir = path.resolve(
    input.outputDir,
  );

  await fs.mkdir(outputDir, {
    recursive: true,
  });

  await atomicJsonWrite(
    path.join(
      outputDir,
      "visual-evidence.json",
    ),
    result,
  );

  return result;
}
