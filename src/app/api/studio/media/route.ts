import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = path.join(
  process.cwd(),
  ".jopd-media"
);

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function safeName(value: string) {
  return path
    .basename(value)
    .replace(/[^a-zA-Z0-9._가-힣-]/g, "_");
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD MEDIA INGEST ENGINE",
    version: "1.0.0",
    ffmpeg: "/opt/homebrew/bin/ffmpeg",
    ffprobe: "/opt/homebrew/bin/ffprobe",
  });
}

export async function POST(req: NextRequest) {
  try {
    const action =
      req.nextUrl.searchParams.get("action");

    if (action === "chunk") {
      return await uploadChunk(req);
    }

    if (action === "complete") {
      return await completeUpload(req);
    }

    if (action === "transcribe") {
      return await transcribeMedia(req);
    }

    return NextResponse.json(
      { ok: false, error: "unknown action" },
      { status: 400 }
    );
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

async function uploadChunk(req: NextRequest) {
  const uploadId = safeId(
    req.headers.get("x-upload-id") || ""
  );

  const fileName = safeName(
    req.headers.get("x-file-name") || "source.mp4"
  );

  const index = Number(
    req.headers.get("x-chunk-index")
  );

  const total = Number(
    req.headers.get("x-total-chunks")
  );

  if (
    !uploadId ||
    !Number.isInteger(index) ||
    !Number.isInteger(total)
  ) {
    throw new Error("잘못된 업로드 정보");
  }

  const dir = path.join(
    ROOT,
    uploadId
  );

  const chunksDir = path.join(
    dir,
    "chunks"
  );

  await ensureDir(chunksDir);

  const body = Buffer.from(
    await req.arrayBuffer()
  );

  const chunkPath = path.join(
    chunksDir,
    `${String(index).padStart(6, "0")}.part`
  );

  await fs.writeFile(chunkPath, body);

  await fs.writeFile(
    path.join(dir, "meta.json"),
    JSON.stringify(
      {
        uploadId,
        fileName,
        total,
      },
      null,
      2
    )
  );

  return NextResponse.json({
    ok: true,
    uploadId,
    index,
    total,
  });
}

async function completeUpload(req: NextRequest) {
  const data = await req.json();

  const uploadId = safeId(
    data.uploadId || ""
  );

  if (!uploadId) {
    throw new Error("uploadId 없음");
  }

  const dir = path.join(
    ROOT,
    uploadId
  );

  const meta = JSON.parse(
    await fs.readFile(
      path.join(dir, "meta.json"),
      "utf8"
    )
  );

  const chunksDir = path.join(
    dir,
    "chunks"
  );

  const sourcePath = path.join(
    dir,
    meta.fileName
  );

  const handle = await fs.open(
    sourcePath,
    "w"
  );

  try {
    for (
      let i = 0;
      i < meta.total;
      i++
    ) {
      const part = await fs.readFile(
        path.join(
          chunksDir,
          `${String(i).padStart(
            6,
            "0"
          )}.part`
        )
      );

      await handle.write(part);
    }
  } finally {
    await handle.close();
  }

  const { stdout } =
    await execFileAsync(
      "/opt/homebrew/bin/ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        sourcePath,
      ]
    );

  const duration =
    Number(stdout.trim()) || 0;

  await fs.rm(chunksDir, {
    recursive: true,
    force: true,
  });

  return NextResponse.json({
    ok: true,
    uploadId,
    fileName: meta.fileName,
    duration,
  });
}

async function transcribeMedia(
  req: NextRequest
) {
  const data = await req.json();

  const uploadId = safeId(
    data.uploadId || ""
  );

  if (!uploadId) {
    throw new Error("uploadId 없음");
  }

  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 없음"
    );
  }

  const dir = path.join(
    ROOT,
    uploadId
  );

  const meta = JSON.parse(
    await fs.readFile(
      path.join(dir, "meta.json"),
      "utf8"
    )
  );

  const sourcePath = path.join(
    dir,
    meta.fileName
  );

  const audioDir = path.join(
    dir,
    "audio"
  );

  await fs.rm(audioDir, {
    recursive: true,
    force: true,
  });

  await ensureDir(audioDir);

  /*
   * 원본이 수백 MB여도 AI에 영상 전체를
   * 보내지 않는다.
   *
   * FFmpeg가 오디오만 mono / 16kHz /
   * 64kbps MP3로 추출하고 10분 단위로
   * 분할한다.
   */
  await execFileAsync(
    "/opt/homebrew/bin/ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      sourcePath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "-f",
      "segment",
      "-segment_time",
      "600",
      "-reset_timestamps",
      "1",
      path.join(
        audioDir,
        "audio-%03d.mp3"
      ),
    ]
  );

  const audioFiles = (
    await fs.readdir(audioDir)
  )
    .filter((name) =>
      name.endsWith(".mp3")
    )
    .sort();

  const allSegments: Array<{
    start: number;
    end: number;
    text: string;
    // 음성 인식 신뢰도 정보 (선택)
    audioTruth?: any;
  }> = [];

  let fullText = "";

  const requestedModel =
    process.env.OPENAI_TRANSCRIBE_MODEL ||
    "whisper-1";

  for (
    let i = 0;
    i < audioFiles.length;
    i++
  ) {
    const fileName = audioFiles[i];

    const audio = await fs.readFile(
      path.join(
        audioDir,
        fileName
      )
    );

    const form = new FormData();

    form.append(
      "file",
      new Blob([audio], {
        type: "audio/mpeg",
      }),
      fileName
    );

    /*
     * 정확한 SOURCE 타임코드가 필요하므로
     * segment timestamp가 안정적인
     * whisper-1 형식을 우선 사용한다.
     */
    form.append(
      "model",
      requestedModel
    );

    form.append(
      "language",
      "ko"
    );

    form.append(
      "response_format",
      "verbose_json"
    );

    form.append(
      "timestamp_granularities[]",
      "segment"
    );

    let response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
        },
        body: form,
      }
    );

    /*
     * 환경변수 모델이 verbose_json segment를
     * 지원하지 않는 경우 SOURCE 타임코드를
     * 보존하기 위해 whisper-1로 재시도한다.
     */
    if (!response.ok) {
      const firstError =
        await response.text();

      if (
        requestedModel !==
        "whisper-1"
      ) {
        const retryForm =
          new FormData();

        retryForm.append(
          "file",
          new Blob([audio], {
            type: "audio/mpeg",
          }),
          fileName
        );

        retryForm.append(
          "model",
          "whisper-1"
        );

        retryForm.append(
          "language",
          "ko"
        );

        retryForm.append(
          "response_format",
          "verbose_json"
        );

        retryForm.append(
          "timestamp_granularities[]",
          "segment"
        );

        response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${apiKey}`,
            },
            body: retryForm,
          }
        );
      }

      if (!response.ok) {
        const retryError =
          await response.text();

        throw new Error(
          `전사 실패: ${firstError} / ${retryError}`
        );
      }
    }

    const result = await response.json();

    const offset = i * 600;

    const segments =
      Array.isArray(result.segments)
        ? result.segments
        : [];

    for (const seg of segments) {
      const text = String(
        seg.text || ""
      ).trim();

      if (!text) continue;

      /*
       * JOPD AUDIO TRUTH 1.2
       *
       * 전사 문장만 저장하지 않는다.
       * Whisper가 제공하는 원시 신뢰도 정보도
       * SOURCE 검증을 위해 함께 보존한다.
       *
       * 주의:
       * 이 값 하나만으로 실제 발화 여부를
       * 확정하지 않는다.
       */
      const avgLogprob =
        typeof seg.avg_logprob === "number"
          ? seg.avg_logprob
          : null;

      const noSpeechProb =
        typeof seg.no_speech_prob === "number"
          ? seg.no_speech_prob
          : null;

      const compressionRatio =
        typeof seg.compression_ratio === "number"
          ? seg.compression_ratio
          : null;

      /*
       * SUSPECT:
       * 음성이 아닐 가능성이 상당히 높거나
       * 모델 확신도가 매우 낮은 경우.
       *
       * REVIEW:
       * 경계 구간.
       *
       * TRUSTED:
       * 음성모델 기준으로 특별한 위험 신호가
       * 발견되지 않은 경우.
       *
       * TRUSTED 역시 "사실 확정"이라는 뜻은 아니다.
       * VIDEO BRAIN의 화면/맥락 검증을 추가로 거친다.
       */
      let transcriptStatus:
        | "TRUSTED"
        | "REVIEW"
        | "SUSPECT" =
        "TRUSTED";

      const transcriptWarnings: string[] = [];

      if (
        noSpeechProb !== null &&
        noSpeechProb >= 0.6
      ) {
        transcriptStatus = "SUSPECT";
        transcriptWarnings.push(
          "NO_SPEECH_PROB_HIGH"
        );
      }

      if (
        avgLogprob !== null &&
        avgLogprob <= -1.0
      ) {
        transcriptStatus = "SUSPECT";
        transcriptWarnings.push(
          "AVG_LOGPROB_LOW"
        );
      }

      if (
        compressionRatio !== null &&
        compressionRatio >= 2.4
      ) {
        transcriptStatus = "SUSPECT";
        transcriptWarnings.push(
          "COMPRESSION_RATIO_HIGH"
        );
      }

      if (transcriptStatus !== "SUSPECT") {
        if (
          (
            noSpeechProb !== null &&
            noSpeechProb >= 0.35
          ) ||
          (
            avgLogprob !== null &&
            avgLogprob <= -0.7
          ) ||
          (
            compressionRatio !== null &&
            compressionRatio >= 2.0
          )
        ) {
          transcriptStatus = "REVIEW";
          transcriptWarnings.push(
            "TRANSCRIPT_CONFIDENCE_BORDERLINE"
          );
        }
      }

      allSegments.push({
        start:
          offset +
          Number(seg.start || 0),

        end:
          offset +
          Number(seg.end || 0),

        text,

        audioTruth: {
          status: transcriptStatus,

          avgLogprob,

          noSpeechProb,

          compressionRatio,

          warnings:
            transcriptWarnings,
        },
      });
    }

    fullText +=
      (fullText ? "\n" : "") +
      String(result.text || "").trim();
  }

  /*
   * JOPD AUDIO TRUTH 1.2
   *
   * 전체 전사 상태를 요약한다.
   * SUSPECT 문장이 하나라도 있으면
   * 이후 STORY ENGINE이 무조건 사실로
   * 사용하지 못하도록 표시한다.
   */
  const audioTruthSummary = {
    totalSegments:
      allSegments.length,

    trustedSegments:
      allSegments.filter(
        (segment) =>
          segment.audioTruth?.status ===
          "TRUSTED"
      ).length,

    reviewSegments:
      allSegments.filter(
        (segment) =>
          segment.audioTruth?.status ===
          "REVIEW"
      ).length,

    suspectSegments:
      allSegments.filter(
        (segment) =>
          segment.audioTruth?.status ===
          "SUSPECT"
      ).length,
  };

  const transcript = {
    uploadId,
    sourceName: meta.fileName,
    text: fullText,

    /*
     * text는 검색/표시용 원문이다.
     * 사실 판정에는 반드시 segments.audioTruth를
     * 함께 사용해야 한다.
     */
    segments: allSegments,

    audioTruth: {
      version: "1.2.0",
      principle:
        "전사 결과는 원음 자체가 아니다. 신뢰도와 A/V 검증을 거친다.",

      ...audioTruthSummary,
    },

    createdAt:
      new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(
      dir,
      "transcript.json"
    ),
    JSON.stringify(
      transcript,
      null,
      2
    )
  );

  return NextResponse.json({
    ok: true,
    ...transcript,
  });
}
