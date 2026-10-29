import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type TranscriptSegment = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  confidence: {
    avgLogprob: number | null;
    noSpeechProb: number | null;
    compressionRatio: number | null;
  };
};

export type TranscriptionEvidence = {
  version: "JOPD_BROADCAST_TRANSCRIPTION_EVIDENCE_V1";
  transcriptionId: string;
  createdAt: string;
  truthClass: "OBSERVED_EVENT";
  evidenceType: "TRANSCRIPT";
  source: {
    audioPath: string;
    audioBytes: number;
    language: "ko";
  };
  model: string;
  fullText: string;
  segments: TranscriptSegment[];
  quality: {
    segmentCount: number;
    segmentsWithConfidence: number;
    possibleNoSpeechSegments: number;
  };
};

type WhisperResponse = {
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

function finiteOrNull(
  value: unknown,
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}

export async function createTranscriptionEvidence(input: {
  audioPath: string;
  outputDir?: string;
}): Promise<TranscriptionEvidence> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 없음");
  }

  const audioPath = path.resolve(input.audioPath);
  const audio = await fs.readFile(audioPath);
  const audioStat = await fs.stat(audioPath);

  if (!audioStat.isFile() || audioStat.size <= 0) {
    throw new Error("전사할 오디오 파일이 비어 있습니다");
  }

  const requestedModel =
    process.env.OPENAI_TRANSCRIBE_MODEL ||
    "whisper-1";

  /*
   * SOURCE 시간축과 Whisper 원시 신뢰도를
   * 보존하기 위해 verbose_json + segment를 요구한다.
   * 이를 지원하지 않는 환경변수 모델이면
   * whisper-1로 한 번 재시도한다.
   */
  async function requestTranscription(
    model: string,
  ): Promise<{
    response: Response;
    model: string;
  }> {
    const form = new FormData();

    form.append(
      "file",
      new Blob([audio], {
        type: "audio/wav",
      }),
      path.basename(audioPath),
    );

    form.append("model", model);
    form.append("language", "ko");
    form.append(
      "response_format",
      "verbose_json",
    );
    form.append(
      "timestamp_granularities[]",
      "segment",
    );
    form.append("temperature", "0");

    return {
      response: await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: form,
        },
      ),
      model,
    };
  }

  let attempt =
    await requestTranscription(requestedModel);

  if (
    !attempt.response.ok &&
    requestedModel !== "whisper-1"
  ) {
    attempt =
      await requestTranscription("whisper-1");
  }

  if (!attempt.response.ok) {
    throw new Error(
      `Broadcast Hunter 전사 실패: ${
        await attempt.response.text()
      }`,
    );
  }

  const raw =
    (await attempt.response.json()) as WhisperResponse;

  const segments: TranscriptSegment[] =
    (raw.segments ?? [])
      .map((segment, index) => ({
        index,
        startSeconds:
          finiteOrNull(segment.start) ?? 0,
        endSeconds:
          finiteOrNull(segment.end) ?? 0,
        text: String(segment.text ?? "").trim(),
        confidence: {
          avgLogprob:
            finiteOrNull(segment.avg_logprob),
          noSpeechProb:
            finiteOrNull(segment.no_speech_prob),
          compressionRatio:
            finiteOrNull(
              segment.compression_ratio,
            ),
        },
      }))
      .filter(
        (segment) =>
          segment.text.length > 0 &&
          segment.endSeconds >=
            segment.startSeconds,
      );

  const transcriptionId = createHash("sha256")
    .update(
      [
        audioPath,
        audioStat.size,
        attempt.model,
        raw.text ?? "",
      ].join("\n"),
    )
    .digest("hex")
    .slice(0, 20);

  const result: TranscriptionEvidence = {
    version:
      "JOPD_BROADCAST_TRANSCRIPTION_EVIDENCE_V1",
    transcriptionId,
    createdAt: new Date().toISOString(),
    truthClass: "OBSERVED_EVENT",
    evidenceType: "TRANSCRIPT",
    source: {
      audioPath,
      audioBytes: audioStat.size,
      language: "ko",
    },
    model: attempt.model,
    fullText: String(raw.text ?? "").trim(),
    segments,
    quality: {
      segmentCount: segments.length,
      segmentsWithConfidence:
        segments.filter(
          (segment) =>
            segment.confidence.avgLogprob !== null ||
            segment.confidence.noSpeechProb !== null,
        ).length,
      possibleNoSpeechSegments:
        segments.filter(
          (segment) =>
            (segment.confidence.noSpeechProb ?? 0) >=
            0.5,
        ).length,
    },
  };

  const outputDir = input.outputDir
    ? path.resolve(input.outputDir)
    : path.dirname(audioPath);

  await fs.mkdir(outputDir, {
    recursive: true,
  });

  await atomicJsonWrite(
    path.join(
      outputDir,
      "transcription-evidence.json",
    ),
    result,
  );

  return result;
}
