import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

export type YouTubePerformanceEvidence = {
  version: "JOPD_YOUTUBE_PERFORMANCE_EVIDENCE_V1";
  evidenceId: string;
  evidenceType: "YOUTUBE_PERFORMANCE";
  truthClass: "OBSERVED_PLATFORM_METADATA";
  sourceUrl: string;
  observedAt: string;
  platform: "YOUTUBE";
  video: {
    id: string | null;
    title: string | null;
    canonicalUrl: string | null;
    channel: string | null;
    channelId: string | null;
    uploader: string | null;
    uploadDate: string | null;
    timestamp: number | null;
    durationSeconds: number | null;
  };
  performance: {
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
  };
  evidencePolicy: {
    platformMetadataOnly: true;
    missingValuesAreUnknown: true;
    performanceDoesNotProveCreativeCausality: true;
    requiresResearchForWhyItWorked: true;
  };
};

type RawMetadata = Record<string, unknown>;

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
}

function normalizeUploadDate(value: unknown): string | null {
  const raw = stringOrNull(value);
  if (!raw || !/^\d{8}$/.test(raw)) return raw;

  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function metadataFor(url: string): RawMetadata {
  const output = execFileSync(
    "/opt/homebrew/bin/yt-dlp",
    [
      "--no-update",
      "--skip-download",
      "--no-playlist",
      "--dump-single-json",
      url,
    ],
    {
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 8 * 1024 * 1024,
    }
  );

  const parsed = JSON.parse(output) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("YouTube metadata 응답이 객체가 아닙니다.");
  }

  return parsed as RawMetadata;
}

export function acquireYouTubePerformanceEvidence(
  sourceUrl: string
): YouTubePerformanceEvidence {
  const url = sourceUrl.trim();

  if (!url) {
    throw new Error("sourceUrl이 필요합니다.");
  }

  const raw = metadataFor(url);
  const observedAt = new Date().toISOString();

  const id = stringOrNull(raw.id);
  const canonicalUrl =
    stringOrNull(raw.webpage_url) ||
    (id ? `https://www.youtube.com/watch?v=${id}` : null);

  const evidenceId = `youtube-performance-${createHash("sha256")
    .update(`${canonicalUrl || url}|${observedAt}`)
    .digest("hex")
    .slice(0, 16)}`;

  return {
    version: "JOPD_YOUTUBE_PERFORMANCE_EVIDENCE_V1",
    evidenceId,
    evidenceType: "YOUTUBE_PERFORMANCE",
    truthClass: "OBSERVED_PLATFORM_METADATA",
    sourceUrl: url,
    observedAt,
    platform: "YOUTUBE",
    video: {
      id,
      title: stringOrNull(raw.title),
      canonicalUrl,
      channel: stringOrNull(raw.channel),
      channelId: stringOrNull(raw.channel_id),
      uploader: stringOrNull(raw.uploader),
      uploadDate: normalizeUploadDate(raw.upload_date),
      timestamp: numberOrNull(raw.timestamp),
      durationSeconds: numberOrNull(raw.duration),
    },
    performance: {
      viewCount: numberOrNull(raw.view_count),
      likeCount: numberOrNull(raw.like_count),
      commentCount: numberOrNull(raw.comment_count),
    },
    evidencePolicy: {
      platformMetadataOnly: true,
      missingValuesAreUnknown: true,
      performanceDoesNotProveCreativeCausality: true,
      requiresResearchForWhyItWorked: true,
    },
  };
}


export type YouTubePerformanceDeepResearchEvidence = {
  sourceUrl: string;
  sourceTitle: string;
  workTitle: string;
  episodeTitle: null;
  genre: string[];
  evidenceType: "YOUTUBE_PERFORMANCE";
  content: string;
  startMs: null;
  endMs: null;
  provenanceNote: string;
};

export function toDeepResearchEvidence(
  evidence: YouTubePerformanceEvidence
): YouTubePerformanceDeepResearchEvidence {
  const title =
    evidence.video.title ||
    evidence.sourceUrl;

  const observed = [
    `PLATFORM=${evidence.platform}`,
    `OBSERVED_AT=${evidence.observedAt}`,
    `VIDEO_ID=${evidence.video.id ?? "UNKNOWN"}`,
    `TITLE=${evidence.video.title ?? "UNKNOWN"}`,
    `CHANNEL=${evidence.video.channel ?? "UNKNOWN"}`,
    `CHANNEL_ID=${evidence.video.channelId ?? "UNKNOWN"}`,
    `UPLOADER=${evidence.video.uploader ?? "UNKNOWN"}`,
    `UPLOAD_DATE=${evidence.video.uploadDate ?? "UNKNOWN"}`,
    `DURATION_SECONDS=${evidence.video.durationSeconds ?? "UNKNOWN"}`,
    `VIEW_COUNT=${evidence.performance.viewCount ?? "UNKNOWN"}`,
    `LIKE_COUNT=${evidence.performance.likeCount ?? "UNKNOWN"}`,
    `COMMENT_COUNT=${evidence.performance.commentCount ?? "UNKNOWN"}`,
    "",
    "EVIDENCE INTERPRETATION BOUNDARY:",
    "These values are observed platform metadata.",
    "Performance numbers do not by themselves prove why the work succeeded.",
    "Any causal explanation of performance requires supporting content evidence and research.",
  ].join("\n");

  return {
    sourceUrl:
      evidence.video.canonicalUrl ||
      evidence.sourceUrl,
    sourceTitle: title,
    workTitle: title,
    episodeTitle: null,
    genre: [],
    evidenceType: "YOUTUBE_PERFORMANCE",
    content: observed,
    startMs: null,
    endMs: null,
    provenanceNote:
      `YouTube platform metadata observed at ${evidence.observedAt}`,
  };
}
