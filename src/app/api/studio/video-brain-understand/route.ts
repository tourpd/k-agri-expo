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

type FrameInfo = {
  role: "START" | "MIDDLE" | "END";
  time: number;
  file: string;
};

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function safeTime(
  start: number,
  end: number,
  ratio: number
) {
  const duration = end - start;

  if (duration <= 0.1) {
    return start;
  }

  const margin = Math.min(0.25, duration * 0.1);

  return Math.max(
    start,
    Math.min(
      end - 0.01,
      start + margin + (duration - margin * 2) * ratio
    )
  );
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
      maxBuffer: 10 * 1024 * 1024,
    }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD VIDEO BRAIN — FULL UNDERSTANDING",
    version: "2.1.0",
    stage: "FRAME COVERAGE VALIDATION",
    principle:
      "FULLY_DECODED 전체 구간에서 복수 시각 증거를 확보한 뒤 의미 분석한다.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uploadId = String(body?.uploadId || "").trim();

    if (!uploadId) {
      return NextResponse.json(
        {
          ok: false,
          error: "uploadId required",
        },
        { status: 400 }
      );
    }

    const uploadDir = path.join(ROOT, uploadId);
    const metaPath = path.join(uploadDir, "meta.json");
    const scanPath = path.join(
      uploadDir,
      "video-brain-v2",
      "full-source-scan.json"
    );

    if (!(await exists(metaPath))) {
      throw new Error("meta.json not found");
    }

    if (!(await exists(scanPath))) {
      throw new Error(
        "VIDEO BRAIN 2.0 full-source-scan.json not found"
      );
    }

    const meta = JSON.parse(
      await fs.readFile(metaPath, "utf8")
    );

    const scan = JSON.parse(
      await fs.readFile(scanPath, "utf8")
    );

    if (scan.status !== "FULLY_DECODED") {
      throw new Error(
        `Source is not FULLY_DECODED: ${scan.status}`
      );
    }

    const sourcePath = path.join(
      uploadDir,
      meta.fileName
    );

    if (!(await exists(sourcePath))) {
      throw new Error("Original source file not found");
    }

    const rawScenes: ScanScene[] =
      Array.isArray(scan.scenes) ? scan.scenes : [];

    if (!rawScenes.length) {
      throw new Error("No analysis segments found");
    }

    /*
     * 마지막에 0.036초처럼 너무 작은 찌꺼기 구간이 있으면
     * 앞 구간에 병합한다.
     */
    const scenes: ScanScene[] = rawScenes.map((x) => ({
      ...x,
    }));

    if (
      scenes.length >= 2 &&
      scenes[scenes.length - 1].duration < 1
    ) {
      const last = scenes.pop()!;
      const prev = scenes[scenes.length - 1];

      prev.end = last.end;
      prev.duration = Number(
        (prev.end - prev.start).toFixed(3)
      );
    }

    const outputRoot = path.join(
      uploadDir,
      "video-brain-v2",
      "understanding"
    );

    const framesRoot = path.join(
      outputRoot,
      "frames"
    );

    await fs.mkdir(framesRoot, {
      recursive: true,
    });

    const results = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];

      const times = [
        {
          role: "START" as const,
          time: safeTime(
            scene.start,
            scene.end,
            0
          ),
        },
        {
          role: "MIDDLE" as const,
          time: safeTime(
            scene.start,
            scene.end,
            0.5
          ),
        },
        {
          role: "END" as const,
          time: safeTime(
            scene.start,
            scene.end,
            1
          ),
        },
      ];

      const frames: FrameInfo[] = [];

      for (const item of times) {
        const filename =
          `segment-${String(i).padStart(4, "0")}` +
          `-${item.role.toLowerCase()}.jpg`;

        const outputPath = path.join(
          framesRoot,
          filename
        );

        await extractFrame(
          sourcePath,
          outputPath,
          item.time
        );

        const stat = await fs.stat(outputPath);

        if (stat.size <= 0) {
          throw new Error(
            `Empty frame generated: ${filename}`
          );
        }

        frames.push({
          role: item.role,
          time: Number(item.time.toFixed(3)),
          file: filename,
        });
      }

      results.push({
        segmentIndex: i,
        start: scene.start,
        end: scene.end,
        duration: scene.duration,
        status: "VISUAL_EVIDENCE_READY",
        frames,
      });
    }

    const expectedFrames =
      results.length * 3;

    const actualFrames =
      results.reduce(
        (sum, x) => sum + x.frames.length,
        0
      );

    const firstStart =
      results[0]?.start ?? null;

    const finalEnd =
      results[results.length - 1]?.end ?? null;

    const sourceDuration =
      Number(scan?.source?.duration || 0);

    const timelineCovered =
      firstStart === 0 &&
      finalEnd !== null &&
      Math.abs(finalEnd - sourceDuration) < 0.1;

    const frameCoverageComplete =
      actualFrames === expectedFrames &&
      timelineCovered;

    const output = {
      ok: true,
      engine:
        "JOPD VIDEO BRAIN — FULL UNDERSTANDING",
      version: "2.1.0",

      status: frameCoverageComplete
        ? "VISUAL_EVIDENCE_COMPLETE"
        : "VISUAL_EVIDENCE_INCOMPLETE",

      understandingStatus:
        "NOT_YET_FULLY_UNDERSTOOD",

      source: {
        uploadId,
        sourceName: meta.fileName,
        duration: sourceDuration,
      },

      coverage: {
        segmentCount: results.length,
        expectedFrames,
        actualFrames,
        framesPerSegment: 3,
        timelineStart: firstStart,
        timelineEnd: finalEnd,
        timelineCovered,
        frameCoverageComplete,
      },

      segments: results,
    };

    await fs.writeFile(
      path.join(
        outputRoot,
        "visual-evidence.json"
      ),
      JSON.stringify(output, null, 2),
      "utf8"
    );

    return NextResponse.json(output);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engine:
          "JOPD VIDEO BRAIN — FULL UNDERSTANDING",
        version: "2.1.0",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
