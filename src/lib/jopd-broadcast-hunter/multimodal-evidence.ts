import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type TranscriptSegment = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  confidence?: {
    avgLogprob?: number | null;
    noSpeechProb?: number | null;
    compressionRatio?: number | null;
  };
};

type TranscriptionEvidence = {
  version: string;
  model: string;
  fullText: string;
  segments: TranscriptSegment[];
};

type VisualObservation = {
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
};

type VisualEvidence = {
  version: string;
  model: string;
  observations: VisualObservation[];
};

export type MultimodalTimelineUnit = {
  unitIndex: number;
  startSeconds: number;
  endSeconds: number;

  audio: {
    segments: Array<{
      startSeconds: number;
      endSeconds: number;
      text: string;
      avgLogprob: number | null;
      noSpeechProb: number | null;
    }>;
    combinedText: string;
  };

  visual: {
    observations: VisualObservation[];
  };

  alignment: {
    hasAudio: boolean;
    hasVisual: boolean;
    audioSegmentCount: number;
    visualObservationCount: number;
  };
};

export type MultimodalEvidence = {
  version: "JOPD_BROADCAST_MULTIMODAL_EVIDENCE_V1";
  multimodalEvidenceId: string;
  createdAt: string;

  truthClass: "OBSERVED_EVENT";
  evidenceType: "MULTIMODAL";

  sourceTimebase: "SECONDS_FROM_SOURCE_START";

  source: {
    transcriptionModel: string;
    visualModel: string;
    transcriptSegmentCount: number;
    visualObservationCount: number;
    durationSeconds: number;
    unitSeconds: number;
  };

  timeline: MultimodalTimelineUnit[];

  evidencePolicy: {
    approvedMemory: false;
    requiresDeepResearch: true;
    transcriptIsEvidenceNotScriptMemory: true;
    visualFunctionIsInterpretationNotFact: true;
    noCreatorIntentClaimAtThisStage: true;
  };
};

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(
    await fs.readFile(filePath, "utf8"),
  ) as T;
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

function overlaps(
  segmentStart: number,
  segmentEnd: number,
  unitStart: number,
  unitEnd: number,
): boolean {
  return (
    segmentStart < unitEnd &&
    segmentEnd > unitStart
  );
}

export async function createMultimodalEvidence(input: {
  transcriptionPath: string;
  visualEvidencePath: string;
  outputDir: string;
  durationSeconds: number;
  unitSeconds?: number;
}): Promise<MultimodalEvidence> {
  const transcription =
    await readJson<TranscriptionEvidence>(
      path.resolve(input.transcriptionPath),
    );

  const visual =
    await readJson<VisualEvidence>(
      path.resolve(input.visualEvidencePath),
    );

  if (!Array.isArray(transcription.segments)) {
    throw new Error(
      "전사 Evidence에 segments가 없습니다",
    );
  }

  if (!Array.isArray(visual.observations)) {
    throw new Error(
      "Visual Evidence에 observations가 없습니다",
    );
  }

  const durationSeconds = input.durationSeconds;

  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    throw new Error("durationSeconds가 잘못됐습니다");
  }

  const unitSeconds = Math.max(
    1,
    Math.min(input.unitSeconds ?? 5, 30),
  );

  const timeline: MultimodalTimelineUnit[] = [];

  for (
    let startSeconds = 0, unitIndex = 0;
    startSeconds < durationSeconds;
    startSeconds += unitSeconds, unitIndex += 1
  ) {
    const endSeconds = Math.min(
      startSeconds + unitSeconds,
      durationSeconds,
    );

    const audioSegments = transcription.segments
      .filter((segment) =>
        overlaps(
          segment.startSeconds,
          segment.endSeconds,
          startSeconds,
          endSeconds,
        ),
      )
      .map((segment) => ({
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        text: segment.text,
        avgLogprob:
          segment.confidence?.avgLogprob ?? null,
        noSpeechProb:
          segment.confidence?.noSpeechProb ?? null,
      }));

    /*
     * 프레임은 순간 관찰이다.
     * 해당 unit의 시작 이상, 끝 미만에 있는 프레임을 배치한다.
     * 마지막 unit만 정확한 종료시각 프레임도 허용한다.
     */
    const isLastUnit =
      endSeconds === durationSeconds;

    const visualObservations =
      visual.observations.filter((observation) => {
        if (isLastUnit) {
          return (
            observation.timeSeconds >= startSeconds &&
            observation.timeSeconds <= endSeconds
          );
        }

        return (
          observation.timeSeconds >= startSeconds &&
          observation.timeSeconds < endSeconds
        );
      });

    timeline.push({
      unitIndex,
      startSeconds,
      endSeconds,

      audio: {
        segments: audioSegments,
        combinedText: audioSegments
          .map((segment) => segment.text)
          .join(" ")
          .trim(),
      },

      visual: {
        observations: visualObservations,
      },

      alignment: {
        hasAudio: audioSegments.length > 0,
        hasVisual: visualObservations.length > 0,
        audioSegmentCount: audioSegments.length,
        visualObservationCount:
          visualObservations.length,
      },
    });
  }

  const multimodalEvidenceId = createHash("sha256")
    .update(
      JSON.stringify({
        transcriptionVersion:
          transcription.version,
        visualVersion: visual.version,
        durationSeconds,
        unitSeconds,
        timeline,
      }),
    )
    .digest("hex")
    .slice(0, 20);

  const result: MultimodalEvidence = {
    version:
      "JOPD_BROADCAST_MULTIMODAL_EVIDENCE_V1",

    multimodalEvidenceId,
    createdAt: new Date().toISOString(),

    truthClass: "OBSERVED_EVENT",
    evidenceType: "MULTIMODAL",

    sourceTimebase:
      "SECONDS_FROM_SOURCE_START",

    source: {
      transcriptionModel: transcription.model,
      visualModel: visual.model,
      transcriptSegmentCount:
        transcription.segments.length,
      visualObservationCount:
        visual.observations.length,
      durationSeconds,
      unitSeconds,
    },

    timeline,

    evidencePolicy: {
      approvedMemory: false,
      requiresDeepResearch: true,
      transcriptIsEvidenceNotScriptMemory: true,
      visualFunctionIsInterpretationNotFact: true,
      noCreatorIntentClaimAtThisStage: true,
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
      "multimodal-evidence.json",
    ),
    result,
  );

  return result;
}
