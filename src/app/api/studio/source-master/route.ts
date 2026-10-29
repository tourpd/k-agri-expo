import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), ".jopd-media");

async function readJson(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
) {
  return aStart < bEnd && aEnd > bStart;
}

function compact(value: unknown, max = 14000) {
  const text = JSON.stringify(value);
  if (text.length <= max) return value;

  return {
    truncated: true,
    preview: text.slice(0, max),
  };
}

type BlockRange = {
  start: number;
  end: number;
  reason: string;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD SOURCE MASTER",
    version: "1.2.0",
    stage: "WHOLE SHOOT INTEGRATION",
    principle:
      "촬영순서와 방송순서를 분리한다. 사실은 창작하지 않는다.",
  });
}

export async function POST(_req: NextRequest) {
  try {
    const manifestPath = path.join(
      ROOT,
      "jopd-source-manifest.json"
    );

    if (!(await exists(manifestPath))) {
      throw new Error("jopd-source-manifest.json 없음");
    }

    const manifest = await readJson(manifestPath);
    const sources = manifest.sources || [];

    if (sources.length !== 10) {
      throw new Error(
        `대표 SOURCE가 10개가 아닙니다: ${sources.length}`
      );
    }

    const preparedSources = [];

    // SOURCE TRUTH:
    // BLOCK 음성의 최종 권한은 AI가 아니라 코드가 가진다.
    const authoritativeBlockedAudio: Array<{
      sourceName: string;
      start: number;
      end: number;
      rawText: string;
      reason: string;
    }> = [];

    for (const source of sources) {
      const uploadId = source.uploadId;
      const sourceName = source.sourceName;

      const base = path.join(ROOT, uploadId);

      const transcriptPath = path.join(
        base,
        "transcript.json"
      );

      const brain10Path = path.join(
        base,
        "video-brain",
        "source-understanding.json"
      );

      const brain11Path = path.join(
        base,
        "video-brain",
        "precision-analysis.json"
      );

      const verificationPath = path.join(
        base,
        "audio-truth",
        "verification.json"
      );

      if (
        !(await exists(transcriptPath)) ||
        !(await exists(brain10Path)) ||
        !(await exists(brain11Path))
      ) {
        throw new Error(
          `${sourceName}: SOURCE MASTER 필수 분석파일 없음`
        );
      }

      const transcript = await readJson(transcriptPath);
      const brain10 = await readJson(brain10Path);
      const brain11 = await readJson(brain11Path);

      const blockRanges: BlockRange[] = [];

      // SOURCE별 AUDIO TRUTH 1.3 결과
      if (await exists(verificationPath)) {
        const verification = await readJson(
          verificationPath
        );

        for (const item of verification.results || []) {
          const original = item.original || {};
          const evaluation = item.evaluation || {};

          if (evaluation.editorialUse === "BLOCK") {
            blockRanges.push({
              start: Number(original.start || 0),
              end: Number(original.end || 0),
              reason:
                evaluation.status ||
                "AUDIO_TRUTH_BLOCK",
            });
          }
        }
      }

      // 상투문구 집중검증 결과도 반드시 병합
      const formulaicPath = path.join(
        ROOT,
        "audio-truth-formulaic-result.json"
      );

      if (await exists(formulaicPath)) {
        const formulaic = await readJson(
          formulaicPath
        );

        const sourceResult = (
          formulaic.results || []
        ).find(
          (item: { sourceName?: string }) =>
            item.sourceName === sourceName
        );

        for (
          const item of sourceResult?.formulaic || []
        ) {
          if (item.editorialUse !== "BLOCK") {
            continue;
          }

          const start = Number(item.start || 0);
          const end = Number(item.end || 0);

          const duplicate = blockRanges.some(
            (range) =>
              Math.abs(range.start - start) < 0.05 &&
              Math.abs(range.end - end) < 0.05
          );

          if (!duplicate) {
            blockRanges.push({
              start,
              end,
              reason:
                item.status ||
                "FORMULAIC_AUDIO_BLOCK",
            });
          }
        }
      }

      const audioSegments = (transcript.segments || []).map(
        (seg: {
          start?: number;
          end?: number;
          text?: string;
          audioTruth?: {
            status?: string;
          };
        }) => {
          const start = Number(seg.start || 0);
          const end = Number(seg.end || 0);
          const text = String(seg.text || "");

          const blocked = blockRanges.find((b) =>
            overlaps(start, end, b.start, b.end)
          );

          const localStatus =
            seg.audioTruth?.status || "UNVERIFIED";

          let editorialStatus:
            | "BLOCK"
            | "CANDIDATE_AUDIO"
            | "NEEDS_REVIEW";

          if (blocked) {
            editorialStatus = "BLOCK";
          } else if (
            localStatus === "SUSPECT" ||
            localStatus === "REVIEW"
          ) {
            editorialStatus = "NEEDS_REVIEW";
          } else {
            editorialStatus = "CANDIDATE_AUDIO";
          }

          return {
            start,
            end,
            rawText: text,
            audioTruthStatus: localStatus,
            editorialStatus,
            blockReason: blocked?.reason || null,
          };
        }
      );

      for (const seg of audioSegments) {
        if (seg.editorialStatus === "BLOCK") {
          authoritativeBlockedAudio.push({
            sourceName,
            start: seg.start,
            end: seg.end,
            rawText: seg.rawText,
            reason:
              seg.blockReason ||
              "AUDIO_TRUTH_BLOCK",
          });
        }
      }

      // BLOCK 음성은 SOURCE MASTER AI에게
      // 문장 자체를 전달하지 않는다.
      const safeAudioSegments = audioSegments.filter(
        (seg: { editorialStatus: string }) =>
          seg.editorialStatus !== "BLOCK"
      );

      preparedSources.push({
        sourceName,
        uploadId,
        duration: brain10.duration,

        IMPORTANT_AUDIO_RULE:
          "제공된 음성도 사실 확정이 아니다. BLOCK 음성은 입력에서 제거되었다.",

        audioSegments: safeAudioSegments,

        visualOverview: compact(
          brain10.understanding
        ),

        precisionVision: compact(
          brain11.analyses
        ),
      });
    }

    const systemPrompt = `
당신은 JOPD SOURCE MASTER다.

당신의 임무는 편집안을 만드는 것이 아니다.
10개의 촬영 원본을 하나의 취재물로 통합해서
"실제로 무엇을 찍어왔는가"를 파악하는 것이다.

가장 중요한 규칙:

1. SOURCE TRUTH
원본에서 관찰되거나 들린 근거와
AI의 추론을 절대로 섞지 않는다.

2. 촬영순서는 방송순서가 아니다.
파일 번호와 촬영 순서대로 이야기를 만들지 않는다.

3. VIDEO FACT
영상 분석에서 실제 관찰된 인물, 장소, 사물,
행동, 과정, 표정, 움직임, 구도 등을 정리한다.

4. AUDIO
audioSegments의 editorialStatus를 반드시 따른다.

BLOCK:
- 사실 근거로 사용 금지
- 직접 인용 금지
- 자막 근거 사용 금지
- Q/A 근거 사용 금지

NEEDS_REVIEW:
- 후보로만 기록
- 사실로 확정하지 않는다

CANDIDATE_AUDIO:
- 사용 가능한 음성 후보일 뿐
- 자동으로 사실 확정하지 않는다

5. 사용자가 실제로 말하지 않았다고 확인한
"감사합니다", "시청해주셔서 감사합니다",
"다음 영상으로 이어집니다" 같은 ASR 문구를
스토리 사실로 복구하지 않는다.

6. WHY SHOT
"왜 이 장면을 찍었는가"는 추론할 수 있다.
그러나 반드시:
- inference
- evidence
- confidence
를 분리한다.

7. 같은 장면/내용의 반복과 중복을 찾아라.

8. 아직 방송 순서, 내레이션, 제목, 오프닝,
엔딩을 만들지 않는다.

9. 원본에서 확인할 수 없는 역사, 지리,
제품효능, 수치 등 외부 사실을 추가하지 않는다.

10. 홍삼마늘이라고 잘못 전사되었을 가능성이 있어도
원문을 임의 수정해 사실로 확정하지 않는다.
대상 작물의 정식 명칭은 별도 확인 대상으로 둔다.

출력은 JSON만 반환한다.

정확한 구조:

{
  "shootSummary": "",
  "whatWasActuallyShot": [
    {
      "subject": "",
      "evidence": [
        {
          "sourceName": "",
          "start": 0,
          "end": 0,
          "basis": "VISION|AUDIO_CANDIDATE",
          "description": ""
        }
      ],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "people": [
    {
      "temporaryId": "",
      "observedRole": "",
      "sourceRefs": []
    }
  ],
  "places": [
    {
      "description": "",
      "sourceRefs": [],
      "identityStatus": "OBSERVED|INFERRED|UNKNOWN"
    }
  ],
  "actionsAndEvents": [],
  "strongVisuals": [
    {
      "sourceName": "",
      "start": 0,
      "end": 0,
      "description": "",
      "storyValue": ""
    }
  ],
  "audioCandidates": [
    {
      "sourceName": "",
      "start": 0,
      "end": 0,
      "rawText": "",
      "status": "CANDIDATE|NEEDS_REVIEW"
    }
  ],
  "blockedAudio": [
    {
      "sourceName": "",
      "start": 0,
      "end": 0,
      "rawText": "",
      "reason": ""
    }
  ],
  "questionsAndAnswers": [
    {
      "question": "",
      "answer": "",
      "sourceRefs": [],
      "verificationStatus": "CANDIDATE|NEEDS_REVIEW"
    }
  ],
  "numbersAndFactsCandidates": [
    {
      "claim": "",
      "sourceRefs": [],
      "verificationStatus": "NEEDS_CONFIRMATION"
    }
  ],
  "shootingIntentInferences": [
    {
      "inference": "",
      "evidence": [],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "storyIngredients": [],
  "duplicates": [],
  "gapsInMaterial": [],
  "unknowns": [],
  "editorialInventory": {
    "evidence": [],
    "explanation": [],
    "people": [],
    "emotion": [],
    "movement": [],
    "process": [],
    "results": [],
    "atmosphere": [],
    "transitions": []
  },
  "sourceBySource": [
    {
      "sourceName": "",
      "actualContent": "",
      "bestMaterial": [],
      "cautions": []
    }
  ]
}
`;

    const userPayload = JSON.stringify(
      {
        project: "JOPD AI 방송국",
        stage: "SOURCE MASTER",
        sourceCount: preparedSources.length,
        sources: preparedSources,
      },
      null,
      2
    );

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 없음");
    }

    const model =
      process.env.OPENAI_CRM_MODEL ||
      process.env.OPENAI_JOPD_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_CRM_MODEL / OPENAI_JOPD_MODEL 없음"
      );
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
          instructions: systemPrompt,
          input: userPayload,
        }),
      }
    );

    const raw = await response.json();

    if (!response.ok) {
      throw new Error(
        raw?.error?.message ||
        "OpenAI SOURCE MASTER 호출 실패"
      );
    }

    const outputText =
      raw.output_text ||
      raw.output
        ?.flatMap(
          (item: {
            content?: Array<{
              type?: string;
              text?: string;
            }>;
          }) => item.content || []
        )
        ?.filter(
          (item: { type?: string }) =>
            item.type === "output_text"
        )
        ?.map(
          (item: { text?: string }) =>
            item.text || ""
        )
        ?.join("") ||
      "";

    if (!outputText) {
      throw new Error(
        "SOURCE MASTER 응답 텍스트 없음"
      );
    }

    let clean = outputText.trim();

    clean = clean
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");

    let master;

    try {
      master = JSON.parse(clean);
    } catch {
      const debugPath = path.join(
        ROOT,
        "source-master-invalid-output.txt"
      );

      await fs.writeFile(
        debugPath,
        outputText,
        "utf8"
      );

      throw new Error(
        "SOURCE MASTER AI JSON 파싱 실패. 원문을 source-master-invalid-output.txt에 저장했습니다."
      );
    }

    // ------------------------------------------------
    // SOURCE MASTER CODE SAFETY LAYER
    // ------------------------------------------------

    // 편집용 설명에서는 프로젝트 기준 명칭을 사용한다.
    // rawText는 ASR 감사용 원문이므로 수정하지 않는다.
    function normalizeEditorialNames(
      value: unknown,
      key = ""
    ): unknown {
      if (typeof value === "string") {
        if (key === "rawText") {
          return value;
        }

        return value
          .replaceAll("홍삼마늘", "홍산마늘")
          .replaceAll("홍삼만", "홍산마늘");
      }

      if (Array.isArray(value)) {
        return value.map((item) =>
          normalizeEditorialNames(item)
        );
      }

      if (
        value !== null &&
        typeof value === "object"
      ) {
        const normalized: Record<
          string,
          unknown
        > = {};

        for (
          const [childKey, childValue]
          of Object.entries(value)
        ) {
          normalized[childKey] =
            normalizeEditorialNames(
              childValue,
              childKey
            );
        }

        return normalized;
      }

      return value;
    }

    master = normalizeEditorialNames(
      master
    ) as typeof master;

    // AI가 BLOCK 목록을 누락해도
    // 최종 SOURCE MASTER에서는 코드 목록으로 덮어쓴다.
    master.blockedAudio =
      authoritativeBlockedAudio;

    const result = {
      engine: "JOPD SOURCE MASTER",
      version: "1.2.0",
      stage: "WHOLE SHOOT INTEGRATION",
      principle:
        "촬영순서와 방송순서를 분리하고 먼저 전체 촬영물을 이해한다.",
      sourceCount: preparedSources.length,
      master,
      createdAt: new Date().toISOString(),
    };

    const outputPath = path.join(
      ROOT,
      "jopd-source-master.json"
    );

    await fs.writeFile(
      outputPath,
      JSON.stringify(result, null, 2),
      "utf8"
    );

    return NextResponse.json({
      ok: true,
      outputPath:
        ".jopd-media/jopd-source-master.json",
      result,
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
