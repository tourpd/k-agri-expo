import { makeEntityRef, makeSourceRef } from "../identity";
import type { KagriAdapterRecord } from "../types";
import type {
  KagriProvenance,
  KagriProvenanceType,
} from "../provenance";

export type KagriKnowledgePage = {
  knowledgeId: string;
  jobId: string | null;
  sourceTitle: string | null;
  fileType: string | null;
  pageNumber: number | null;

  rawText: string | null;

  crop: string | null;
  monthText: string | null;
  growthStage: string | null;
  topic: string | null;
  diseaseName: string | null;
  symptom: string | null;
  cause: string | null;
  countermeasure: string | null;
  actionInstruction: string | null;

  status: string | null;
  provenance: KagriProvenance;
};

export type KagriUnifiedKnowledgeAsset = {
  assetId: string;
  sourceType: string | null;
  sourceName: string | null;
  sourceId: string | null;
  sourcePage: number | null;

  crop: string | null;
  monthText: string | null;
  growthStage: string | null;

  assetType: string | null;
  assetTitle: string | null;
  assetSummary: string | null;

  assetUrl: string | null;
  originalUrl: string | null;

  provenance: KagriProvenance;
};

export type KagriFarmCalendarAction = {
  actionId: string;
  sourcePageId: string | null;
  sourceType: string | null;
  crop: string | null;
  monthNo: number | null;
  growthStage: string | null;
  problemTitle: string | null;
  actionInstruction: string | null;
  recommendedMaterials: string[];
  importanceScore: number | null;
};

export type KagriContentCandidate = {
  candidateId: string;
  sourcePageId: string | null;
  sourceActionId: string | null;
  crop: string | null;
  monthNo: number | null;
  actionInstruction: string | null;
  videoTitle: string | null;
  videoOutline: string | null;
  shortsTitle: string | null;
  shortsScript: string | null;
  priorityScore: number | null;
};

export type KagriWriterRecommendation = {
  recommendationId: string;
  sourceJobId: string | null;
  sourcePageId: string | null;
  sourcePageNumber: number | null;
  title: string | null;
  contentType: string | null;
  reason: string | null;
  score: number | null;
  status: string | null;
};

export type KagriYoutubeAsset = {
  contentId: string;
  channelName: string | null;
  videoUrl: string | null;
  title: string | null;
  crop: string | null;
  productNames: string | null;
  expertNames: string | null;
  transcript: string | null;
  summary: string | null;
  status: string | null;
};

export type KagriYoutubeContentAsset = {
  contentId: string;
  youtubeVideoId: string | null;
  title: string | null;
  videoUrl: string | null;
  channelTitle: string | null;
  publishedAt: string | null;
  crop: string | null;
  topic: string | null;
  expertName: string | null;
  sourceType: string | null;
  assetStatus: string | null;
};

export type KagriExpoContentLink = {
  contentId: string;
  boothId: string | null;
  title: string | null;
  url: string | null;
  status: string | null;
};

type KnowledgePageRow = {
  id: string;
  job_id?: string | null;
  source_title?: string | null;
  file_type?: string | null;
  page_number?: number | null;
  raw_text?: string | null;
  crop?: string | null;
  month_text?: string | null;
  growth_stage?: string | null;
  topic?: string | null;
  disease_name?: string | null;
  symptom?: string | null;
  cause?: string | null;
  countermeasure?: string | null;
  action_instruction?: string | null;
  status?: string | null;
};

type UnifiedKnowledgeRow = {
  id: string;
  source_type?: string | null;
  source_name?: string | null;
  source_id?: string | null;
  source_page?: number | null;
  crop?: string | null;
  month_text?: string | null;
  growth_stage?: string | null;
  asset_type?: string | null;
  asset_title?: string | null;
  asset_summary?: string | null;
  asset_url?: string | null;
  original_url?: string | null;
};

type FarmCalendarActionRow = {
  id: string;
  source_page_id?: string | null;
  source_type?: string | null;
  crop?: string | null;
  month_no?: number | null;
  growth_stage?: string | null;
  problem_title?: string | null;
  action_instruction?: string | null;
  recommended_materials?: string[] | null;
  importance_score?: number | null;
};

type ContentMaterialRow = {
  id: string;
  source_page_id?: string | null;
  source_action_id?: string | null;
  crop?: string | null;
  month_no?: number | null;
  action_instruction?: string | null;
  video_title?: string | null;
  video_outline?: string | null;
  shorts_title?: string | null;
  shorts_script?: string | null;
  priority_score?: number | null;
};

type WriterRecommendationRow = {
  id: string;
  source_job_id?: string | null;
  source_page_id?: string | null;
  source_page_number?: number | null;
  title?: string | null;
  content_type?: string | null;
  reason?: string | null;
  score?: number | null;
  status?: string | null;
};

type YoutubeAssetRow = {
  id: string;
  channel_name?: string | null;
  video_url?: string | null;
  title?: string | null;
  crop?: string | null;
  product_names?: string | null;
  expert_names?: string | null;
  transcript?: string | null;
  summary?: string | null;
  status?: string | null;
};

type YoutubeContentAssetRow = {
  id: string;
  youtube_video_id?: string | null;
  title?: string | null;
  video_url?: string | null;
  channel_title?: string | null;
  published_at?: string | null;
  crop?: string | null;
  topic?: string | null;
  expert_name?: string | null;
  source_type?: string | null;
  asset_status?: string | null;
};

type ContentLinkRow = {
  content_id: string;
  booth_id?: string | null;
  title?: string | null;
  url?: string | null;
  status?: string | null;
};

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

function requiredId(value: unknown, label: string): string {
  const id = cleanId(value);

  if (!id) {
    throw new Error(
      `K-AGRI Knowledge/Content adapter: ${label}가 없습니다.`,
    );
  }

  return id;
}

function knowledgeProvenanceType(
  sourceType: string | null | undefined,
): KagriProvenanceType {
  const value = (sourceType ?? "").toLowerCase();

  if (
    value.includes("농진청") ||
    value.includes("rda") ||
    value.includes("official")
  ) {
    return "OFFICIAL_SOURCE";
  }

  if (
    value.includes("expert") ||
    value.includes("전문가") ||
    value.includes("안이영")
  ) {
    return "EXPERT_SOURCE";
  }

  if (
    value.includes("youtube") ||
    value.includes("koaftv") ||
    value.includes("한국농수산")
  ) {
    return "JOPD_ARCHIVE";
  }

  return "AI_INFERENCE";
}

export function adaptKnowledgePage(
  row: KnowledgePageRow,
): KagriAdapterRecord<KagriKnowledgePage> {
  const knowledgeId = requiredId(
    row.id,
    "knowledge_page_index.id",
  );

  const source = makeSourceRef(
    "knowledge",
    "knowledge_page_index",
    knowledgeId,
  );

  return {
    entity: makeEntityRef(
      "KNOWLEDGE",
      source,
      knowledgeId,
    ),

    data: {
      knowledgeId,
      jobId: cleanId(row.job_id),
      sourceTitle: row.source_title ?? null,
      fileType: row.file_type ?? null,
      pageNumber: row.page_number ?? null,

      rawText: row.raw_text ?? null,

      crop: row.crop ?? null,
      monthText: row.month_text ?? null,
      growthStage: row.growth_stage ?? null,
      topic: row.topic ?? null,
      diseaseName: row.disease_name ?? null,
      symptom: row.symptom ?? null,
      cause: row.cause ?? null,
      countermeasure: row.countermeasure ?? null,
      actionInstruction: row.action_instruction ?? null,

      status: row.status ?? null,

      provenance: {
        type: "AI_INFERENCE",
        source,
        verificationStatus: "CANDIDATE",
      },
    },
  };
}

export function adaptUnifiedKnowledgeAsset(
  row: UnifiedKnowledgeRow,
): KagriAdapterRecord<KagriUnifiedKnowledgeAsset> {
  const assetId = requiredId(
    row.id,
    "knowledge_assets_unified.id",
  );

  const source = makeSourceRef(
    "knowledge",
    "knowledge_assets_unified",
    assetId,
  );

  return {
    entity: makeEntityRef(
      "KNOWLEDGE",
      source,
    ),

    data: {
      assetId,
      sourceType: row.source_type ?? null,
      sourceName: row.source_name ?? null,
      sourceId: cleanId(row.source_id),
      sourcePage: row.source_page ?? null,

      crop: row.crop ?? null,
      monthText: row.month_text ?? null,
      growthStage: row.growth_stage ?? null,

      assetType: row.asset_type ?? null,
      assetTitle: row.asset_title ?? null,
      assetSummary: row.asset_summary ?? null,

      assetUrl: row.asset_url ?? null,
      originalUrl: row.original_url ?? null,

      provenance: {
        type: knowledgeProvenanceType(row.source_type),
        source,
        verificationStatus: "CANDIDATE",
      },
    },
  };
}

export function adaptFarmCalendarAction(
  row: FarmCalendarActionRow,
): KagriFarmCalendarAction {
  return {
    actionId: requiredId(
      row.id,
      "farm_calendar_actions.id",
    ),
    sourcePageId: cleanId(row.source_page_id),
    sourceType: row.source_type ?? null,
    crop: row.crop ?? null,
    monthNo: row.month_no ?? null,
    growthStage: row.growth_stage ?? null,
    problemTitle: row.problem_title ?? null,
    actionInstruction: row.action_instruction ?? null,
    recommendedMaterials: row.recommended_materials ?? [],
    importanceScore: row.importance_score ?? null,
  };
}

export function adaptContentMaterial(
  row: ContentMaterialRow,
): KagriContentCandidate {
  return {
    candidateId: requiredId(
      row.id,
      "ai_content_materials.id",
    ),
    sourcePageId: cleanId(row.source_page_id),
    sourceActionId: cleanId(row.source_action_id),
    crop: row.crop ?? null,
    monthNo: row.month_no ?? null,
    actionInstruction: row.action_instruction ?? null,
    videoTitle: row.video_title ?? null,
    videoOutline: row.video_outline ?? null,
    shortsTitle: row.shorts_title ?? null,
    shortsScript: row.shorts_script ?? null,
    priorityScore: row.priority_score ?? null,
  };
}

export function adaptWriterRecommendation(
  row: WriterRecommendationRow,
): KagriWriterRecommendation {
  return {
    recommendationId: requiredId(
      row.id,
      "writers_room_recommendations.id",
    ),
    sourceJobId: cleanId(row.source_job_id),
    sourcePageId: cleanId(row.source_page_id),
    sourcePageNumber: row.source_page_number ?? null,
    title: row.title ?? null,
    contentType: row.content_type ?? null,
    reason: row.reason ?? null,
    score: row.score ?? null,
    status: row.status ?? null,
  };
}

export function adaptYoutubeAsset(
  row: YoutubeAssetRow,
): KagriAdapterRecord<KagriYoutubeAsset> {
  const contentId = requiredId(row.id, "youtube_assets.id");

  const source = makeSourceRef(
    "legacy",
    "youtube_assets",
    contentId,
  );

  return {
    entity: makeEntityRef(
      "CONTENT",
      source,
    ),
    data: {
      contentId,
      channelName: row.channel_name ?? null,
      videoUrl: row.video_url ?? null,
      title: row.title ?? null,
      crop: row.crop ?? null,
      productNames: row.product_names ?? null,
      expertNames: row.expert_names ?? null,
      transcript: row.transcript ?? null,
      summary: row.summary ?? null,
      status: row.status ?? null,
    },
  };
}

export function adaptYoutubeContentAsset(
  row: YoutubeContentAssetRow,
): KagriAdapterRecord<KagriYoutubeContentAsset> {
  const contentId = requiredId(
    row.id,
    "youtube_content_assets.id",
  );

  const source = makeSourceRef(
    "legacy",
    "youtube_content_assets",
    contentId,
  );

  return {
    entity: makeEntityRef(
      "CONTENT",
      source,
    ),
    data: {
      contentId,
      youtubeVideoId: cleanId(row.youtube_video_id),
      title: row.title ?? null,
      videoUrl: row.video_url ?? null,
      channelTitle: row.channel_title ?? null,
      publishedAt: row.published_at ?? null,
      crop: row.crop ?? null,
      topic: row.topic ?? null,
      expertName: row.expert_name ?? null,
      sourceType: row.source_type ?? null,
      assetStatus: row.asset_status ?? null,
    },
  };
}

export function adaptExpoContentLink(
  row: ContentLinkRow,
): KagriExpoContentLink {
  return {
    contentId: requiredId(
      row.content_id,
      "content_links.content_id",
    ),
    boothId: cleanId(row.booth_id),
    title: row.title ?? null,
    url: row.url ?? null,
    status: row.status ?? null,
  };
}
