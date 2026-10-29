import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const FFPROBE = "/opt/homebrew/bin/ffprobe";
const MEDIA_ROOT = path.join(
  process.cwd(),
  ".jopd-media",
  "broadcast-hunter",
  "evidence",
);

export type MediaProbe = {
  durationSeconds: number;
  video: {
    codec: string;
    width: number;
    height: number;
  } | null;
  audio: {
    codec: string;
    sampleRate: number;
    channels: number;
  } | null;
};

export type EvidenceFrame = {
  index: number;
  timeSeconds: number;
  path: string;
};

export type EvidenceManifest = {
  version: "JOPD_BROADCAST_EVIDENCE_V1";
  evidenceId: string;
  createdAt: string;
  source: {
    sourceUrl: string;
    sourceTitle: string;
    sourcePath: string;
    sourceBytes: number;
    provenanceNote: string | null;
  };
  probe: MediaProbe;
  audio: {
    path: string;
    codec: "pcm_s16le";
    sampleRate: 16000;
    channels: 1;
    purpose: "TRANSCRIPTION_EVIDENCE";
  } | null;
  frames: EvidenceFrame[];
  acquisition: {
    frameIntervalSeconds: number;
    rawMediaIsApprovedMemory: false;
    derivedEvidenceRequiresResearch: true;
  };
};

type ProbeJson = {
  streams?: Array<{
    codec_name?: string;
    codec_type?: string;
    width?: number;
    height?: number;
    sample_rate?: string;
    channels?: number;
  }>;
  format?: {
    duration?: string;
  };
};

function run(binary: string, args: string[]): string {
  return execFileSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function probeMedia(sourcePath: string): MediaProbe {
  const raw = run(FFPROBE, [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type,codec_name,width,height,sample_rate,channels",
    "-of",
    "json",
    sourcePath,
  ]);

  const parsed = JSON.parse(raw) as ProbeJson;
  const durationSeconds = Number(parsed.format?.duration ?? 0);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Evidence source has no valid media duration");
  }

  const videoStream = parsed.streams?.find(
    (stream) => stream.codec_type === "video",
  );
  const audioStream = parsed.streams?.find(
    (stream) => stream.codec_type === "audio",
  );

  return {
    durationSeconds,
    video: videoStream
      ? {
          codec: videoStream.codec_name ?? "unknown",
          width: Number(videoStream.width ?? 0),
          height: Number(videoStream.height ?? 0),
        }
      : null,
    audio: audioStream
      ? {
          codec: audioStream.codec_name ?? "unknown",
          sampleRate: Number(audioStream.sample_rate ?? 0),
          channels: Number(audioStream.channels ?? 0),
        }
      : null,
  };
}

async function atomicJsonWrite(
  targetPath: string,
  value: unknown,
): Promise<void> {
  const tempPath = `${targetPath}.tmp-${process.pid}`;
  await writeFile(
    tempPath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
  await rename(tempPath, targetPath);
}

export async function acquireBroadcastEvidence(input: {
  sourcePath: string;
  sourceUrl: string;
  sourceTitle: string;
  provenanceNote?: string | null;
  frameIntervalSeconds?: number;
}): Promise<EvidenceManifest> {
  const sourcePath = path.resolve(input.sourcePath);
  const sourceInfo = await stat(sourcePath);

  if (!sourceInfo.isFile() || sourceInfo.size <= 0) {
    throw new Error("Evidence source is not a valid non-empty file");
  }

  const probe = probeMedia(sourcePath);
  const frameIntervalSeconds = Math.max(
    1,
    Math.min(60, input.frameIntervalSeconds ?? 5),
  );

  const evidenceId = createHash("sha256")
    .update(
      [
        input.sourceUrl,
        input.sourceTitle,
        sourcePath,
        sourceInfo.size,
        probe.durationSeconds,
      ].join("\n"),
    )
    .digest("hex")
    .slice(0, 20);

  const workDir = path.join(MEDIA_ROOT, evidenceId);
  const framesDir = path.join(workDir, "frames");

  await mkdir(framesDir, { recursive: true });

  let audio:
    | EvidenceManifest["audio"]
    | null = null;

  if (probe.audio) {
    const audioPath = path.join(workDir, "audio-16k-mono.wav");

    run(FFMPEG, [
      "-y",
      "-v",
      "error",
      "-i",
      sourcePath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "pcm_s16le",
      audioPath,
    ]);

    audio = {
      path: audioPath,
      codec: "pcm_s16le",
      sampleRate: 16000,
      channels: 1,
      purpose: "TRANSCRIPTION_EVIDENCE",
    };
  }

  const frames: EvidenceFrame[] = [];

  if (probe.video) {
    let index = 0;

    for (
      let timeSeconds = 0;
      timeSeconds < probe.durationSeconds;
      timeSeconds += frameIntervalSeconds
    ) {
      const framePath = path.join(
        framesDir,
        `frame-${String(index).padStart(4, "0")}-${timeSeconds.toFixed(1)}s.png`,
      );

      run(FFMPEG, [
        "-y",
        "-v",
        "error",
        "-ss",
        timeSeconds.toFixed(3),
        "-i",
        sourcePath,
        "-frames:v",
        "1",

        framePath,
      ]);

      // Only materialized, non-empty frame files are observed visual evidence.
      try {
        const frameStat = await stat(framePath);

        if (frameStat.isFile() && frameStat.size > 0) {
          frames.push({
            index,
            timeSeconds,
            path: framePath,
          });

          index += 1;
        }
      } catch {
        // NOT_OBSERVED: missing frame is not evidence.
      }
    }
  }

  const manifest: EvidenceManifest = {
    version: "JOPD_BROADCAST_EVIDENCE_V1",
    evidenceId,
    createdAt: new Date().toISOString(),
    source: {
      sourceUrl: input.sourceUrl,
      sourceTitle: input.sourceTitle,
      sourcePath,
      sourceBytes: sourceInfo.size,
      provenanceNote: input.provenanceNote ?? null,
    },
    probe,
    audio,
    frames,
    acquisition: {
      frameIntervalSeconds,
      rawMediaIsApprovedMemory: false,
      derivedEvidenceRequiresResearch: true,
    },
  };

  await atomicJsonWrite(
    path.join(workDir, "manifest.json"),
    manifest,
  );

  return manifest;
}
