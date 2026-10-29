import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const FFMPEG = "/opt/homebrew/bin/ffmpeg";

export type AudioObservation = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  observed: {
    rmsDb: number | null;
    peakDb: number | null;
    silence: boolean;
  };
};

export type AudioObservationEvidence = {
  version: "JOPD_BROADCAST_AUDIO_OBSERVATION_EVIDENCE_V1";
  audioObservationId: string;
  createdAt: string;
  truthClass: "OBSERVED_EVENT";
  evidenceType: "AUDIO_OBSERVATION";
  source: {
    audioPath: string;
    audioBytes: number;
    durationSeconds: number;
    unitSeconds: number;
  };
  observations: AudioObservation[];
  evidencePolicy: {
    measuresSignalNotMeaning: true;
    doesNotInferMusicGenre: true;
    doesNotInferEmotion: true;
    doesNotInferSfxIdentity: true;
    maySupportSilenceAndLevelChangeClaims: true;
    requiresHigherLevelResearchForCreativeMeaning: true;
  };
};

function finite(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function measureWindow(
  audioPath: string,
  startSeconds: number,
  durationSeconds: number,
): {
  rmsDb: number | null;
  peakDb: number | null;
} {
  const result = spawnSync(
    FFMPEG,
    [
      "-hide_banner",
      "-nostats",
      "-ss",
      startSeconds.toFixed(3),
      "-t",
      durationSeconds.toFixed(3),
      "-i",
      audioPath,
      "-af",
      "astats=metadata=1:reset=0",
      "-f",
      "null",
      "-",
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `ffmpeg astats 실패: ${String(result.stderr ?? "").slice(-2000)}`,
    );
  }

  const text = String(result.stderr ?? "");

  return {
    rmsDb: finite(
      text.match(/RMS level dB:\s*(-?[\d.]+)/)?.[1],
    ),
    peakDb: finite(
      text.match(/Peak level dB:\s*(-?[\d.]+)/)?.[1],
    ),
  };
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

export async function createAudioObservationEvidence(input: {
  audioPath: string;
  outputDir?: string;
  durationSeconds: number;
  unitSeconds?: number;
}): Promise<AudioObservationEvidence> {
  const audioPath = path.resolve(input.audioPath);
  const stat = await fs.stat(audioPath);

  if (!stat.isFile() || stat.size <= 0) {
    throw new Error("Audio Observation 원본 오디오가 비어 있습니다");
  }

  if (
    !Number.isFinite(input.durationSeconds) ||
    input.durationSeconds <= 0
  ) {
    throw new Error("durationSeconds가 잘못됐습니다");
  }

  const unitSeconds = Math.max(
    1,
    Math.min(input.unitSeconds ?? 5, 30),
  );

  const observations: AudioObservation[] = [];

  for (
    let startSeconds = 0, index = 0;
    startSeconds < input.durationSeconds;
    startSeconds += unitSeconds, index += 1
  ) {
    const endSeconds = Math.min(
      startSeconds + unitSeconds,
      input.durationSeconds,
    );

    const measurement = measureWindow(
      audioPath,
      startSeconds,
      endSeconds - startSeconds,
    );

    observations.push({
      index,
      startSeconds,
      endSeconds,
      observed: {
        rmsDb: measurement.rmsDb,
        peakDb: measurement.peakDb,
        silence:
          measurement.rmsDb !== null &&
          measurement.rmsDb <= -50,
      },
    });
  }

  const audioObservationId = createHash("sha256")
    .update(
      JSON.stringify({
        audioPath,
        audioBytes: stat.size,
        durationSeconds: input.durationSeconds,
        unitSeconds,
        observations,
      }),
    )
    .digest("hex")
    .slice(0, 20);

  const result: AudioObservationEvidence = {
    version:
      "JOPD_BROADCAST_AUDIO_OBSERVATION_EVIDENCE_V1",
    audioObservationId,
    createdAt: new Date().toISOString(),
    truthClass: "OBSERVED_EVENT",
    evidenceType: "AUDIO_OBSERVATION",
    source: {
      audioPath,
      audioBytes: stat.size,
      durationSeconds: input.durationSeconds,
      unitSeconds,
    },
    observations,
    evidencePolicy: {
      measuresSignalNotMeaning: true,
      doesNotInferMusicGenre: true,
      doesNotInferEmotion: true,
      doesNotInferSfxIdentity: true,
      maySupportSilenceAndLevelChangeClaims: true,
      requiresHigherLevelResearchForCreativeMeaning: true,
    },
  };

  const outputDir = input.outputDir
    ? path.resolve(input.outputDir)
    : path.dirname(audioPath);

  await fs.mkdir(outputDir, { recursive: true });

  await atomicJsonWrite(
    path.join(
      outputDir,
      "audio-observation-evidence.json",
    ),
    result,
  );

  return result;
}
