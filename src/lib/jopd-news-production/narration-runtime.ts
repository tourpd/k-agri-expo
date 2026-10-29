import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const FFPROBE = "/opt/homebrew/bin/ffprobe";

export type NarrationSegment = {
  index: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
};

function run(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} 실패 (exit ${code})\n${stderr.slice(-2000)}`,
        ),
      );
    });
  });
}

function splitNarration(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function srtTime(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(secs).padStart(2, "0")},` +
    `${String(millis).padStart(3, "0")}`
  );
}

function makeSrt(segments: NarrationSegment[]): string {
  return segments
    .map(
      (segment) =>
        `${segment.index}\n` +
        `${srtTime(segment.startSeconds)} --> ${srtTime(segment.endSeconds)}\n` +
        `${segment.text}\n`,
    )
    .join("\n");
}

async function audioDuration(filePath: string): Promise<number> {
  const result = await run(FFPROBE, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  const duration = Number(result.stdout.trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("생성된 내레이션 음성 길이를 확인할 수 없습니다.");
  }

  return duration;
}

function buildTimeline(
  narration: string,
  duration: number,
): NarrationSegment[] {
  const sentences = splitNarration(narration);

  if (sentences.length === 0) {
    throw new Error("내레이션 문장이 없습니다.");
  }

  /*
   * TTS 전체 음성의 실제 duration을 기준으로 자막 시간을 배분한다.
   * 아직 word-level alignment가 아니므로 문자량 비례의 1차 타임라인이다.
   * 이후 실제 음성 alignment 엔진으로 교체 가능하다.
   */
  const weights = sentences.map((text) =>
    Math.max(1, Array.from(text.replace(/\s/g, "")).length),
  );

  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  let cursor = 0;

  return sentences.map((text, i) => {
    const startSeconds = cursor;

    const endSeconds =
      i === sentences.length - 1
        ? duration
        : Math.min(
            duration,
            cursor + duration * (weights[i] / totalWeight),
          );

    cursor = endSeconds;

    return {
      index: i + 1,
      text,
      startSeconds,
      endSeconds,
    };
  });
}

export async function createNewsNarration(input: {
  narration: string;
  outputDir: string;
  voice?: string;
}) {
  const narration = input.narration.trim();

  if (!narration) {
    throw new Error("확정 내레이션이 없습니다.");
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 없습니다.");
  }

  await mkdir(input.outputDir, { recursive: true });

  const client = new OpenAI({ apiKey });

  const audioPath = path.join(input.outputDir, "narration.mp3");
  const srtPath = path.join(input.outputDir, "narration.srt");
  const timelinePath = path.join(
    input.outputDir,
    "narration-timeline.json",
  );

  const speech = await client.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
    voice: (input.voice || process.env.OPENAI_NEWS_VOICE || "alloy") as
      | "alloy"
      | "ash"
      | "ballad"
      | "coral"
      | "echo"
      | "fable"
      | "nova"
      | "onyx"
      | "sage"
      | "shimmer"
      | "verse",
    input: narration,
    response_format: "mp3",
    instructions:
      "한국어 뉴스 기자처럼 정확하고 또렷하게 읽는다. 과장하지 않는다. 사실 전달을 우선한다.",
  });

  const audioBuffer = Buffer.from(await speech.arrayBuffer());
  await writeFile(audioPath, audioBuffer);

  const duration = await audioDuration(audioPath);
  const segments = buildTimeline(narration, duration);
  const srt = makeSrt(segments);

  await writeFile(srtPath, srt, "utf8");
  await writeFile(
    timelinePath,
    JSON.stringify(
      {
        version: "JOPD_NEWS_NARRATION_V1",
        narration,
        duration,
        audioPath,
        srtPath,
        segments,
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    narration,
    duration,
    audioPath,
    srtPath,
    timelinePath,
    segments,
  };
}
