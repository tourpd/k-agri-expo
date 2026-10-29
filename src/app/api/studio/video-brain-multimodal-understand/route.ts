import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_ROOT = path.resolve(
  process.cwd(),
  ".jopd-media"
);

const ENGINE =
  "JOPD VIDEO BRAIN — MULTIMODAL UNDERSTANDING";
const VERSION = "2.3.0";

type Confidence = "HIGH" | "MEDIUM" | "LOW";

type FrameRef = {
  evidenceId: string;
  time: number;
  file: string;
  source:
    | "BASELINE_2_1"
    | "DENSE_2_2";
};

type AudioRef = {
  evidenceId: string;
  start: number;
  end: number;
  text: string;
  audioTruthStatus: string;
};

type SegmentUnderstanding = {
  segmentId: string;
  start: number;
  end: number;
  status:
    | "UNDERSTOOD"
    | "NEEDS_REVIEW"
    | "FAILED";
  what: Array<{
    description: string;
    evidenceRefs: string[];
    confidence: Confidence;
  }>;
  whatHappened: Array<{
    description: string;
    evidenceRefs: string[];
    confidence: Confidence;
  }>;
  whatWasSaid: Array<{
    text: string;
    evidenceRefs: string[];
    status:
      | "CANDIDATE_AUDIO"
      | "NEEDS_REVIEW";
    confidence: Confidence;
  }>;
  audioVisualRelation: Array<{
    description: string;
    evidenceRefs: string[];
    confidence: Confidence;
  }>;
  unknowns: Array<{
    description: string;
    evidenceRefs: string[];
  }>;
};

function safeUploadId(value: unknown) {
  const uploadId = String(value || "").trim();

  if (!/^[a-zA-Z0-9_-]+$/.test(uploadId)) {
    throw new Error("잘못된 uploadId");
  }

  return uploadId;
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function readJson(filePath: string) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

function overlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
) {
  return aStart < bEnd && bStart < aEnd;
}

function absoluteInside(
  root: string,
  candidate: string
) {
  const resolved = path.resolve(candidate);
  const relative = path.relative(root, resolved);

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `MEDIA_ROOT 밖의 파일 접근 차단: ${candidate}`
    );
  }

  return resolved;
}

function extractOutputText(raw: any) {
  if (
    typeof raw?.output_text === "string" &&
    raw.output_text.trim()
  ) {
    return raw.output_text.trim();
  }

  return (
    raw?.output
      ?.flatMap(
        (item: any) => item?.content || []
      )
      ?.filter(
        (item: any) =>
          item?.type === "output_text"
      )
      ?.map(
        (item: any) => item?.text || ""
      )
      ?.join("")
      ?.trim() || ""
  );
}

function parseJsonText(text: string) {
  const clean = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(clean);
}

function evidenceRefsOf(item: any) {
  if (!Array.isArray(item?.evidenceRefs)) {
    return [];
  }

  return item.evidenceRefs
    .map((x: unknown) => String(x))
    .filter(Boolean);
}

function filterByEvidence(
  items: unknown,
  allowedEvidence: Set<string>
) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item: any) => {
    const refs = evidenceRefsOf(item);

    return (
      refs.length > 0 &&
      refs.every((ref: string) =>
        allowedEvidence.has(ref)
      )
    );
  });
}

function sanitizeUnderstanding(
  raw: any,
  segmentId: string,
  start: number,
  end: number,
  allowedEvidence: Set<string>
): SegmentUnderstanding {
  const what = filterByEvidence(
    raw?.what,
    allowedEvidence
  );

  const whatHappened = filterByEvidence(
    raw?.whatHappened,
    allowedEvidence
  );

  const whatWasSaid = filterByEvidence(
    raw?.whatWasSaid,
    allowedEvidence
  ).map((item: any) => ({
    ...item,
    status:
      item?.status === "CANDIDATE_AUDIO"
        ? "CANDIDATE_AUDIO"
        : "NEEDS_REVIEW",
  }));

  const audioVisualRelation =
    filterByEvidence(
      raw?.audioVisualRelation,
      allowedEvidence
    );

  const unknowns = filterByEvidence(
    raw?.unknowns,
    allowedEvidence
  );

  const hasEvidence =
    what.length > 0 ||
    whatHappened.length > 0 ||
    whatWasSaid.length > 0 ||
    audioVisualRelation.length > 0;

  return {
    segmentId,
    start,
    end,
    status: hasEvidence
      ? "UNDERSTOOD"
      : "NEEDS_REVIEW",
    what,
    whatHappened,
    whatWasSaid,
    audioVisualRelation,
    unknowns,
  };
}

async function imageContent(
  uploadRoot: string,
  frame: FrameRef
) {
  const filePath = absoluteInside(
    uploadRoot,
    path.isAbsolute(frame.file)
      ? frame.file
      : path.join(uploadRoot, frame.file)
  );

  const data = await fs.readFile(filePath);

  return {
    type: "input_image",
    image_url:
      `data:image/jpeg;base64,${data.toString(
        "base64"
      )}`,
    detail: "low",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uploadId = safeUploadId(
      body?.uploadId
    );

    const uploadRoot = absoluteInside(
      MEDIA_ROOT,
      path.join(MEDIA_ROOT, uploadId)
    );

    const visualPath = path.join(
      uploadRoot,
      "video-brain-v2",
      "understanding",
      "visual-evidence.json"
    );

    const densePath = path.join(
      uploadRoot,
      "video-brain-v2",
      "dense-reinspection",
      "dense-evidence.json"
    );

    const transcriptPath = path.join(
      uploadRoot,
      "transcript.json"
    );

    const [visual, dense, transcript] =
      await Promise.all([
        readJson(visualPath),
        readJson(densePath),
        readJson(transcriptPath),
      ]);

    if (
      visual?.status !==
      "VISUAL_EVIDENCE_COMPLETE"
    ) {
      throw new Error(
        "VIDEO BRAIN 2.1 완료 결과가 필요합니다."
      );
    }

    if (
      dense?.status !==
      "DENSE_REINSPECTION_COMPLETE"
    ) {
      throw new Error(
        "VIDEO BRAIN 2.2 완료 결과가 필요합니다."
      );
    }

    if (
      String(visual?.source?.uploadId) !==
        uploadId ||
      String(dense?.source?.uploadId) !==
        uploadId ||
      String(transcript?.uploadId) !==
        uploadId
    ) {
      throw new Error(
        "2.1 / 2.2 / transcript의 uploadId가 일치하지 않습니다."
      );
    }

    const sourceName = String(
      visual?.source?.sourceName ||
        transcript?.sourceName ||
        ""
    );

    const duration = num(
      visual?.source?.duration
    );

    const outputRoot = path.join(
      uploadRoot,
      "video-brain-v2",
      "multimodal-understanding"
    );

    const checkpointRoot = path.join(
      outputRoot,
      "checkpoints"
    );

    await fs.mkdir(checkpointRoot, {
      recursive: true,
    });

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY 없음"
      );
    }

    const model =
      process.env.OPENAI_JOPD_MODEL ||
      process.env.OPENAI_CRM_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_JOPD_MODEL / OPENAI_CRM_MODEL 없음"
      );
    }

    const baselineSegments = Array.isArray(
      visual?.segments
    )
      ? visual.segments
      : [];

    const denseCandidates = Array.isArray(
      dense?.candidates
    )
      ? dense.candidates
      : [];

    const transcriptSegments =
      Array.isArray(transcript?.segments)
        ? transcript.segments
        : [];

    const results: SegmentUnderstanding[] =
      [];

    for (
      let index = 0;
      index < baselineSegments.length;
      index++
    ) {
      const base = baselineSegments[index];

      const start = num(base?.start);
      const end = num(base?.end);

      const segmentId =
        `segment-${String(index).padStart(
          4,
          "0"
        )}`;

      const checkpointPath = path.join(
        checkpointRoot,
        `${segmentId}.json`
      );

      try {
        const previous =
          await readJson(checkpointPath);

        if (
          previous?.engine === ENGINE &&
          previous?.version === VERSION &&
          previous?.result
        ) {
          results.push(previous.result);
          continue;
        }
      } catch {
      }

      const frames: FrameRef[] = [];

      const baseFrames = Array.isArray(
        base?.frames
      )
        ? base.frames
        : [];

      for (
        let i = 0;
        i < baseFrames.length;
        i++
      ) {
        const frame = baseFrames[i];

        frames.push({
          evidenceId:
            `${segmentId}:baseline:${i}`,
          time: num(frame?.time),
          file: path.join(
            "video-brain-v2",
            "understanding",
            "frames",
            path.basename(
              String(
                frame?.file ||
                  frame?.path ||
                  ""
              )
            )
          ),
          source: "BASELINE_2_1",
        });
      }

      for (const candidate of denseCandidates) {
        if (
          candidate?.status !==
          "DENSE_EVIDENCE_READY"
        ) {
          continue;
        }

        if (
          !overlap(
            start,
            end,
            num(candidate?.start),
            num(candidate?.end)
          )
        ) {
          continue;
        }

        const candidateFrames =
          Array.isArray(candidate?.frames)
            ? candidate.frames
            : [];

        for (
          let i = 0;
          i < candidateFrames.length;
          i++
        ) {
          const frame =
            candidateFrames[i];

          const time = num(frame?.time);

          if (
            time < start ||
            time > end
          ) {
            continue;
          }

          frames.push({
            evidenceId:
              `${segmentId}:dense:${String(
                candidate?.candidateId ||
                  "candidate"
              )}:${i}`,
            time,
            file: path.join(
              "video-brain-v2",
              "dense-reinspection",
              String(
                frame?.file ||
                  frame?.path ||
                  ""
              )
            ),
            source: "DENSE_2_2",
          });
        }
      }

      frames.sort(
        (a, b) => a.time - b.time
      );

      const dedupedFrames: FrameRef[] = [];
      const seenFrameKey = new Set<string>();

      for (const frame of frames) {
        if (!frame.file) {
          continue;
        }

        const key =
          `${frame.time.toFixed(3)}:${frame.file}`;

        if (seenFrameKey.has(key)) {
          continue;
        }

        seenFrameKey.add(key);
        dedupedFrames.push(frame);
      }

      const audioRefs: AudioRef[] = [];

      for (
        let i = 0;
        i < transcriptSegments.length;
        i++
      ) {
        const seg = transcriptSegments[i];
        const aStart = num(seg?.start);
        const aEnd = num(seg?.end);

        if (
          !overlap(
            start,
            end,
            aStart,
            aEnd
          )
        ) {
          continue;
        }

        const truthStatus = String(
          seg?.audioTruth?.status ||
            "UNVERIFIED"
        ).toUpperCase();

        if (
          truthStatus === "SUSPECT" ||
          truthStatus === "BLOCK"
        ) {
          continue;
        }

        audioRefs.push({
          evidenceId:
            `${segmentId}:audio:${i}`,
          start: aStart,
          end: aEnd,
          text: String(seg?.text || ""),
          audioTruthStatus:
            truthStatus,
        });
      }

      const allowedEvidence = new Set(
        [
          ...dedupedFrames.map(
            (x) => x.evidenceId
          ),
          ...audioRefs.map(
            (x) => x.evidenceId
          ),
        ]
      );

      const evidenceManifest = {
        sourceName,
        segmentId,
        start,
        end,
        frames: dedupedFrames.map(
          ({
            evidenceId,
            time,
            source,
          }) => ({
            evidenceId,
            time,
            source,
          })
        ),
        audio: audioRefs,
      };

      const instructions = `
당신은 JOPD VIDEO BRAIN 2.3이다.

역할은 SOURCE UNDERSTANDING만이다.

당신은 편집자도 아니고 작가도 아니고 PD도 아니다.
제공된 원본 프레임과 AUDIO CANDIDATE에서
실제로 관찰 가능한 의미만 구조화한다.

절대 규칙:

1. SOURCE TRUTH
보이지 않거나 제공되지 않은 사실을 만들지 않는다.

2. 모든 관찰에는 반드시 evidenceRefs가 있어야 한다.
evidenceRefs는 제공된 evidenceId만 사용한다.

3. WHAT
화면에서 실제 관찰되는 인물, 사물, 장소의 모습,
행동, 표정, 움직임, 구도 등을 기록할 수 있다.

4. WHAT HAPPENED
시간 흐름상 실제 프레임 증거로 뒷받침되는
행동 변화와 사건 진행만 기록한다.

5. WHAT WAS SAID
제공된 audio evidence의 문장만 후보로 기록한다.
전사 문장을 임의로 고치거나 새 문장을 만들지 않는다.

6. audioTruthStatus가 REVIEW 또는 UNVERIFIED라면
사실 확정이 아니라 NEEDS_REVIEW로 취급한다.

7. 다음 판단은 이 단계에서 금지한다:
WHY_SHOT
STORY_VALUE
EDIT_VALUE
PD_INTENT
방송 순서
KEEP/CUT
내레이션
제목
오프닝
엔딩
추가 촬영 제안

8. 사람의 실제 이름이나 장소의 정확한 정체를
화면만 보고 추측하지 않는다.

9. 역사, 지리, 제품 효능, 농업 지식,
수치의 의미 같은 외부 지식을 추가하지 않는다.

10. 불확실하면 UNKNOWN 또는 NEEDS_REVIEW로 남긴다.
억지로 하나의 답으로 확정하지 않는다.

11. 이미지의 시간 순서를 존중한다.
단, 프레임 사이에서 직접 증명되지 않는 행동을
상상해서 연결하지 않는다.

JSON만 반환한다.

{
  "what": [
    {
      "description": "",
      "evidenceRefs": [],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "whatHappened": [
    {
      "description": "",
      "evidenceRefs": [],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "whatWasSaid": [
    {
      "text": "",
      "evidenceRefs": [],
      "status": "CANDIDATE_AUDIO|NEEDS_REVIEW",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "audioVisualRelation": [
    {
      "description": "",
      "evidenceRefs": [],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "unknowns": [
    {
      "description": "",
      "evidenceRefs": []
    }
  ]
}
`;

      const content: any[] = [
        {
          type: "input_text",
          text:
            "EVIDENCE MANIFEST\n" +
            JSON.stringify(
              evidenceManifest,
              null,
              2
            ),
        },
      ];

      for (const frame of dedupedFrames) {
        content.push({
          type: "input_text",
          text:
            `[${frame.evidenceId}] ` +
            `source=${sourceName} ` +
            `time=${frame.time.toFixed(3)}s ` +
            `kind=${frame.source}`,
        });

        content.push(
          await imageContent(
            uploadRoot,
            frame
          )
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model,
            instructions,
            input: [
              {
                role: "user",
                content,
              },
            ],
          }),
        }
      );

      const raw = await response.json();

      if (!response.ok) {
        throw new Error(
          raw?.error?.message ||
            `OpenAI 2.3 호출 실패: ${response.status}`
        );
      }

      const outputText =
        extractOutputText(raw);

      if (!outputText) {
        throw new Error(
          `${segmentId}: 응답 텍스트 없음`
        );
      }

      let parsed: any;

      try {
        parsed =
          parseJsonText(outputText);
      } catch {
        await fs.writeFile(
          path.join(
            checkpointRoot,
            `${segmentId}.invalid.txt`
          ),
          outputText,
          "utf8"
        );

        throw new Error(
          `${segmentId}: AI JSON 파싱 실패`
        );
      }

      const result =
        sanitizeUnderstanding(
          parsed,
          segmentId,
          start,
          end,
          allowedEvidence
        );

      await fs.writeFile(
        checkpointPath,
        JSON.stringify(
          {
            engine: ENGINE,
            version: VERSION,
            source: {
              uploadId,
              sourceName,
            },
            evidenceManifest,
            result,
            createdAt:
              new Date().toISOString(),
          },
          null,
          2
        ),
        "utf8"
      );

      results.push(result);
    }

    const failed = results.filter(
      (x) => x.status === "FAILED"
    ).length;

    const needsReview = results.filter(
      (x) =>
        x.status === "NEEDS_REVIEW"
    ).length;

    const finalResult = {
      ok: failed === 0,
      engine: ENGINE,
      version: VERSION,
      stage:
        "MULTIMODAL_SOURCE_UNDERSTANDING",
      status:
        failed === 0
          ? "MULTIMODAL_UNDERSTANDING_COMPLETE"
          : "MULTIMODAL_UNDERSTANDING_PARTIAL",
      authority: {
        layer: "SOURCE_UNDERSTANDING",
        allowed: [
          "WHAT",
          "WHAT_HAPPENED",
          "WHAT_WAS_SAID",
          "AUDIO_VISUAL_RELATION",
          "UNKNOWN",
        ],
        forbidden: [
          "WHY_SHOT",
          "STORY_VALUE",
          "EDIT_VALUE",
          "PD_INTENT",
          "BROADCAST_ORDER",
          "KEEP_CUT",
          "NARRATION",
        ],
      },
      source: {
        uploadId,
        sourceName,
        duration,
      },
      provenance: {
        baseline:
          "VIDEO_BRAIN_2.1",
        dense:
          "VIDEO_BRAIN_2.2",
        audio:
          "TRANSCRIPT_AUDIO_TRUTH",
        rule:
          "근거 없는 semantic claim은 결과에서 제거한다.",
      },
      summary: {
        totalSegments:
          results.length,
        understood:
          results.filter(
            (x) =>
              x.status === "UNDERSTOOD"
          ).length,
        needsReview,
        failed,
      },
      segments: results,
      nextStage: {
        name:
          "VIDEO BRAIN 2.4 CONTEXT ENGINE",
        rule:
          "2.3 SOURCE UNDERSTANDING을 전체 촬영 맥락으로 연결하되 SOURCE FACT와 INFERENCE를 분리한다.",
      },
      createdAt:
        new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(
        outputRoot,
        "multimodal-understanding.json"
      ),
      JSON.stringify(
        finalResult,
        null,
        2
      ),
      "utf8"
    );

    return NextResponse.json(
      finalResult
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        ok: false,
        engine: ENGINE,
        version: VERSION,
        status: "FAILED",
        error: message,
      },
      { status: 500 }
    );
  }
}
