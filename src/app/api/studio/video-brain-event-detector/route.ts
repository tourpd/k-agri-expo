import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = path.join(process.cwd(), ".jopd-media");
const FFMPEG = "/opt/homebrew/bin/ffmpeg";

type ScanScene = {
  sceneIndex: number;
  start: number;
  end: number;
  duration: number;
};

type VisualEvidenceSegment = {
  segmentIndex: number;
  start: number;
  end: number;
  duration: number;
  status: string;
};

type EventReason =
  | "SCENE_CHANGE"
  | "VISUAL_CHANGE"
  | "MOTION_CHANGE"
  | "AUDIO_CHANGE"
  | "SILENCE_BOUNDARY"
  | "BASELINE_REINSPECTION";

type InspectionLevel =
  | "BASELINE_10S"
  | "DENSE_2S"
  | "FINE_1S"
  | "CRITICAL_0_5S";

type EventCandidate = {
  id: string;
  start: number;
  end: number;
  peakTime: number;
  reasons: EventReason[];
  inspectionLevel: InspectionLevel;
  visualScore: number | null;
  audioScore: number | null;
  sourceSegmentIndexes: number[];
};

type MetricPoint = {
  time: number;
  value: number;
};

type Interval = {
  start: number;
  end: number;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function exists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(
      await fs.readFile(file, "utf8")
    ) as T;
  } catch {
    return null;
  }
}

async function writeJson(
  file: string,
  data: unknown
) {
  await fs.mkdir(
    path.dirname(file),
    { recursive: true }
  );

  const tmp = `${file}.tmp`;

  await fs.writeFile(
    tmp,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  await fs.rename(tmp, file);
}

function round3(value: number) {
  return Number(value.toFixed(3));
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function parseMetadataMetric(
  text: string,
  key: string
): MetricPoint[] {
  const lines = text.split(/\r?\n/);

  const result: MetricPoint[] = [];
  let currentTime: number | null = null;

  for (const line of lines) {
    const timeMatch =
      line.match(/pts_time:([0-9.]+)/);

    if (timeMatch) {
      currentTime =
        Number(timeMatch[1]);
    }

    const escaped =
      key.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const valueMatch =
      line.match(
        new RegExp(
          `${escaped}=([-+0-9.eE]+)`
        )
      );

    if (
      valueMatch &&
      currentTime !== null
    ) {
      const value =
        Number(valueMatch[1]);

      if (
        Number.isFinite(currentTime) &&
        Number.isFinite(value)
      ) {
        result.push({
          time: round3(currentTime),
          value,
        });
      }

      currentTime = null;
    }
  }

  return result;
}

function parseSilence(
  text: string
): Interval[] {
  const intervals: Interval[] = [];

  let silenceStart: number | null = null;

  for (
    const line of text.split(/\r?\n/)
  ) {
    const startMatch =
      line.match(
        /silence_start:\s*([0-9.]+)/
      );

    if (startMatch) {
      silenceStart =
        Number(startMatch[1]);
    }

    const endMatch =
      line.match(
        /silence_end:\s*([0-9.]+)/
      );

    if (
      endMatch &&
      silenceStart !== null
    ) {
      const end =
        Number(endMatch[1]);

      if (
        Number.isFinite(end) &&
        end > silenceStart
      ) {
        intervals.push({
          start: round3(silenceStart),
          end: round3(end),
        });
      }

      silenceStart = null;
    }
  }

  return intervals;
}

function percentile(
  values: number[],
  p: number
) {
  if (!values.length) return 0;

  const sorted =
    [...values].sort(
      (a, b) => a - b
    );

  const index =
    Math.min(
      sorted.length - 1,
      Math.max(
        0,
        Math.floor(
          (sorted.length - 1) * p
        )
      )
    );

  return sorted[index];
}

function segmentIndexesForRange(
  scenes: ScanScene[],
  start: number,
  end: number
) {
  return scenes
    .filter(
      (scene) =>
        scene.end > start &&
        scene.start < end
    )
    .map(
      (scene) =>
        scene.sceneIndex
    );
}

function mergeCandidates(
  candidates: EventCandidate[],
  sourceDuration: number
) {
  if (!candidates.length) {
    return [];
  }

  const sorted =
    [...candidates].sort(
      (a, b) =>
        a.start - b.start
    );

  const merged: EventCandidate[] = [];

  for (const candidate of sorted) {
    const previous =
      merged[merged.length - 1];

    if (
      previous &&
      candidate.start <=
        previous.end + 0.35
    ) {
      previous.end =
        round3(
          Math.max(
            previous.end,
            candidate.end
          )
        );

      if (
        (candidate.visualScore ?? 0) >
        (previous.visualScore ?? 0)
      ) {
        previous.visualScore =
          candidate.visualScore;

        previous.peakTime =
          candidate.peakTime;
      }

      if (
        (candidate.audioScore ?? 0) >
        (previous.audioScore ?? 0)
      ) {
        previous.audioScore =
          candidate.audioScore;
      }

      previous.reasons =
        [...new Set([
          ...previous.reasons,
          ...candidate.reasons,
        ])];

      const inspectionPriority: Record<
        EventCandidate["inspectionLevel"],
        number
      > = {
        BASELINE_10S: 0,
        DENSE_2S: 1,
        FINE_1S: 2,
        CRITICAL_0_5S: 3,
      };

      if (
        inspectionPriority[candidate.inspectionLevel] >
        inspectionPriority[previous.inspectionLevel]
      ) {
        previous.inspectionLevel =
          candidate.inspectionLevel;
      }

      previous.sourceSegmentIndexes =
        [...new Set([
          ...previous.sourceSegmentIndexes,
          ...candidate.sourceSegmentIndexes,
        ])];

      continue;
    }

    merged.push({
      ...candidate,
      reasons: [...candidate.reasons],
      sourceSegmentIndexes: [
        ...candidate.sourceSegmentIndexes,
      ],
    });
  }

  return merged.map(
    (item, index) => ({
      ...item,
      id:
        `event-${String(index).padStart(5, "0")}`,
      start:
        round3(
          clamp(
            item.start,
            0,
            sourceDuration
          )
        ),
      end:
        round3(
          clamp(
            item.end,
            0,
            sourceDuration
          )
        ),
    })
  );
}

async function runVisualAnalysis(
  sourcePath: string
) {
  /*
   * signalstats:
   * 프레임별 밝기/색상 통계.
   *
   * metadata=print:
   * YAVG를 시간축 데이터로 출력.
   *
   * 이것은 "무슨 장면인가"를 판단하지 않는다.
   * 시각 상태가 크게 달라지는 후보만 찾는다.
   */
  const { stderr } =
    await execFileAsync(
      FFMPEG,
      [
        "-hide_banner",
        "-nostdin",
        "-i",
        sourcePath,
        "-vf",
        "scale=320:-2,fps=2,signalstats,metadata=print:key=lavfi.signalstats.YAVG",
        "-an",
        "-f",
        "null",
        "-",
      ],
      {
        maxBuffer:
          128 * 1024 * 1024,
      }
    );

  return parseMetadataMetric(
    stderr,
    "lavfi.signalstats.YAVG"
  );
}

async function runMotionAnalysis(
  sourcePath: string
) {
  /*
   * tblend difference + signalstats.
   *
   * 연속 프레임 차이를 단순 수치화해서
   * 움직임/카메라 변화가 큰 후보를 찾는다.
   *
   * 사람/행동의 의미 판단은 하지 않는다.
   */
  const { stderr } =
    await execFileAsync(
      FFMPEG,
      [
        "-hide_banner",
        "-nostdin",
        "-i",
        sourcePath,
        "-vf",
        "scale=320:-2,fps=2,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG",
        "-an",
        "-f",
        "null",
        "-",
      ],
      {
        maxBuffer:
          128 * 1024 * 1024,
      }
    );

  return parseMetadataMetric(
    stderr,
    "lavfi.signalstats.YAVG"
  );
}

async function runAudioAnalysis(
  sourcePath: string
) {
  try {
    const { stderr } =
      await execFileAsync(
        FFMPEG,
        [
          "-hide_banner",
          "-nostdin",
          "-i",
          sourcePath,
          "-vn",
          "-af",
          "silencedetect=noise=-38dB:d=0.7",
          "-f",
          "null",
          "-",
        ],
        {
          maxBuffer:
            64 * 1024 * 1024,
        }
      );

    return {
      hasAudio: true,
      silences:
        parseSilence(stderr),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message.includes(
        "matches no streams"
      ) ||
      message.includes(
        "does not contain any stream"
      )
    ) {
      return {
        hasAudio: false,
        silences: [] as Interval[],
      };
    }

    throw error;
  }
}

function buildAdaptiveCandidates(input: {
  scenes: ScanScene[];
  sourceDuration: number;
  sceneBoundaries: Array<{
    time: number;
    score: number;
  }>;
  visual: MetricPoint[];
  motion: MetricPoint[];
  silences: Interval[];
}) {
  const {
    scenes,
    sourceDuration,
    sceneBoundaries,
    visual,
    motion,
    silences,
  } = input;

  const candidates: EventCandidate[] = [];

  const visualDiffs: MetricPoint[] = [];

  for (
    let i = 1;
    i < visual.length;
    i++
  ) {
    visualDiffs.push({
      time: visual[i].time,
      value:
        Math.abs(
          visual[i].value -
          visual[i - 1].value
        ),
    });
  }

  const visualThreshold =
    Math.max(
      8,
      percentile(
        visualDiffs.map(
          (x) => x.value
        ),
        0.9
      )
    );

  const motionThreshold =
    Math.max(
      5,
      percentile(
        motion.map(
          (x) => x.value
        ),
        0.9
      )
    );

  for (
    const boundary
    of sceneBoundaries
  ) {
    const start =
      clamp(
        boundary.time - 2,
        0,
        sourceDuration
      );

    const end =
      clamp(
        boundary.time + 2,
        0,
        sourceDuration
      );

    candidates.push({
      id: "",
      start: round3(start),
      end: round3(end),
      peakTime:
        round3(boundary.time),
      reasons: [
        "SCENE_CHANGE",
      ],
      inspectionLevel:
        boundary.score >= 0.6
          ? "CRITICAL_0_5S"
          : "FINE_1S",
      visualScore:
        boundary.score,
      audioScore: null,
      sourceSegmentIndexes:
        segmentIndexesForRange(
          scenes,
          start,
          end
        ),
    });
  }

  for (
    const point
    of visualDiffs
  ) {
    if (
      point.value <
      visualThreshold
    ) {
      continue;
    }

    const start =
      clamp(
        point.time - 1.5,
        0,
        sourceDuration
      );

    const end =
      clamp(
        point.time + 1.5,
        0,
        sourceDuration
      );

    candidates.push({
      id: "",
      start: round3(start),
      end: round3(end),
      peakTime:
        round3(point.time),
      reasons: [
        "VISUAL_CHANGE",
      ],
      inspectionLevel:
        point.value >=
          visualThreshold * 1.8
          ? "CRITICAL_0_5S"
          : "FINE_1S",
      visualScore:
        Number(
          point.value.toFixed(4)
        ),
      audioScore: null,
      sourceSegmentIndexes:
        segmentIndexesForRange(
          scenes,
          start,
          end
        ),
    });
  }

  for (
    const point
    of motion
  ) {
    if (
      point.value <
      motionThreshold
    ) {
      continue;
    }

    const start =
      clamp(
        point.time - 1,
        0,
        sourceDuration
      );

    const end =
      clamp(
        point.time + 1,
        0,
        sourceDuration
      );

    candidates.push({
      id: "",
      start: round3(start),
      end: round3(end),
      peakTime:
        round3(point.time),
      reasons: [
        "MOTION_CHANGE",
      ],
      inspectionLevel:
        point.value >=
          motionThreshold * 1.8
          ? "FINE_1S"
          : "DENSE_2S",
      visualScore:
        Number(
          point.value.toFixed(4)
        ),
      audioScore: null,
      sourceSegmentIndexes:
        segmentIndexesForRange(
          scenes,
          start,
          end
        ),
    });
  }

  for (
    const silence
    of silences
  ) {
    for (
      const boundary
      of [
        silence.start,
        silence.end,
      ]
    ) {
      const start =
        clamp(
          boundary - 1,
          0,
          sourceDuration
        );

      const end =
        clamp(
          boundary + 1,
          0,
          sourceDuration
        );

      candidates.push({
        id: "",
        start: round3(start),
        end: round3(end),
        peakTime:
          round3(boundary),
        reasons: [
          "SILENCE_BOUNDARY",
          "AUDIO_CHANGE",
        ],
        inspectionLevel:
          "FINE_1S",
        visualScore: null,
        audioScore: 1,
        sourceSegmentIndexes:
          segmentIndexesForRange(
            scenes,
            start,
            end
          ),
      });
    }
  }

  /*
   * 변화가 거의 검출되지 않은 긴 현장 원본도
   * 분석에서 사라지면 안 된다.
   *
   * 2.1의 전체 커버리지를 안전망으로 유지하고
   * 모든 10초 구간을 최소 BASELINE 대상으로 남긴다.
   */
  for (
    const scene
    of scenes
  ) {
    const covered =
      candidates.some(
        (candidate) =>
          candidate.end >
            scene.start &&
          candidate.start <
            scene.end
      );

    if (covered) continue;

    candidates.push({
      id: "",
      start:
        round3(scene.start),
      end:
        round3(scene.end),
      peakTime:
        round3(
          scene.start +
          scene.duration / 2
        ),
      reasons: [
        "BASELINE_REINSPECTION",
      ],
      inspectionLevel:
        "BASELINE_10S",
      visualScore: null,
      audioScore: null,
      sourceSegmentIndexes: [
        scene.sceneIndex,
      ],
    });
  }

  return {
    visualThreshold:
      Number(
        visualThreshold.toFixed(4)
      ),
    motionThreshold:
      Number(
        motionThreshold.toFixed(4)
      ),
    candidates:
      mergeCandidates(
        candidates,
        sourceDuration
      ),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine:
      "JOPD VIDEO BRAIN — ADAPTIVE EVENT DETECTOR",
    version: "2.2.0",
    stage:
      "ADAPTIVE_EVENT_DETECTION",

    principle:
      "전체 시간축을 버리지 않고 시각·움직임·오디오 변화가 있는 구간을 더 촘촘하게 재검사한다.",

    truthRule:
      "이 단계는 의미를 확정하지 않는다. 변화 후보와 정밀 재검사 구간만 만든다.",
  });
}

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const uploadId =
      safeId(
        String(
          body?.uploadId || ""
        )
      );

    if (!uploadId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "uploadId required",
        },
        { status: 400 }
      );
    }

    const uploadDir =
      path.join(
        ROOT,
        uploadId
      );

    const metaPath =
      path.join(
        uploadDir,
        "meta.json"
      );

    const scanPath =
      path.join(
        uploadDir,
        "video-brain-v2",
        "full-source-scan.json"
      );

    const evidencePath =
      path.join(
        uploadDir,
        "video-brain-v2",
        "understanding",
        "visual-evidence.json"
      );

    if (
      !(await exists(metaPath))
    ) {
      throw new Error(
        "meta.json not found"
      );
    }

    if (
      !(await exists(scanPath))
    ) {
      throw new Error(
        "VIDEO BRAIN 2.0 full-source-scan.json not found"
      );
    }

    if (
      !(await exists(
        evidencePath
      ))
    ) {
      throw new Error(
        "VIDEO BRAIN 2.1 visual-evidence.json not found"
      );
    }

    const meta =
      await readJson<{
        fileName?: string;
      }>(metaPath);

    const scan =
      await readJson<{
        status?: string;
        source?: {
          duration?: number;
        };
        scenes?: ScanScene[];
        sceneBoundaries?: Array<{
          time: number;
          score: number;
        }>;
      }>(scanPath);

    const evidence =
      await readJson<{
        status?: string;
        coverage?: {
          frameCoverageComplete?: boolean;
        };
        segments?:
          VisualEvidenceSegment[];
      }>(evidencePath);

    if (!meta?.fileName) {
      throw new Error(
        "meta.json fileName missing"
      );
    }

    if (
      scan?.status !==
      "FULLY_DECODED"
    ) {
      throw new Error(
        "VIDEO BRAIN 2.0 is not FULLY_DECODED"
      );
    }

    if (
      evidence?.status !==
        "VISUAL_EVIDENCE_COMPLETE" ||
      evidence?.coverage
        ?.frameCoverageComplete !==
        true
    ) {
      throw new Error(
        "VIDEO BRAIN 2.1 visual evidence is incomplete"
      );
    }

    const scenes =
      Array.isArray(
        scan.scenes
      )
        ? scan.scenes
        : [];

    if (!scenes.length) {
      throw new Error(
        "No VIDEO BRAIN 2.0 scenes"
      );
    }

    const sourceDuration =
      Number(
        scan.source
          ?.duration || 0
      );

    if (
      !(sourceDuration > 0)
    ) {
      throw new Error(
        "Invalid source duration"
      );
    }

    const sourcePath =
      path.join(
        uploadDir,
        meta.fileName
      );

    if (
      !(await exists(
        sourcePath
      ))
    ) {
      throw new Error(
        "Original source file not found"
      );
    }

    const outputDir =
      path.join(
        uploadDir,
        "video-brain-v2",
        "event-detector"
      );

    await fs.mkdir(
      outputDir,
      { recursive: true }
    );

    const progressPath =
      path.join(
        outputDir,
        "progress.json"
      );

    const resultPath =
      path.join(
        outputDir,
        "adaptive-events.json"
      );

    await writeJson(
      progressPath,
      {
        engine:
          "JOPD VIDEO BRAIN",
        version:
          "2.2.0",
        stage:
          "ADAPTIVE_EVENT_DETECTION",
        status:
          "ANALYZING",
        uploadId,
        sourceDuration,
        updatedAt:
          new Date().toISOString(),
      }
    );

    /*
     * 서로 독립적인 로컬 증거 분석.
     * AI 호출 없음.
     */
    const [
      visual,
      motion,
      audio,
    ] =
      await Promise.all([
        runVisualAnalysis(
          sourcePath
        ),
        runMotionAnalysis(
          sourcePath
        ),
        runAudioAnalysis(
          sourcePath
        ),
      ]);

    const adaptive =
      buildAdaptiveCandidates({
        scenes,
        sourceDuration,

        sceneBoundaries:
          Array.isArray(
            scan.sceneBoundaries
          )
            ? scan.sceneBoundaries
            : [],

        visual,
        motion,
        silences:
          audio.silences,
      });

    const candidateCoverage =
      adaptive.candidates.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.end -
            item.start
          ),
        0
      );

    const result = {
      ok: true,

      engine:
        "JOPD VIDEO BRAIN — ADAPTIVE EVENT DETECTOR",

      version:
        "2.2.0",

      stage:
        "ADAPTIVE_EVENT_DETECTION",

      status:
        "EVENT_CANDIDATES_READY",

      understandingStatus:
        "NOT_YET_SEMANTICALLY_UNDERSTOOD",

      source: {
        uploadId,
        sourceName:
          meta.fileName,
        duration:
          sourceDuration,
      },

      prerequisites: {
        fullSourceScan:
          "FULLY_DECODED",
        visualEvidence:
          "VISUAL_EVIDENCE_COMPLETE",
      },

      policy: {
        baseline:
          "VIDEO BRAIN 2.1 전체 커버리지 유지",
        adaptive:
          "변화 후보는 2초/1초/0.5초 수준으로 후속 재검사",
        semanticDecision:
          false,
        maxGlobalFrameCap:
          null,
      },

      thresholds: {
        visual:
          adaptive.visualThreshold,
        motion:
          adaptive.motionThreshold,
      },

      evidence: {
        visualMetricPoints:
          visual.length,
        motionMetricPoints:
          motion.length,
        hasAudio:
          audio.hasAudio,
        silenceIntervals:
          audio.silences.length,
        originalSceneBoundaries:
          Array.isArray(
            scan.sceneBoundaries
          )
            ? scan.sceneBoundaries.length
            : 0,
      },

      candidateCount:
        adaptive.candidates.length,

      candidateCoverageSeconds:
        round3(
          candidateCoverage
        ),

      candidates:
        adaptive.candidates,

      unresolved: [],

      nextStage: {
        name:
          "VIDEO BRAIN 2.2 DENSE REINSPECTION",
        rule:
          "각 candidate의 inspectionLevel에 따라 실제 프레임을 촘촘히 추출하고 누락 여부를 검증한다.",
      },

      createdAt:
        new Date().toISOString(),
    };

    await writeJson(
      resultPath,
      result
    );

    await writeJson(
      progressPath,
      {
        engine:
          "JOPD VIDEO BRAIN",
        version:
          "2.2.0",
        stage:
          "ADAPTIVE_EVENT_DETECTION",
        status:
          "EVENT_CANDIDATES_READY",
        uploadId,
        sourceDuration,
        candidateCount:
          adaptive.candidates.length,
        updatedAt:
          new Date().toISOString(),
      }
    );

    return NextResponse.json(
      result
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engine:
          "JOPD VIDEO BRAIN — ADAPTIVE EVENT DETECTOR",
        version:
          "2.2.0",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
