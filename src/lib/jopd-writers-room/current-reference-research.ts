import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  acquireBroadcastEvidence,
} from "@/lib/jopd-broadcast-hunter/evidence-acquisition";

import {
  createTranscriptionEvidence,
} from "@/lib/jopd-broadcast-hunter/transcription-evidence";

import {
  createVisualEvidence,
} from "@/lib/jopd-broadcast-hunter/visual-evidence";

import {
  createMultimodalEvidence,
} from "@/lib/jopd-broadcast-hunter/multimodal-evidence";

import {
  createAudioObservationEvidence,
} from "@/lib/jopd-broadcast-hunter/audio-observation-evidence";

import {
  multimodalFileToResearchContent,
} from "@/lib/jopd-broadcast-hunter/multimodal-to-research";

import {
  runDeepBroadcastResearch,
  type DeepResearchEvidence,
  type DeepResearchResult,
} from "@/lib/jopd-broadcast-hunter/deep-research";

import {
  acquireYouTubePerformanceEvidence,
  toDeepResearchEvidence,
} from "@/lib/jopd-broadcast-hunter/youtube-performance-evidence";

export type CurrentResearchReference = {
  title: string;
  url: string;
};

export type CurrentReferenceResearchResult = {
  version: "JOPD_CURRENT_REFERENCE_RESEARCH_V1";
  sourceUrl: string;
  sourceTitle: string;
  cacheKey: string;
  cacheHit: boolean;
  research: DeepResearchResult;
};

const ROOT = path.join(
  process.cwd(),
  "jopd-studio",
  "broadcast-dna",
  "current-research",
);

function keyFor(url: string): string {
  return createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 20);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadReference(
  url: string,
  workDir: string,
): string {
  ensureDir(workDir);

  /*
   * 연구용 임시 소스.
   * 승인 Memory가 아니며 공개 자산도 아니다.
   * 재인코딩 부담을 줄이기 위해 mp4 호환 포맷을 우선한다.
   */
  const template = path.join(
    workDir,
    "source.%(ext)s",
  );

  execFileSync(
    "/opt/homebrew/bin/yt-dlp",
    [
      "--no-update",
      "--no-playlist",
      "-f",
      "bv*[height<=720]+ba/b[height<=720]/b",
      "--merge-output-format",
      "mp4",
      "-o",
      template,
      url,
    ],
    {
      stdio: "pipe",
      timeout: 180_000,
      maxBuffer: 32 * 1024 * 1024,
    },
  );

  const candidates = fs
    .readdirSync(workDir)
    .filter((name) =>
      /^source\./.test(name)
    )
    .map((name) =>
      path.join(workDir, name)
    )
    .filter((file) =>
      fs.statSync(file).isFile()
    );

  if (!candidates.length) {
    throw new Error(
      "YouTube research source download produced no file",
    );
  }

  return candidates[0];
}

function prepareTranscriptionAudio(
  audioPath: string,
  workDir: string,
): string {
  const stat = fs.statSync(audioPath);

  /*
   * OpenAI transcription request has a hard payload ceiling.
   * Keep the original PCM evidence untouched.
   * Only create a smaller derivative for transcription when needed.
   */
  const safeLimitBytes = 24 * 1024 * 1024;

  if (stat.size <= safeLimitBytes) {
    return audioPath;
  }

  const compressedPath = path.join(
    workDir,
    "audio-for-transcription.mp3",
  );

  if (
    fs.existsSync(compressedPath) &&
    fs.statSync(compressedPath).size > 0
  ) {
    return compressedPath;
  }

  execFileSync(
    "/opt/homebrew/bin/ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      audioPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "48k",
      compressedPath,
    ],
    {
      stdio: "pipe",
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );

  const compressedStat =
    fs.statSync(compressedPath);

  if (
    !compressedStat.isFile() ||
    compressedStat.size <= 0
  ) {
    throw new Error(
      "Transcription derivative audio was not created",
    );
  }

  if (compressedStat.size > safeLimitBytes) {
    throw new Error(
      `Transcription derivative still too large: ${compressedStat.size}`,
    );
  }

  return compressedPath;
}

function formatResearchQuestion(
  title: string,
): string {
  return `
이 작품 "${title}"을 요약하지 말고 방송 창작 구조로 해부하라.

실제 제공된 Evidence만 사용한다.

특히 다음을 연구한다.

1. 첫 훅 이전과 이후에 실제로 무엇이 달라지는가.
2. 어떤 정보 공백 또는 질문이 다음 장면을 보게 만드는가.
3. 사람, 행동, 대사, 화면, 공간이 어떤 순서로 결합되는가.
4. 강한 순간마다 BEFORE → SETUP → EXPECTATION → ESCALATION → TRIGGER → REACTION → AFTER를 복원한다.
5. PRIMARY_CAUSE, NECESSARY_CONDITION, AMPLIFIER, DECORATION을 구분한다.
6. 단순히 "재미있다", "감동적이다", "반전이다"라고 설명하지 않는다.
7. 제거했을 때 구조가 약해지는 요소를 반사실적으로 검토한다.
8. 다른 작품에 재사용 가능한 DNA를 장면 복제가 아닌 추상 원리로 추출한다.
9. 이 DNA가 자동차 대리점, 로컬 비즈니스, 사람 중심 브랜디드 콘텐츠에 어떻게 변형될 수 있는지 원리 수준에서 제시한다.
10. Performance Evidence는 실제 관측 성과일 뿐 성공 원인의 증거로 사용하지 않는다.
11. Evidence가 부족한 판단은 INSUFFICIENT_EVIDENCE로 남긴다.
`.trim();
}

export async function researchCurrentReference(
  reference: CurrentResearchReference,
): Promise<CurrentReferenceResearchResult> {
  const cacheKey = keyFor(reference.url);
  const workDir = path.join(ROOT, cacheKey);
  const cacheFile = path.join(
    workDir,
    "current-reference-research.json",
  );

  ensureDir(workDir);

  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(
      fs.readFileSync(cacheFile, "utf8"),
    ) as CurrentReferenceResearchResult;

    return {
      ...cached,
      cacheHit: true,
    };
  }

  const sourcePath = downloadReference(
    reference.url,
    workDir,
  );

  const manifest =
    await acquireBroadcastEvidence({
      sourcePath,
      sourceUrl: reference.url,
      sourceTitle: reference.title,
      provenanceNote:
        "CURRENT_REFERENCE_EPHEMERAL_RESEARCH",
      /*
       * 현재 요청용 연구는 비용/속도를 위해 10초.
       * 승인용 정밀 연구와 동일하다고 주장하지 않는다.
       */
      frameIntervalSeconds: 10,
    });

  if (!manifest.audio) {
    throw new Error(
      "Reference contains no researchable audio",
    );
  }

  const evidenceDir = path.dirname(
    manifest.audio.path,
  );

  const transcriptionAudioPath =
    prepareTranscriptionAudio(
      manifest.audio.path,
      evidenceDir,
    );

  await createTranscriptionEvidence({
    audioPath: transcriptionAudioPath,
    outputDir: evidenceDir,
  });

  await createVisualEvidence({
    frames: manifest.frames.map(
      (frame) => ({
        index: frame.index,
        timeSeconds: frame.timeSeconds,
        imagePath: frame.path,
      }),
    ),
    outputDir: evidenceDir,
    batchSize: 5,
  });

  await createMultimodalEvidence({
    transcriptionPath: path.join(
      evidenceDir,
      "transcription-evidence.json",
    ),
    visualEvidencePath: path.join(
      evidenceDir,
      "visual-evidence.json",
    ),
    outputDir: evidenceDir,
    durationSeconds:
      manifest.probe.durationSeconds,
    unitSeconds: 10,
  });

  await createAudioObservationEvidence({
    audioPath: manifest.audio.path,
    outputDir: evidenceDir,
    durationSeconds:
      manifest.probe.durationSeconds,
    unitSeconds: 10,
  });

  const multimodal =
    multimodalFileToResearchContent(
      path.join(
        evidenceDir,
        "multimodal-evidence.json",
      ),
    );

  const multimodalEvidence:
    DeepResearchEvidence = {
      sourceUrl: reference.url,
      sourceTitle: reference.title,
      workTitle: reference.title,
      episodeTitle: null,
      genre: [],
      evidenceType: "MULTIMODAL",
      content: multimodal.content,
      startMs: multimodal.startMs,
      endMs: multimodal.endMs,
      provenanceNote:
        multimodal.provenanceNote,
    };

  const audioObservationRaw =
    JSON.parse(
      fs.readFileSync(
        path.join(
          evidenceDir,
          "audio-observation-evidence.json",
        ),
        "utf8",
      ),
    );

  const audioObservationEvidence:
    DeepResearchEvidence = {
      sourceUrl: reference.url,
      sourceTitle: reference.title,
      workTitle: reference.title,
      episodeTitle: null,
      genre: [],
      evidenceType: "AUDIO_OBSERVATION",
      content: JSON.stringify(
        audioObservationRaw,
      ),
      startMs: 0,
      endMs: Math.round(
        manifest.probe.durationSeconds * 1000,
      ),
      provenanceNote:
        "OBSERVED_AUDIO_SIGNAL; NOT_MUSIC_IDENTIFICATION; NOT_SFX_IDENTIFICATION",
    };

  const performance =
    acquireYouTubePerformanceEvidence(
      reference.url,
    );

  const performanceEvidence =
    toDeepResearchEvidence(performance);

  const research =
    await runDeepBroadcastResearch({
      evidence: [
        multimodalEvidence,
        audioObservationEvidence,
        performanceEvidence,
      ],
      researchQuestion:
        formatResearchQuestion(
          reference.title,
        ),
    });

  const result:
    CurrentReferenceResearchResult = {
      version:
        "JOPD_CURRENT_REFERENCE_RESEARCH_V1",
      sourceUrl: reference.url,
      sourceTitle: reference.title,
      cacheKey,
      cacheHit: false,
      research,
    };

  fs.writeFileSync(
    cacheFile,
    JSON.stringify(result, null, 2),
    "utf8",
  );

  return result;
}

export function formatCurrentReferenceResearch(
  items: CurrentReferenceResearchResult[],
): string {
  if (!items.length) {
    return [
      "CURRENT DEEP REFERENCE RESEARCH",
      "NO DEEP REFERENCE RESEARCH AVAILABLE.",
      "Do not pretend reference content was studied.",
    ].join("\n");
  }

  return [
    "CURRENT DEEP REFERENCE RESEARCH",
    "",
    "The following material comes from actual content evidence and Deep Research.",
    "Use reusable mechanisms, causal structure and failure conditions.",
    "Do NOT copy scenes, dialogue, characters or surface gimmicks.",
    "",
    ...items.map((item, index) => {
      const analysis =
        item.research.analysis;

      return [
        `===== STUDIED REFERENCE ${index + 1} =====`,
        `TITLE: ${item.sourceTitle}`,
        `URL: ${item.sourceUrl}`,
        `CACHE_HIT: ${item.cacheHit}`,
        `RESEARCH_ID: ${item.research.researchId}`,
        "",
        JSON.stringify(
          analysis,
          null,
          2,
        ),
      ].join("\n");
    }),
  ].join("\n\n");
}
