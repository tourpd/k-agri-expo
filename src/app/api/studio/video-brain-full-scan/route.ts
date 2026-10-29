import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = path.join(process.cwd(), ".jopd-media");
const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const FFPROBE = "/opt/homebrew/bin/ffprobe";

type Meta = {
  fileName?: string;
};

type ScanPoint = {
  time: number;
  type: "SAFETY";
};

type SceneBoundary = {
  time: number;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });

  const tmp = `${file}.tmp`;

  await fs.writeFile(
    tmp,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  await fs.rename(tmp, file);
}

async function probe(sourcePath: string) {
  const { stdout } = await execFileAsync(
    FFPROBE,
    [
      "-v", "error",
      "-show_entries",
      "format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate",
      "-of", "json",
      sourcePath,
    ],
    { maxBuffer: 10 * 1024 * 1024 }
  );

  const data = JSON.parse(stdout);

  return {
    duration: Number(data?.format?.duration || 0),
    streams: data?.streams || [],
  };
}

function makeSafetyPoints(duration: number) {
  /*
   * 이 점들은 AI용 50장 제한이 아니다.
   *
   * 전체 시간축에 구멍이 생기지 않았는지 확인하고,
   * 장면 검출이 실패하더라도 일정 간격으로
   * 반드시 관찰지점을 확보하기 위한 안전망이다.
   */
  let step = 5;

  if (duration > 60 * 30) step = 10;
  if (duration > 60 * 90) step = 15;

  const points: ScanPoint[] = [];

  for (let t = 0; t < duration; t += step) {
    points.push({
      time: Number(t.toFixed(3)),
      type: "SAFETY",
    });
  }

  if (
    duration > 0 &&
    (
      points.length === 0 ||
      Math.abs(points[points.length - 1].time - duration) > 0.5
    )
  ) {
    points.push({
      time: Number(duration.toFixed(3)),
      type: "SAFETY",
    });
  }

  return {
    stepSeconds: step,
    points,
  };
}

async function detectScenes(
  sourcePath: string,
  duration: number,
  progressFile: string
) {
  return await new Promise<SceneBoundary[]>((resolve, reject) => {
    /*
     * select='gt(scene,0.30)'는 전체 영상을 순차 디코딩한다.
     * 즉 50프레임 점프 방식과 다르다.
     *
     * scale을 작게 해서 장면 변화 탐지는 빠르게 수행한다.
     * 실제 정밀 관찰은 후속 단계에서 원본 구간을 다시 본다.
     */
    const args = [
      "-hide_banner",
      "-nostdin",
      "-i", sourcePath,
      "-vf",
      "scale=320:-2,select='gt(scene,0.30)',metadata=print",
      "-an",
      "-f", "null",
      "-",
      "-progress", "pipe:1",
      "-nostats",
    ];

    const child = spawn(FFMPEG, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdoutBuffer = "";
    let stderrBuffer = "";
    let lastSaved = 0;

    const boundaries: SceneBoundary[] = [];

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", async (chunk: string) => {
      stdoutBuffer += chunk;

      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("out_time_ms=")) continue;

        const raw = Number(line.slice("out_time_ms=".length));
        if (!Number.isFinite(raw)) continue;

        /*
         * ffmpeg progress의 out_time_ms는 실제로 microseconds 단위로
         * 보고되는 빌드가 많으므로 1,000,000으로 환산한다.
         */
        const seconds = raw / 1_000_000;

        if (seconds - lastSaved >= 10 || seconds >= duration - 1) {
          lastSaved = seconds;

          const covered = Math.max(
            0,
            Math.min(duration, seconds)
          );

          const percent =
            duration > 0
              ? Math.min(100, (covered / duration) * 100)
              : 0;

          try {
            await writeJson(progressFile, {
              engine: "JOPD VIDEO BRAIN",
              version: "2.0.0",
              stage: "FULL_SOURCE_SCAN",
              status: "SCANNING",
              scannedUntil: covered,
              sourceDuration: duration,
              coveragePercent: Number(percent.toFixed(2)),
              updatedAt: new Date().toISOString(),
            });
          } catch {
            // 진행상태 저장 실패가 전체 스캔을 죽이지 않게 한다.
          }
        }
      }
    });

    child.stderr.on("data", (chunk: string) => {
      stderrBuffer += chunk;

      /*
       * metadata=print가 stderr로 출력하는
       * lavfi.scene_score / pts_time을 읽는다.
       */
      const blocks = stderrBuffer.split(/\r?\n/);

      if (blocks.length < 2) return;

      stderrBuffer = blocks.pop() || "";

      let currentTime: number | null = null;

      for (const line of blocks) {
        const timeMatch =
          line.match(/pts_time:([0-9.]+)/);

        if (timeMatch) {
          currentTime = Number(timeMatch[1]);
        }

        const scoreMatch =
          line.match(/lavfi\.scene_score=([0-9.]+)/);

        if (
          scoreMatch &&
          currentTime !== null &&
          Number.isFinite(currentTime)
        ) {
          const score = Number(scoreMatch[1]);

          boundaries.push({
            time: Number(currentTime.toFixed(3)),
            score: Number(score.toFixed(4)),
          });

          currentTime = null;
        }
      }
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `FFmpeg full scan 실패 (exit ${code})\n${stderrBuffer.slice(-3000)}`
          )
        );
        return;
      }

      resolve(boundaries);
    });
  });
}

function buildScenes(
  duration: number,
  boundaries: SceneBoundary[]
) {
  /*
   * JOPD FULL COVERAGE SEGMENTATION
   *
   * 현장취재 원본은 카메라를 오래 끄지 않을 수 있으므로
   * scene-change 검출만으로 구간을 만들지 않는다.
   *
   * 1. 전체 시간축을 최대 10초 단위로 강제 분할한다.
   * 2. 실제 scene boundary가 있으면 그것도 경계로 추가한다.
   * 3. 따라서 원본 처음부터 마지막까지 반드시 분석 단위가 존재한다.
   * 4. 후속 2.1에서 의미가 같은 인접 구간을 다시 병합한다.
   */
  const MAX_SEGMENT_SECONDS = 10;

  const cuts: number[] = [0, duration];

  for (
    let t = MAX_SEGMENT_SECONDS;
    t < duration;
    t += MAX_SEGMENT_SECONDS
  ) {
    cuts.push(t);
  }

  for (const boundary of boundaries) {
    if (
      boundary.time > 0 &&
      boundary.time < duration
    ) {
      cuts.push(boundary.time);
    }
  }

  const times = [...new Set(
    cuts.map((x) => Number(x.toFixed(3)))
  )].sort((a, b) => a - b);

  const scenes = [];

  for (let i = 0; i < times.length - 1; i++) {
    const start = times[i];
    const end = times[i + 1];

    if (end <= start) continue;

    scenes.push({
      sceneIndex: scenes.length,
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3)),
      duration: Number((end - start).toFixed(3)),
      segmentation:
        "FULL_COVERAGE_WINDOW",
      status:
        "AWAITING_UNDERSTANDING",
    });
  }

  return scenes;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD VIDEO BRAIN — FULL SOURCE SCAN",
    version: "2.0.0",
    principle:
      "전체 시간축을 로컬 FFmpeg로 끝까지 스캔한 뒤 AI 정밀분석 대상으로 넘긴다.",
    completionRule:
      "마지막 시간까지 스캔됐다는 검증 없이는 FULLY_SCANNED 처리하지 않는다.",
  });
}

export async function POST(req: NextRequest) {
  let progressFile = "";

  try {
    const body = await req.json();

    const uploadId = safeId(body.uploadId || "");

    if (!uploadId) {
      throw new Error("uploadId 없음");
    }

    const dir = path.join(ROOT, uploadId);

    const meta = await readJson<Meta>(
      path.join(dir, "meta.json")
    );

    if (!meta?.fileName) {
      throw new Error("meta.json 또는 fileName 없음");
    }

    const sourcePath = path.join(dir, meta.fileName);

    await fs.access(sourcePath);

    const outputDir = path.join(
      dir,
      "video-brain-v2"
    );

    await fs.mkdir(outputDir, {
      recursive: true,
    });

    progressFile = path.join(
      outputDir,
      "progress.json"
    );

    const resultFile = path.join(
      outputDir,
      "full-source-scan.json"
    );

    const source = await probe(sourcePath);

    if (!(source.duration > 0)) {
      throw new Error("원본 영상 길이를 읽지 못했습니다.");
    }

    await writeJson(progressFile, {
      engine: "JOPD VIDEO BRAIN",
      version: "2.0.0",
      stage: "FULL_SOURCE_SCAN",
      status: "STARTING",
      sourceName: meta.fileName,
      sourceDuration: source.duration,
      scannedUntil: 0,
      coveragePercent: 0,
      updatedAt: new Date().toISOString(),
    });

    const safety = makeSafetyPoints(
      source.duration
    );

    const boundaries = await detectScenes(
      sourcePath,
      source.duration,
      progressFile
    );

    const scenes = buildScenes(
      source.duration,
      boundaries
    );

    /*
     * FFmpeg가 exit 0으로 원본 전체 디코딩을 마쳐야만
     * 아래 FULLY_SCANNED 상태에 도달한다.
     */
    const coverage = {
      sourceStart: 0,
      sourceEnd: Number(source.duration.toFixed(3)),
      scannedStart: 0,
      scannedEnd: Number(source.duration.toFixed(3)),
      coveragePercent: 100,
      unscannedRanges: [] as Array<{
        start: number;
        end: number;
      }>,
    };

    const result = {
      ok: true,
      engine: "JOPD VIDEO BRAIN",
      version: "2.0.0",
      stage: "FULL_SOURCE_SCAN",
      status: "FULLY_DECODED",

      source: {
        uploadId,
        sourceName: meta.fileName,
        sourcePath,
        duration: Number(source.duration.toFixed(3)),
        streams: source.streams,
      },

      coverage,

      scanPolicy: {
        method:
          "FULL_SEQUENTIAL_DECODE + SCENE_CHANGE_DETECTION + SAFETY_INTERVAL",
        sceneThreshold: 0.3,
        safetyIntervalSeconds:
          safety.stepSeconds,
        maxFrameCap: null,
        note:
          "50-frame cap 없음. 전체 시간축 스캔 후 후속 AI 분석 대상을 선택한다.",
      },

      sceneBoundaryCount:
        boundaries.length,

      sceneCount:
        scenes.length,

      understandingStatus:
        "NOT_YET_FULLY_UNDERSTOOD",

      safetyPointCount:
        safety.points.length,

      sceneBoundaries:
        boundaries,

      scenes,

      safetyPoints:
        safety.points,

      nextStage: {
        name:
          "VIDEO BRAIN 2.1 SCENE UNDERSTANDING",
        rule:
          "모든 장면을 인덱싱한 뒤 대표 프레임/음성/전후 맥락을 분석하고 중요·불확실 구간을 정밀 재검사한다.",
      },

      createdAt:
        new Date().toISOString(),
    };

    await writeJson(
      resultFile,
      result
    );

    await writeJson(progressFile, {
      engine: "JOPD VIDEO BRAIN",
      version: "2.0.0",
      stage: "FULL_SOURCE_SCAN",
      status: "FULLY_DECODED",
      sourceName: meta.fileName,
      sourceDuration: source.duration,
      scannedUntil: source.duration,
      coveragePercent: 100,
      sceneCount: scenes.length,
      unscannedRanges: [],
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (progressFile) {
      try {
        const previous =
          await readJson<Record<string, unknown>>(
            progressFile
          );

        await writeJson(progressFile, {
          ...(previous || {}),
          status: "ERROR",
          error:
            error instanceof Error
              ? error.message
              : String(error),
          updatedAt:
            new Date().toISOString(),
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        ok: false,
        engine: "JOPD VIDEO BRAIN",
        version: "2.0.0",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
