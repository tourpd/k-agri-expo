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
  reasons: string[];
  inspectionLevel: InspectionLevel;
  visualScore: number | null;
  audioScore: number | null;
  sourceSegmentIndexes: number[];
};

type AdaptiveEvents = {
  status?: string;
  source?: {
    uploadId?: string;
    sourceName?: string;
    duration?: number;
  };
  candidates?: EventCandidate[];
};

type FrameEvidence = {
  time: number;
  file: string;
  bytes: number;
};

type ReinspectionResult = {
  candidateId: string;
  start: number;
  end: number;
  peakTime: number;
  reasons: string[];
  inspectionLevel: InspectionLevel;
  intervalSeconds: number | null;
  status:
    | "BASELINE_PRESERVED"
    | "DENSE_EVIDENCE_READY"
    | "FAILED";
  frames: FrameEvidence[];
  error?: string;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function round3(value: number) {
  return Number(value.toFixed(3));
}

async function exists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(
  file: string
): Promise<T | null> {
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

function intervalForLevel(
  level: InspectionLevel
): number | null {
  switch (level) {
    case "DENSE_2S":
      return 2;

    case "FINE_1S":
      return 1;

    case "CRITICAL_0_5S":
      return 0.5;

    case "BASELINE_10S":
      return null;
  }
}

function makeTimes(
  start: number,
  end: number,
  interval: number
) {
  const times: number[] = [];

  if (!(end > start)) {
    return times;
  }

  const safeStart =
    Math.max(
      start,
      Math.min(
        end - 0.01,
        start + 0.05
      )
    );

  const safeEnd =
    Math.max(
      safeStart,
      end - 0.05
    );

  let t = safeStart;

  while (
    t <= safeEnd + 0.001
  ) {
    times.push(
      round3(t)
    );

    t += interval;
  }

  if (
    times.length === 0
  ) {
    times.push(
      round3(
        (start + end) / 2
      )
    );
  }

  const last =
    times[times.length - 1];

  if (
    safeEnd - last >
    interval * 0.4
  ) {
    times.push(
      round3(safeEnd)
    );
  }

  return [
    ...new Set(times),
  ];
}

async function extractFrame(
  sourcePath: string,
  outputPath: string,
  time: number
) {
  await execFileAsync(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      time.toFixed(3),
      "-i",
      sourcePath,
      "-frames:v",
      "1",
      "-vf",
      "scale=640:-2",
      "-q:v",
      "3",
      "-y",
      outputPath,
    ],
    {
      maxBuffer:
        16 * 1024 * 1024,
    }
  );
}

function sanitizeFilePart(
  value: string
) {
  return value.replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,

    engine:
      "JOPD VIDEO BRAIN — DENSE REINSPECTION",

    version:
      "2.2.1",

    stage:
      "DENSE_REINSPECTION",

    principle:
      "전체 커버리지는 유지하고 변화 후보만 2초·1초·0.5초 간격으로 원본에서 다시 관찰한다.",

    truthRule:
      "추출 프레임은 원본 시각 증거다. 이 단계에서는 장면 의미를 확정하지 않는다.",
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

    const adaptivePath =
      path.join(
        uploadDir,
        "video-brain-v2",
        "event-detector",
        "adaptive-events.json"
      );

    const visualEvidencePath =
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
      !(await exists(
        adaptivePath
      ))
    ) {
      throw new Error(
        "VIDEO BRAIN 2.2 adaptive-events.json not found"
      );
    }

    if (
      !(await exists(
        visualEvidencePath
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

    const adaptive =
      await readJson<AdaptiveEvents>(
        adaptivePath
      );

    if (!meta?.fileName) {
      throw new Error(
        "meta.json fileName missing"
      );
    }

    if (
      adaptive?.status !==
      "EVENT_CANDIDATES_READY"
    ) {
      throw new Error(
        `VIDEO BRAIN 2.2 candidates not ready: ${adaptive?.status ?? "UNKNOWN"}`
      );
    }

    const candidates =
      Array.isArray(
        adaptive.candidates
      )
        ? adaptive.candidates
        : [];

    if (!candidates.length) {
      throw new Error(
        "No adaptive event candidates"
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
        "dense-reinspection"
      );

    const framesDir =
      path.join(
        outputDir,
        "frames"
      );

    await fs.mkdir(
      framesDir,
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
        "dense-evidence.json"
      );

    await writeJson(
      progressPath,
      {
        engine:
          "JOPD VIDEO BRAIN",
        version:
          "2.2.1",
        stage:
          "DENSE_REINSPECTION",
        status:
          "RUNNING",
        uploadId,
        totalCandidates:
          candidates.length,
        completedCandidates: 0,
        failedCandidates: 0,
        updatedAt:
          new Date().toISOString(),
      }
    );

    const results:
      ReinspectionResult[] = [];

    let failedCandidates = 0;
    let extractedFrames = 0;

    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {
      const candidate =
        candidates[i];

      const interval =
        intervalForLevel(
          candidate.inspectionLevel
        );

      if (
        interval === null
      ) {
        results.push({
          candidateId:
            candidate.id,
          start:
            candidate.start,
          end:
            candidate.end,
          peakTime:
            candidate.peakTime,
          reasons:
            candidate.reasons,
          inspectionLevel:
            candidate.inspectionLevel,
          intervalSeconds:
            null,
          status:
            "BASELINE_PRESERVED",
          frames: [],
        });

        await writeJson(
          progressPath,
          {
            engine:
              "JOPD VIDEO BRAIN",
            version:
              "2.2.1",
            stage:
              "DENSE_REINSPECTION",
            status:
              "RUNNING",
            uploadId,
            totalCandidates:
              candidates.length,
            completedCandidates:
              i + 1,
            failedCandidates,
            extractedFrames,
            updatedAt:
              new Date().toISOString(),
          }
        );

        continue;
      }

      const times =
        makeTimes(
          candidate.start,
          candidate.end,
          interval
        );

      const frames:
        FrameEvidence[] = [];

      try {
        const candidateDir =
          path.join(
            framesDir,
            sanitizeFilePart(
              candidate.id
            )
          );

        await fs.mkdir(
          candidateDir,
          { recursive: true }
        );

        for (
          let frameIndex = 0;
          frameIndex <
          times.length;
          frameIndex++
        ) {
          const time =
            times[frameIndex];

          const filename =
            `frame-${String(
              frameIndex
            ).padStart(
              4,
              "0"
            )}-${time
              .toFixed(3)
              .replace(
                ".",
                "_"
              )}.jpg`;

          const outputPath =
            path.join(
              candidateDir,
              filename
            );

          if (
            !(await exists(
              outputPath
            ))
          ) {
            await extractFrame(
              sourcePath,
              outputPath,
              time
            );
          }

          const stat =
            await fs.stat(
              outputPath
            );

          if (
            stat.size <= 0
          ) {
            throw new Error(
              `Empty frame: ${filename}`
            );
          }

          frames.push({
            time,
            file:
              path.relative(
                outputDir,
                outputPath
              ),
            bytes:
              stat.size,
          });

          extractedFrames++;
        }

        results.push({
          candidateId:
            candidate.id,
          start:
            candidate.start,
          end:
            candidate.end,
          peakTime:
            candidate.peakTime,
          reasons:
            candidate.reasons,
          inspectionLevel:
            candidate.inspectionLevel,
          intervalSeconds:
            interval,
          status:
            "DENSE_EVIDENCE_READY",
          frames,
        });
      } catch (error) {
        failedCandidates++;

        results.push({
          candidateId:
            candidate.id,
          start:
            candidate.start,
          end:
            candidate.end,
          peakTime:
            candidate.peakTime,
          reasons:
            candidate.reasons,
          inspectionLevel:
            candidate.inspectionLevel,
          intervalSeconds:
            interval,
          status:
            "FAILED",
          frames,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }

      await writeJson(
        progressPath,
        {
          engine:
            "JOPD VIDEO BRAIN",
          version:
            "2.2.1",
          stage:
            "DENSE_REINSPECTION",
          status:
            "RUNNING",
          uploadId,
          totalCandidates:
            candidates.length,
          completedCandidates:
            i + 1,
          failedCandidates,
          extractedFrames,
          updatedAt:
            new Date().toISOString(),
        }
      );
    }

    const denseCandidates =
      results.filter(
        (item) =>
          item.inspectionLevel !==
          "BASELINE_10S"
      );

    const denseReady =
      denseCandidates.filter(
        (item) =>
          item.status ===
          "DENSE_EVIDENCE_READY"
      ).length;

    const baselinePreserved =
      results.filter(
        (item) =>
          item.status ===
          "BASELINE_PRESERVED"
      ).length;

    const complete =
      failedCandidates === 0 &&
      denseReady ===
        denseCandidates.length;

    const output = {
      ok: complete,

      engine:
        "JOPD VIDEO BRAIN — DENSE REINSPECTION",

      version:
        "2.2.1",

      stage:
        "DENSE_REINSPECTION",

      status:
        complete
          ? "DENSE_REINSPECTION_COMPLETE"
          : "DENSE_REINSPECTION_INCOMPLETE",

      understandingStatus:
        "NOT_YET_SEMANTICALLY_UNDERSTOOD",

      source: {
        uploadId,
        sourceName:
          meta.fileName,
        duration:
          adaptive.source
            ?.duration ??
          null,
      },

      policy: {
        baseline10s:
          "VIDEO BRAIN 2.1 시각 증거를 그대로 보존",
        dense2s:
          "2초 간격 원본 프레임",
        fine1s:
          "1초 간격 원본 프레임",
        critical05s:
          "0.5초 간격 원본 프레임",
        globalFrameCap:
          null,
        semanticDecision:
          false,
      },

      summary: {
        totalCandidates:
          results.length,
        baselinePreserved,
        denseCandidates:
          denseCandidates.length,
        denseReady,
        failedCandidates,
        extractedFrames,
      },

      candidates:
        results,

      unresolved:
        results
          .filter(
            (item) =>
              item.status ===
              "FAILED"
          )
          .map(
            (item) => ({
              candidateId:
                item.candidateId,
              error:
                item.error ??
                "Unknown error",
            })
          ),

      nextStage: {
        name:
          "VIDEO BRAIN 2.3 MULTIMODAL UNDERSTANDING",
        rule:
          "2.1 기본 증거와 2.2 정밀 증거, 원본 오디오·전사를 함께 사용해 WHAT / WHAT HAPPENED / WHAT WAS SAID를 분석한다.",
      },

      createdAt:
        new Date().toISOString(),
    };

    await writeJson(
      resultPath,
      output
    );

    await writeJson(
      progressPath,
      {
        engine:
          "JOPD VIDEO BRAIN",
        version:
          "2.2.1",
        stage:
          "DENSE_REINSPECTION",
        status:
          output.status,
        uploadId,
        ...output.summary,
        updatedAt:
          new Date().toISOString(),
      }
    );

    return NextResponse.json(
      output,
      {
        status:
          complete
            ? 200
            : 500,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        engine:
          "JOPD VIDEO BRAIN — DENSE REINSPECTION",

        version:
          "2.2.1",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
