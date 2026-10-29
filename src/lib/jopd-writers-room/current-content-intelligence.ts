import { execFileSync } from "node:child_process";

import {
  acquireYouTubePerformanceEvidence,
} from "@/lib/jopd-broadcast-hunter/youtube-performance-evidence";

export type CurrentReference = {
  title: string;
  url: string;
  channel: string | null;
  uploadDate: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  discoveredByQuery: string;
};

export type CurrentContentIntelligence = {
  version: "JOPD_CURRENT_CONTENT_INTELLIGENCE_V2";
  mission: string;
  observedAt: string;
  searchQueries: string[];
  references: CurrentReference[];
  acquisitionStatus:
    | "EVIDENCE_ACQUIRED"
    | "NO_REFERENCE_EVIDENCE";
};

type SearchItem = {
  id?: string;
  title?: string;
};

function compactMission(mission: string): string {
  return mission
    .replace(
      /아이디어|만들어줘|만들어|가장|핫하고|재미있는|새로운|방식으로|기존|유튜브에|있는|말고|어떻게|하면|좋을지|홍보해야|한다/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function buildReferenceSearchQueries(
  mission: string
): string[] {
  const core = compactMission(mission) || mission.trim();

  /*
   * 한 문장을 그대로 검색하지 않는다.
   *
   * 1) target reality
   * 2) Korean format/reference
   * 3) global reference
   * 4) entertainment/experiment grammar
   * 5) local-business cross-industry grammar
   *
   * 서로 다른 세계에서 창작재료를 찾는다.
   */
  const queries = [
    core,
    `${core} 광고 캠페인`,
    `${core} 예능 콘텐츠`,
    `${core} 실험 미션`,
    `${core} shorts`,
    `자동차 딜러 광고 creative campaign`,
    `car dealership creative marketing`,
    `car dealer funny commercial`,
    `car dealership social experiment`,
    `local business creative marketing campaign`,
    `retail store social experiment advertising`,
    `brand entertainment campaign`,
    `자동차 광고 예능`,
    `자동차 브랜드 콘텐츠`,
    `자동차 영업사원 예능`,
    `자동차 대리점 유튜브`,
    `car dealership advertising`,
    `car dealership youtube`,
    `automotive branded entertainment`,
    `automotive social experiment`,
    `funny automotive campaign`,
  ];

  return [...new Set(
    queries
      .map((q) => q.replace(/\s+/g, " ").trim())
      .filter(Boolean)
  )];
}

function searchYouTube(
  query: string,
  limit: number
): SearchItem[] {
  try {
    const output = execFileSync(
      "/opt/homebrew/bin/yt-dlp",
      [
        "--no-update",
        "--flat-playlist",
        "--skip-download",
        "--dump-single-json",
        `ytsearch${limit}:${query}`,
      ],
      {
        encoding: "utf8",
        timeout: 45_000,
        maxBuffer: 16 * 1024 * 1024,
      }
    );

    const parsed = JSON.parse(output) as {
      entries?: SearchItem[];
    };

    return Array.isArray(parsed.entries)
      ? parsed.entries
      : [];
  } catch {
    return [];
  }
}

function performanceValue(
  item: CurrentReference
): number {
  /*
   * 이것은 "좋은 작품 점수"가 아니다.
   * Writer에게 공급할 reference pool을 제한하기 위한
   * 단순 관측 성과 정렬값이다.
   */
  return item.viewCount ?? -1;
}

export function researchCurrentYouTube(
  mission: string,
  perQuery = 3,
  maxReferences = 12
): CurrentContentIntelligence {
  const searchQueries =
    buildReferenceSearchQueries(mission);

  const references: CurrentReference[] = [];
  const seen = new Set<string>();

  /*
   * 너무 많은 yt-dlp metadata call을 막기 위해
   * 검색 후보를 먼저 모으고 URL을 dedupe한다.
   */
  const candidates: Array<{
    id: string;
    title: string | null;
    query: string;
  }> = [];

  for (const query of searchQueries) {
    const items = searchYouTube(query, perQuery);

    for (const item of items) {
      const id =
        typeof item.id === "string"
          ? item.id.trim()
          : "";

      if (!id || seen.has(id)) continue;

      seen.add(id);

      candidates.push({
        id,
        title:
          typeof item.title === "string"
            ? item.title
            : null,
        query,
      });

      /*
       * metadata 상세조회 폭주 방지.
       * 다양한 query에서 최대 18개 후보까지만 관측한다.
       */
      if (candidates.length >= 18) break;
    }

    if (candidates.length >= 18) break;
  }

  for (const candidate of candidates) {
    const url =
      `https://www.youtube.com/watch?v=${candidate.id}`;

    try {
      const evidence =
        acquireYouTubePerformanceEvidence(url);

      references.push({
        title:
          evidence.video.title ||
          candidate.title ||
          url,
        url:
          evidence.video.canonicalUrl ||
          url,
        channel:
          evidence.video.channel,
        uploadDate:
          evidence.video.uploadDate,
        durationSeconds:
          evidence.video.durationSeconds,
        viewCount:
          evidence.performance.viewCount,
        likeCount:
          evidence.performance.likeCount,
        commentCount:
          evidence.performance.commentCount,
        discoveredByQuery:
          candidate.query,
      });
    } catch {
      /*
       * 개별 영상 metadata 실패가
       * 전체 작가실을 죽이지 않는다.
       */
    }
  }

  references.sort(
    (a, b) =>
      performanceValue(b) -
      performanceValue(a)
  );

  const selected =
    references.slice(0, maxReferences);

  return {
    version:
      "JOPD_CURRENT_CONTENT_INTELLIGENCE_V2",
    mission,
    observedAt: new Date().toISOString(),
    searchQueries,
    references: selected,
    acquisitionStatus:
      selected.length > 0
        ? "EVIDENCE_ACQUIRED"
        : "NO_REFERENCE_EVIDENCE",
  };
}

function n(value: number | null): string {
  return value === null
    ? "UNKNOWN"
    : String(value);
}

export function formatCurrentContentIntelligence(
  intelligence: CurrentContentIntelligence
): string {
  const header = [
    "CURRENT WORLD / REFERENCE INTELLIGENCE",
    `VERSION: ${intelligence.version}`,
    `MISSION: ${intelligence.mission}`,
    `OBSERVED_AT: ${intelligence.observedAt}`,
    `STATUS: ${intelligence.acquisitionStatus}`,
    "",
    "SEARCH AXES:",
    ...intelligence.searchQueries.map(
      (q, i) => `${i + 1}. ${q}`
    ),
  ];

  if (!intelligence.references.length) {
    return [
      ...header,
      "",
      "NO CURRENT REFERENCE EVIDENCE WAS ACQUIRED.",
      "Do not pretend current references or performance were observed.",
      "This does NOT prohibit creative generation.",
      "Unknown reality must remain unknown rather than invented.",
    ].join("\n");
  }

  const rows = intelligence.references.map(
    (item, index) =>
      [
        `REFERENCE ${index + 1}`,
        `TITLE: ${item.title}`,
        `URL: ${item.url}`,
        `CHANNEL: ${item.channel ?? "UNKNOWN"}`,
        `UPLOAD_DATE: ${item.uploadDate ?? "UNKNOWN"}`,
        `DURATION_SECONDS: ${n(item.durationSeconds)}`,
        `VIEW_COUNT: ${n(item.viewCount)}`,
        `LIKE_COUNT: ${n(item.likeCount)}`,
        `COMMENT_COUNT: ${n(item.commentCount)}`,
        `DISCOVERED_BY_QUERY: ${item.discoveredByQuery}`,
      ].join("\n")
  );

  return [
    ...header,
    "",
    "EVIDENCE POLICY:",
    "- These are observed YouTube platform metadata.",
    "- High view count does NOT prove why a video succeeded.",
    "- Do not claim to have watched or analyzed content unless content evidence exists.",
    "- References are creative research material, not templates to copy.",
    "- Use references to widen the creative search space.",
    "- If target-specific facts are unknown, mark them as facts to verify.",
    "- Unknown target reality does NOT automatically stop ideation.",
    "",
    ...rows,
  ].join("\n\n");
}
