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

type AudioTruth = {
  status?: "TRUSTED" | "REVIEW" | "SUSPECT";
  avgLogprob?: number | null;
  noSpeechProb?: number | null;
  compressionRatio?: number | null;
  warnings?: string[];
};

type Segment = {
  start: number;
  end: number;
  text: string;
  audioTruth?: AudioTruth;
};

type Transcript = {
  uploadId?: string;
  sourceName?: string;
  text?: string;
  segments?: Segment[];
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
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

function isFormulaic(text: string) {
  const t = text.replace(/\s+/g, "");

  const patterns = [
    "감사합니다",
    "시청해주셔서",
    "시청해주신",
    "구독",
    "좋아요",
    "알림설정",
    "다음영상",
    "다음영상으로",
    "이어집니다",
    "봐주셔서",
  ];

  return patterns.some((x) =>
    t.includes(x)
  );
}

function needsVerification(seg: Segment) {
  if (
    seg.audioTruth?.status === "SUSPECT" ||
    seg.audioTruth?.status === "REVIEW"
  ) {
    return true;
  }

  /*
   * Whisper가 자신 있게 환각하는 경우를 잡기 위해
   * 상투적인 방송 문구는 TRUSTED라도 재검증한다.
   */
  if (isFormulaic(seg.text)) {
    return true;
  }

  /*
   * 매우 짧은 발화는 문맥 손실에 취약하므로
   * 별도 재검증 후보로 올린다.
   */
  const duration =
    Number(seg.end) - Number(seg.start);

  if (
    duration <= 1.25 &&
    seg.text.trim().length >= 2
  ) {
    return true;
  }

  return false;
}

async function extractContextAudio(args: {
  sourcePath: string;
  outputPath: string;
  start: number;
  end: number;
}) {
  const padBefore = 4;
  const padAfter = 4;

  const clipStart = Math.max(
    0,
    args.start - padBefore
  );

  const clipEnd =
    args.end + padAfter;

  const duration =
    Math.max(
      1,
      clipEnd - clipStart
    );

  await execFileAsync(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",

      "-ss",
      String(clipStart),

      "-i",
      args.sourcePath,

      "-t",
      String(duration),

      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "96k",

      args.outputPath,
    ]
  );

  return {
    clipStart,
    clipEnd:
      clipStart + duration,
  };
}

async function transcribeAudio(
  audioPath: string
) {
  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 없음"
    );
  }

  /*
   * 검증 단계에서는 SOURCE 타임코드와
   * Whisper 원시 신뢰도 확보가 중요하므로
   * whisper-1 verbose_json을 명시한다.
   */
  const audio =
    await fs.readFile(audioPath);

  const form =
    new FormData();

  form.append(
    "file",
    new Blob([audio], {
      type: "audio/mpeg",
    }),
    path.basename(audioPath)
  );

  form.append(
    "model",
    "whisper-1"
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

  /*
   * temperature 0으로 재검증 시
   * 임의성 증가를 막는다.
   */
  form.append(
    "temperature",
    "0"
  );

  const response = await fetch(
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

  if (!response.ok) {
    throw new Error(
      `재전사 실패: ${
        await response.text()
      }`
    );
  }

  return await response.json() as {
    text?: string;
    segments?: Array<{
      start?: number;
      end?: number;
      text?: string;
      avg_logprob?: number;
      no_speech_prob?: number;
      compression_ratio?: number;
    }>;
  };
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?'"“”‘’\s]/g, "");
}

function containsOriginal(
  original: string,
  verificationText: string
) {
  const a = normalize(original);
  const b = normalize(verificationText);

  if (!a || !b) return false;

  return (
    b.includes(a) ||
    a.includes(b)
  );
}

function evaluateVerification(args: {
  original: Segment;
  secondText: string;
  secondSegments: Array<{
    start?: number;
    end?: number;
    text?: string;
    avg_logprob?: number;
    no_speech_prob?: number;
    compression_ratio?: number;
  }>;
}) {
  const {
    original,
    secondText,
    secondSegments,
  } = args;

  const repeated =
    containsOriginal(
      original.text,
      secondText
    );

  const strongSpeechEvidence =
    secondSegments.some((seg) => {
      const noSpeech =
        typeof seg.no_speech_prob ===
        "number"
          ? seg.no_speech_prob
          : null;

      const logprob =
        typeof seg.avg_logprob ===
        "number"
          ? seg.avg_logprob
          : null;

      return (
        (
          noSpeech === null ||
          noSpeech < 0.35
        ) &&
        (
          logprob === null ||
          logprob > -0.7
        )
      );
    });

  /*
   * 중요한 원칙:
   *
   * VERIFIED라고 해도
   * "100% 실제 발화 확정"을 의미하지 않는다.
   *
   * 같은 원음의 독립 재전사에서도
   * 문장이 재현되고 음성 신호가 충분하다는 뜻이다.
   */
  if (
    repeated &&
    strongSpeechEvidence
  ) {
    return {
      status:
        "REPEATED_IN_SECOND_PASS",
      editorialUse:
        "REVIEW_BEFORE_FACT",
      reason:
        "독립 재전사에서도 동일/유사 문장이 재현됨. 실제 발화 확정 전 A/V 또는 원음 확인 필요.",
    };
  }

  if (!repeated) {
    return {
      status:
        "TRANSCRIPT_CONFLICT",
      editorialUse:
        "BLOCK",
      reason:
        "독립 재전사에서 기존 문장이 재현되지 않음.",
    };
  }

  return {
    status:
      "WEAK_AUDIO_EVIDENCE",
    editorialUse:
      "BLOCK",
    reason:
      "재전사 문구는 유사하지만 음성 신뢰도가 충분하지 않음.",
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine:
      "JOPD AUDIO TRUTH",
    version:
      "1.3.0",
    stage:
      "SECOND PASS AUDIO VERIFICATION",
    principle:
      "TRUSTED 전사도 원음의 실제 발화 확정을 의미하지 않는다.",
  });
}

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json() as {
        uploadId?: string;
      };

    const uploadId =
      safeId(
        String(
          body.uploadId || ""
        )
      );

    if (!uploadId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "uploadId 없음",
        },
        {
          status: 400,
        }
      );
    }

    const dir =
      path.join(
        ROOT,
        uploadId
      );

    const meta =
      await readJson<{
        fileName?: string;
      }>(
        path.join(
          dir,
          "meta.json"
        )
      );

    if (!meta?.fileName) {
      throw new Error(
        "meta.json 없음"
      );
    }

    const sourcePath =
      path.join(
        dir,
        meta.fileName
      );

    await fs.access(
      sourcePath
    );

    const transcript =
      await readJson<Transcript>(
        path.join(
          dir,
          "transcript.json"
        )
      );

    if (!transcript) {
      throw new Error(
        "transcript.json 없음"
      );
    }

    const segments =
      Array.isArray(
        transcript.segments
      )
        ? transcript.segments
        : [];

    const targets =
      segments.filter(
        needsVerification
      );

    const verifyDir =
      path.join(
        dir,
        "audio-truth"
      );

    await fs.mkdir(
      verifyDir,
      {
        recursive: true,
      }
    );

    const results = [];

    for (
      let i = 0;
      i < targets.length;
      i++
    ) {
      const target =
        targets[i];

      const audioPath =
        path.join(
          verifyDir,
          `verify-${String(i).padStart(
            3,
            "0"
          )}.mp3`
        );

      const context =
        await extractContextAudio({
          sourcePath,
          outputPath:
            audioPath,
          start:
            Number(
              target.start
            ),
          end:
            Number(
              target.end
            ),
        });

      const second =
        await transcribeAudio(
          audioPath
        );

      const secondText =
        String(
          second.text || ""
        ).trim();

      const secondSegments =
        Array.isArray(
          second.segments
        )
          ? second.segments
          : [];

      const evaluation =
        evaluateVerification({
          original:
            target,
          secondText,
          secondSegments,
        });

      results.push({
        original: {
          start:
            target.start,
          end:
            target.end,
          text:
            target.text,
          firstPassAudioTruth:
            target.audioTruth ||
            null,
        },

        verificationWindow: {
          start:
            context.clipStart,
          end:
            context.clipEnd,
        },

        secondPass: {
          text:
            secondText,

          segments:
            secondSegments.map(
              (seg) => ({
                start:
                  context.clipStart +
                  Number(
                    seg.start || 0
                  ),

                end:
                  context.clipStart +
                  Number(
                    seg.end || 0
                  ),

                text:
                  String(
                    seg.text || ""
                  ).trim(),

                avgLogprob:
                  seg.avg_logprob ??
                  null,

                noSpeechProb:
                  seg.no_speech_prob ??
                  null,

                compressionRatio:
                  seg.compression_ratio ??
                  null,
              })
            ),
        },

        evaluation,
      });
    }

    const output = {
      uploadId,
      sourceName:
        meta.fileName,
      version:
        "1.3.0",

      targetCount:
        targets.length,

      results,

      createdAt:
        new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(
        verifyDir,
        "verification.json"
      ),
      JSON.stringify(
        output,
        null,
        2
      )
    );

    return NextResponse.json({
      ok: true,
      engine:
        "JOPD AUDIO TRUTH",
      ...output,
    });
  } catch (error) {
    console.error(
      "[JOPD AUDIO TRUTH]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
