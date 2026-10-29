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
  "JOPD VIDEO BRAIN — TEMPORAL CONTEXT";
const VERSION = "2.4.0";

type Confidence = "HIGH" | "MEDIUM" | "LOW";

type EvidenceItem = {
  description?: string;
  text?: string;
  evidenceRefs: string[];
  confidence?: Confidence;
  status?: string;
};

type SegmentUnderstanding = {
  segmentId: string;
  start: number;
  end: number;
  status:
    | "UNDERSTOOD"
    | "NEEDS_REVIEW"
    | "FAILED";
  what: EvidenceItem[];
  whatHappened: EvidenceItem[];
  whatWasSaid: EvidenceItem[];
  audioVisualRelation: EvidenceItem[];
  unknowns: EvidenceItem[];
};

function safeUploadId(value: unknown) {
  const uploadId = String(value || "").trim();

  if (!/^[a-zA-Z0-9_-]+$/.test(uploadId)) {
    throw new Error("잘못된 uploadId");
  }

  return uploadId;
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

async function readJson(filePath: string) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function segmentSummary(
  segment: SegmentUnderstanding | null
) {
  if (!segment) {
    return null;
  }

  return {
    segmentId: segment.segmentId,
    start: segment.start,
    end: segment.end,
    status: segment.status,

    what: Array.isArray(segment.what)
      ? segment.what
      : [],

    whatHappened: Array.isArray(
      segment.whatHappened
    )
      ? segment.whatHappened
      : [],

    whatWasSaid: Array.isArray(
      segment.whatWasSaid
    )
      ? segment.whatWasSaid
      : [],

    audioVisualRelation: Array.isArray(
      segment.audioVisualRelation
    )
      ? segment.audioVisualRelation
      : [],

    unknowns: Array.isArray(segment.unknowns)
      ? segment.unknowns
      : [],
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: ENGINE,
    version: VERSION,
    stage: "TEMPORAL_CONTEXT",
    principle:
      "2.3 SOURCE UNDERSTANDING의 증거를 보존하면서 앞뒤 segment의 시간적 맥락만 연결한다.",
    semanticDecision: false,
    editorialDecision: false,
    aiCall: false,
  });
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

    const inputPath = path.join(
      uploadRoot,
      "video-brain-v2",
      "multimodal-understanding",
      "multimodal-understanding.json"
    );

    const input = await readJson(inputPath);

    if (
      input?.status !==
      "MULTIMODAL_UNDERSTANDING_COMPLETE"
    ) {
      throw new Error(
        `VIDEO BRAIN 2.3 완료 결과가 필요합니다: ${
          input?.status ?? "UNKNOWN"
        }`
      );
    }

    if (
      String(input?.source?.uploadId || "") !==
      uploadId
    ) {
      throw new Error(
        "VIDEO BRAIN 2.3 uploadId가 요청과 일치하지 않습니다."
      );
    }

    const rawSegments = Array.isArray(
      input?.segments
    )
      ? input.segments
      : [];

    if (!rawSegments.length) {
      throw new Error(
        "VIDEO BRAIN 2.3 segment가 없습니다."
      );
    }

    const segments: SegmentUnderstanding[] =
      rawSegments
        .map((segment: Record<string, unknown>) => ({
          segmentId: String(
            segment?.segmentId || ""
          ),
          start: num(segment?.start),
          end: num(segment?.end),
          status:
            segment?.status === "UNDERSTOOD"
              ? "UNDERSTOOD"
              : segment?.status === "FAILED"
                ? "FAILED"
                : "NEEDS_REVIEW",
          what: Array.isArray(segment?.what)
            ? segment.what
            : [],
          whatHappened: Array.isArray(
            segment?.whatHappened
          )
            ? segment.whatHappened
            : [],
          whatWasSaid: Array.isArray(
            segment?.whatWasSaid
          )
            ? segment.whatWasSaid
            : [],
          audioVisualRelation: Array.isArray(
            segment?.audioVisualRelation
          )
            ? segment.audioVisualRelation
            : [],
          unknowns: Array.isArray(
            segment?.unknowns
          )
            ? segment.unknowns
            : [],
        }))
        .sort(
          (a, b) =>
            a.start - b.start ||
            a.end - b.end
        );

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (
        !segment.segmentId ||
        !(segment.end > segment.start)
      ) {
        throw new Error(
          `잘못된 2.3 segment: index=${i}`
        );
      }

      if (
        i > 0 &&
        segment.start <
          segments[i - 1].start
      ) {
        throw new Error(
          `segment 시간 순서 오류: ${segment.segmentId}`
        );
      }
    }

    const contextualSegments =
      segments.map((current, index) => {
        const previous =
          index > 0
            ? segments[index - 1]
            : null;

        const next =
          index + 1 < segments.length
            ? segments[index + 1]
            : null;

        const gapFromPrevious =
          previous
            ? Math.max(
                0,
                current.start -
                  previous.end
              )
            : null;

        const gapToNext =
          next
            ? Math.max(
                0,
                next.start -
                  current.end
              )
            : null;

        return {
          contextId:
            `context-${String(index).padStart(
              4,
              "0"
            )}`,

          segmentId: current.segmentId,
          start: current.start,
          end: current.end,

          sourceUnderstanding:
            segmentSummary(current),

          temporalWindow: {
            previous:
              segmentSummary(previous),

            current:
              segmentSummary(current),

            next:
              segmentSummary(next),
          },

          continuity: {
            previousExists:
              previous !== null,
            nextExists:
              next !== null,
            gapFromPrevious,
            gapToNext,
          },

          inference: {
            status:
              "NOT_GENERATED_AT_2_4",
            reason:
              "2.4는 SOURCE FACT를 시간 맥락으로 연결하지만 WHY_SHOT / STORY_VALUE / EDIT_VALUE / PD_INTENT를 생성하지 않는다.",
          },
        };
      });

    const output = {
      ok: true,

      engine: ENGINE,
      version: VERSION,
      stage: "TEMPORAL_CONTEXT",

      status:
        "TEMPORAL_CONTEXT_COMPLETE",

      authority: {
        layer: "SOURCE_CONTEXT",

        allowed: [
          "SOURCE_UNDERSTANDING_PRESERVATION",
          "TEMPORAL_ORDER",
          "PREVIOUS_CURRENT_NEXT_CONTEXT",
          "TIMELINE_GAP",
        ],

        forbidden: [
          "WHY_SHOT",
          "STORY_VALUE",
          "EDIT_VALUE",
          "PD_INTENT",
          "BROADCAST_ORDER",
          "KEEP_CUT",
          "NARRATION",
          "FACT_CREATION",
        ],
      },

      source: {
        uploadId,
        sourceName:
          String(
            input?.source?.sourceName || ""
          ),
        duration:
          num(input?.source?.duration),
      },

      provenance: {
        input:
          "VIDEO_BRAIN_2.3_MULTIMODAL_SOURCE_UNDERSTANDING",
        rule:
          "2.3 evidence-backed SOURCE UNDERSTANDING을 수정하지 않고 시간적 이웃 관계만 추가한다.",
      },

      policy: {
        aiCall: false,
        semanticDecision: false,
        editorialDecision: false,
        sourceFactMutation: false,
      },

      summary: {
        totalSegments:
          contextualSegments.length,

        understood:
          segments.filter(
            (x) =>
              x.status === "UNDERSTOOD"
          ).length,

        needsReview:
          segments.filter(
            (x) =>
              x.status === "NEEDS_REVIEW"
          ).length,

        failed:
          segments.filter(
            (x) =>
              x.status === "FAILED"
          ).length,
      },

      segments: contextualSegments,

      nextStage: {
        name:
          "VIDEO BRAIN 2.5 WHOLE SHOOT MEMORY",
        rule:
          "여러 SOURCE의 2.4 시간 맥락을 전체 촬영 맥락으로 통합하되 SOURCE FACT와 INFERENCE를 분리한다.",
      },

      createdAt:
        new Date().toISOString(),
    };

    const outputRoot = path.join(
      uploadRoot,
      "video-brain-v2",
      "temporal-context"
    );

    await fs.mkdir(outputRoot, {
      recursive: true,
    });

    const outputPath = path.join(
      outputRoot,
      "temporal-context.json"
    );

    await fs.writeFile(
      outputPath,
      JSON.stringify(
        output,
        null,
        2
      ),
      "utf8"
    );

    return NextResponse.json(output);
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
        stage: "TEMPORAL_CONTEXT",
        status: "FAILED",
        error: message,
      },
      { status: 500 }
    );
  }
}
