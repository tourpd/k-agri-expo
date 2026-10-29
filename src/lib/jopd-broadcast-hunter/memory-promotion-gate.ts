import type {
  DeepResearchEvidence,
  DeepResearchResult,
} from "./deep-research";

type EvidenceType = DeepResearchEvidence["evidenceType"];

export type PromotionViolation = {
  code: string;
  severity: "BLOCK" | "REVIEW";
  message: string;
};

export type PromotionAudit = {
  researchId: string;
  status: "PASS" | "NEEDS_REVIEW" | "FAIL";
  promotable: boolean;
  modelRecommendationIgnored: boolean;
  evidenceTypes: EvidenceType[];
  violations: PromotionViolation[];
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function containsAny(value: unknown, terms: string[]): boolean {
  const text = JSON.stringify(value ?? "").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

export function auditMemoryPromotion(
  result: DeepResearchResult
): PromotionAudit {
  const violations: PromotionViolation[] = [];

  const manifest = Array.isArray(result.evidenceManifest)
    ? result.evidenceManifest
    : [];

  const evidenceTypes = [
    ...new Set(manifest.map((item) => item.evidenceType)),
  ];

  const has = (type: EvidenceType) =>
    evidenceTypes.includes(type);

  /*
   * HARD GATE 1
   * 과거 연구처럼 Evidence Manifest 자체가 없으면
   * 무엇을 근거로 연구했는지 독립 감사할 수 없다.
   */
  if (manifest.length === 0) {
    violations.push({
      code: "LEGACY_NO_EVIDENCE_MANIFEST",
      severity: "BLOCK",
      message:
        "Evidence Manifest가 없어 연구 근거를 독립 검증할 수 없습니다.",
    });
  }

  const analysis = asRecord(result.analysis);

  const scenes = asArray(analysis.scenes);
  const moments = asArray(analysis.moments);
  const audience = asArray(analysis.audience_intelligence);
  const reusableDna = asArray(analysis.reusable_dna);
  const creatorIntent = asRecord(analysis.creator_intent);

  /*
   * HARD GATE 2
   * 실제 COMMENTS Evidence가 없으면 audience_intelligence를
   * 관찰된 시청자 반응으로 기억시킬 수 없다.
   */
  const audienceContainsUnsupportedClaim =
    audience.some((item) => {
      const record = asRecord(item);

      const status =
        typeof record.status === "string"
          ? record.status
          : "";

      const signals = asArray(
        record.audience_signals
      );

      /*
       * COMMENTS가 없다는 사실 자체를
       * INSUFFICIENT_EVIDENCE로 기록한 것은
       * audience claim이 아니다.
       *
       * 허용 조건은 의도적으로 매우 좁다:
       * - status === INSUFFICIENT_EVIDENCE
       * - audience_signals === []
       *
       * 그 외 audience_intelligence는
       * COMMENTS Evidence 없이는 BLOCK한다.
       */
      return !(
        status === "INSUFFICIENT_EVIDENCE" &&
        signals.length === 0
      );
    });

  if (
    audienceContainsUnsupportedClaim &&
    !has("COMMENTS")
  ) {
    violations.push({
      code: "AUDIENCE_WITHOUT_COMMENTS",
      severity: "BLOCK",
      message:
        "COMMENTS Evidence 없이 실제 audience claim이 생성되었습니다.",
    });
  }

  /*
   * HARD GATE 3
   * OFFICIAL_CREATOR_INTENT는 창작자 인터뷰 또는
   * 공식 설명 근거가 있어야 한다.
   */
  const creatorStatus =
    typeof creatorIntent.status === "string"
      ? creatorIntent.status
      : "";

  if (
    creatorStatus === "OFFICIAL_CREATOR_INTENT" &&
    !has("CREATOR_INTERVIEW") &&
    !has("OFFICIAL_DESCRIPTION")
  ) {
    violations.push({
      code: "OFFICIAL_INTENT_WITHOUT_OFFICIAL_EVIDENCE",
      severity: "BLOCK",
      message:
        "공식 창작의도라고 표시했지만 공식 근거 Evidence가 없습니다.",
    });
  }

  /*
   * HARD GATE 4
   * Transcript/영상 프레임만으로 실제 BGM/SFX를
   * 들었다고 기억시키지 않는다.
   */
  const musicOrSfxClaim =
    containsAny(scenes, [
      "bgm",
      "배경음악",
      "음악",
      "효과음",
      "sfx",
    ]) ||
    containsAny(moments, [
      "bgm",
      "배경음악",
      "음악",
      "효과음",
      "sfx",
    ]);

  if (musicOrSfxClaim && !has("AUDIO_OBSERVATION")) {
    violations.push({
      code: "AUDIO_CLAIM_WITHOUT_AUDIO_OBSERVATION",
      severity: "BLOCK",
      message:
        "AUDIO_OBSERVATION Evidence 없이 BGM/SFX/음악 관련 주장이 존재합니다.",
    });
  }

  /*
   * STRUCTURE GATES
   * 링크/요약 수준의 연구는 장기기억으로 승격하지 않는다.
   */
  if (scenes.length === 0) {
    violations.push({
      code: "NO_SCENE_ANALYSIS",
      severity: "BLOCK",
      message: "검증 가능한 scene 분석이 없습니다.",
    });
  }

  if (moments.length === 0) {
    violations.push({
      code: "NO_MOMENT_ANALYSIS",
      severity: "BLOCK",
      message: "검증 가능한 moment 분석이 없습니다.",
    });
  }

  if (reusableDna.length === 0) {
    violations.push({
      code: "NO_REUSABLE_DNA",
      severity: "BLOCK",
      message: "재사용 가능한 Broadcast DNA가 없습니다.",
    });
  }

  /*
   * 모델 자신의 quality_gate는 권위가 아니다.
   * eligible_for_memory_promotion=true여도 아래 결과를 뒤집지 못한다.
   */
  const qualityGate = asRecord(analysis.quality_gate);

  if (
    qualityGate.eligible_for_memory_promotion === true &&
    violations.some((v) => v.severity === "BLOCK")
  ) {
    violations.push({
      code: "MODEL_SELF_APPROVAL_OVERRIDDEN",
      severity: "REVIEW",
      message:
        "연구 모델은 승격 가능하다고 판단했지만 Evidence Gate가 이를 무효화했습니다.",
    });
  }

  const hasBlock = violations.some(
    (item) => item.severity === "BLOCK"
  );

  const hasReview = violations.some(
    (item) => item.severity === "REVIEW"
  );

  return {
    researchId: result.researchId,
    status: hasBlock
      ? "FAIL"
      : hasReview
        ? "NEEDS_REVIEW"
        : "PASS",
    promotable: !hasBlock && !hasReview,
    modelRecommendationIgnored: true,
    evidenceTypes,
    violations,
  };
}
