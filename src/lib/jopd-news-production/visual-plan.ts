/**
 * K-AGRI ACTION NEWS — Visual Production Contract
 *
 * ARTICLE -> VISUAL REQUIREMENTS -> ASSET MATCH
 *         -> ACQUISITION REQUESTS -> VERIFIED VISUAL PLAN
 *
 * This module contains no crop-, story-, FACT-, page- or coordinate-specific rules.
 *
 * Core rule:
 * Never pretend that a requested visual asset exists.
 * A missing asset becomes an acquisition request.
 */

export const ACTION_NEWS_VISUAL_PLAN_VERSION =
  "K_AGRI_ACTION_NEWS_VISUAL_PLAN_V1";

export type NewsVisualKind =
  | "FIELD_VIDEO"
  | "RELATED_FOOTAGE"
  | "INTERVIEW"
  | "PHOTO"
  | "OFFICIAL_DOCUMENT"
  | "OFFICIAL_WEBPAGE"
  | "DATA_GRAPHIC"
  | "MAP"
  | "ACTION_CARD"
  | "TITLE_CARD";

export type NewsAssetStatus =
  | "AVAILABLE"
  | "NEEDS_ACQUISITION"
  | "REJECTED";

export type NewsAssetAuthority =
  | "OFFICIAL_PRIMARY"
  | "VERIFIED_SECONDARY"
  | "EDITORIAL"
  | "UNKNOWN";

export type NewsArticleSegmentInput = {
  segmentId: string;
  role: string;
  narration: string;
  startSeconds: number;
  endSeconds: number;
  factIds: string[];
};

export type NewsVisualRequirement = {
  requirementId: string;
  segmentId: string;

  /**
   * What must be communicated visually.
   * This is semantic intent, not a fabricated asset description.
   */
  purpose: string;

  preferredKinds: NewsVisualKind[];

  /**
   * FACT IDs that the visual is expected to prove or support.
   * Empty means the visual may be illustrative/editorial.
   */
  factIds: string[];

  evidenceRequired: boolean;

  /**
   * Search/research concepts for Hunter.
   * They are requests, never proof that an asset exists.
   */
  searchIntents: string[];
};

export type AvailableNewsAsset = {
  assetId: string;
  kind: NewsVisualKind;
  status: "AVAILABLE";

  title: string;
  localPath?: string;
  sourceUrl?: string;

  authority: NewsAssetAuthority;

  /**
   * FACT IDs actually supported by this asset after verification.
   */
  verifiedFactIds: string[];

  /**
   * Optional provenance IDs from Hunter / Evidence systems.
   */
  provenanceIds?: string[];
};

export type NewsAcquisitionRequest = {
  requestId: string;
  segmentId: string;
  requirementId: string;

  purpose: string;
  acceptableKinds: NewsVisualKind[];
  searchIntents: string[];
  factIds: string[];

  evidenceRequired: boolean;

  status: "NEEDS_ACQUISITION";
};

export type PlannedNewsVisual = {
  segmentId: string;
  requirementId: string;

  status: NewsAssetStatus;

  /**
   * Set only when an actual available asset was matched.
   */
  assetId?: string;

  kind?: NewsVisualKind;

  startSeconds: number;
  endSeconds: number;

  purpose: string;
  factIds: string[];
};

export type NewsVisualPlan = {
  version: typeof ACTION_NEWS_VISUAL_PLAN_VERSION;
  newsId: string;
  generatedAt: string;

  segments: NewsArticleSegmentInput[];
  requirements: NewsVisualRequirement[];
  availableAssets: AvailableNewsAsset[];

  plannedVisuals: PlannedNewsVisual[];
  acquisitionRequests: NewsAcquisitionRequest[];

  gate: {
    inventedAssetsForbidden: true;
    missingAssetsBecomeRequests: true;
    factualVisualsRequireVerifiedEvidence: true;
    officialPrimaryPreferredForOfficialClaims: true;
  };
};

function assetSupportsRequirement(
  asset: AvailableNewsAsset,
  requirement: NewsVisualRequirement,
): boolean {
  if (!requirement.preferredKinds.includes(asset.kind)) {
    return false;
  }

  if (!requirement.evidenceRequired) {
    return true;
  }

  if (asset.authority === "UNKNOWN") {
    return false;
  }

  return requirement.factIds.every((factId) =>
    asset.verifiedFactIds.includes(factId),
  );
}

/**
 * Deterministic gate between planning and production.
 *
 * It does NOT invent visual ideas.
 * It receives editorial/AI requirements and real available assets,
 * then decides only:
 *
 *   AVAILABLE -> may enter production
 *   MISSING   -> Hunter acquisition request
 */
export function resolveNewsVisualPlan(input: {
  newsId: string;
  segments: NewsArticleSegmentInput[];
  requirements: NewsVisualRequirement[];
  availableAssets: AvailableNewsAsset[];
}): NewsVisualPlan {
  const segmentById = new Map(
    input.segments.map((segment) => [
      segment.segmentId,
      segment,
    ]),
  );

  const plannedVisuals: PlannedNewsVisual[] = [];
  const acquisitionRequests: NewsAcquisitionRequest[] = [];

  for (const requirement of input.requirements) {
    const segment = segmentById.get(requirement.segmentId);

    if (!segment) {
      throw new Error(
        `NEWS_VISUAL_PLAN_GATE: unknown segment ${requirement.segmentId}`,
      );
    }

    const asset = input.availableAssets.find((candidate) =>
      assetSupportsRequirement(candidate, requirement),
    );

    if (asset) {
      plannedVisuals.push({
        segmentId: segment.segmentId,
        requirementId: requirement.requirementId,
        status: "AVAILABLE",
        assetId: asset.assetId,
        kind: asset.kind,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        purpose: requirement.purpose,
        factIds: requirement.factIds,
      });

      continue;
    }

    plannedVisuals.push({
      segmentId: segment.segmentId,
      requirementId: requirement.requirementId,
      status: "NEEDS_ACQUISITION",
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      purpose: requirement.purpose,
      factIds: requirement.factIds,
    });

    acquisitionRequests.push({
      requestId: `ACQ-${requirement.requirementId}`,
      segmentId: segment.segmentId,
      requirementId: requirement.requirementId,
      purpose: requirement.purpose,
      acceptableKinds: requirement.preferredKinds,
      searchIntents: requirement.searchIntents,
      factIds: requirement.factIds,
      evidenceRequired: requirement.evidenceRequired,
      status: "NEEDS_ACQUISITION",
    });
  }

  return {
    version: ACTION_NEWS_VISUAL_PLAN_VERSION,
    newsId: input.newsId,
    generatedAt: new Date().toISOString(),
    segments: input.segments,
    requirements: input.requirements,
    availableAssets: input.availableAssets,
    plannedVisuals,
    acquisitionRequests,
    gate: {
      inventedAssetsForbidden: true,
      missingAssetsBecomeRequests: true,
      factualVisualsRequireVerifiedEvidence: true,
      officialPrimaryPreferredForOfficialClaims: true,
    },
  };
}
