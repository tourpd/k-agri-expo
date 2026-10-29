import { execFileSync } from "child_process";

import {
  enqueueBroadcastDiscovery,
  type HunterQueueItem,
} from "./queue";

export type YouTubeDiscoveryRequest = {
  sourceRegistryId: string;
  channelUrl: string;
  domain: string;
  platform?: string;
  includeKeywords?: string[];
  maxItems?: number;
};

export type YouTubeDiscoveryResult = {
  scanned: number;
  matched: number;
  inserted: number;
  duplicates: number;
  items: Array<{
    inserted: boolean;
    item: HunterQueueItem;
  }>;
};

type FlatVideo = {
  id: string;
  title: string;
  url: string;
};

function discoverFlatVideos(
  channelUrl: string,
  maxItems: number
): FlatVideo[] {
  const output = execFileSync(
    "/opt/homebrew/bin/yt-dlp",
    [
      "--no-update",
      "--flat-playlist",
      "--playlist-end",
      String(maxItems),
      "--skip-download",
      "--print",
      "%(id)s\t%(title)s\t%(url)s",
      channelUrl,
    ],
    {
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 4 * 1024 * 1024,
    }
  );

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, title, ...urlParts] =
        line.split("\t");

      return {
        id: (id || "").trim(),
        title: (title || "").trim(),
        url: urlParts.join("\t").trim(),
      };
    })
    .filter(
      (item) =>
        item.id &&
        item.title &&
        /^https?:\/\//.test(item.url)
    );
}

function matchesKeywords(
  title: string,
  keywords: string[]
): boolean {
  if (!keywords.length) return true;

  const normalized = title.toLowerCase();

  return keywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );
}

export function discoverYouTubeSource(
  request: YouTubeDiscoveryRequest
): YouTubeDiscoveryResult {
  const maxItems = Math.max(
    1,
    Math.min(request.maxItems ?? 30, 100)
  );

  const keywords = (request.includeKeywords || [])
    .map((item) => item.trim())
    .filter(Boolean);

  const videos = discoverFlatVideos(
    request.channelUrl,
    maxItems
  );

  const matched = videos.filter((video) =>
    matchesKeywords(video.title, keywords)
  );

  const items = matched.map((video) =>
    enqueueBroadcastDiscovery({
      sourceRegistryId: request.sourceRegistryId,
      title: video.title,
      url: video.url,
      platform: request.platform || "YOUTUBE",
      domain: request.domain,
      discoveredBy: "JOPD_BROADCAST_HUNTER_YOUTUBE",
      discoveryReason:
        keywords.length > 0
          ? `공식 채널 자동발견 / 키워드: ${keywords.join(", ")}`
          : "공식 채널 자동발견",
    })
  );

  return {
    scanned: videos.length,
    matched: matched.length,
    inserted: items.filter((item) => item.inserted)
      .length,
    duplicates: items.filter((item) => !item.inserted)
      .length,
    items,
  };
}
