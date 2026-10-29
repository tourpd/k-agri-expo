import fs from "fs";
import path from "path";
import type { DeepResearchResult } from "./deep-research";
import {
  auditMemoryPromotion,
  type PromotionAudit,
} from "./memory-promotion-gate";

const DNA_DIR = path.join(
  process.cwd(),
  "jopd-studio",
  "broadcast-dna",
  "dna"
);

export type ApprovedBroadcastMemory = {
  version: "JOPD_APPROVED_BROADCAST_MEMORY_V1";
  memoryStatus: "APPROVED_MEMORY";
  truthClass: "RETRIEVED";
  promotedAt: string;
  researchId: string;
  researchCreatedAt: string;
  researchQuestion: string;
  sourceUrls: string[];
  evidenceManifest: DeepResearchResult["evidenceManifest"];
  promotionAudit: PromotionAudit;
  analysis: unknown;
};

function atomicWriteJson(
  filename: string,
  value: unknown
) {
  fs.mkdirSync(DNA_DIR, { recursive: true });

  const target = path.join(DNA_DIR, filename);
  const temp = `${target}.tmp-${process.pid}`;

  fs.writeFileSync(
    temp,
    JSON.stringify(value, null, 2),
    "utf8"
  );

  fs.renameSync(temp, target);

  return target;
}

export function promoteResearchToMemory(
  research: DeepResearchResult
): {
  promoted: true;
  path: string;
  memory: ApprovedBroadcastMemory;
} {
  const audit = auditMemoryPromotion(research);

  /*
   * 절대 규칙:
   * 연구 모델 자신의 self approval은 승격 권한이 없다.
   * Evidence Promotion Gate의 PASS만 승격 권한을 가진다.
   */
  if (
    audit.status !== "PASS" ||
    audit.promotable !== true
  ) {
    const codes = audit.violations
      .map((item) => item.code)
      .join(", ");

    throw new Error(
      `MEMORY_PROMOTION_BLOCKED: ${audit.status}` +
      (codes ? ` [${codes}]` : "")
    );
  }

  if (
    !Array.isArray(research.evidenceManifest) ||
    research.evidenceManifest.length === 0
  ) {
    throw new Error(
      "MEMORY_PROMOTION_BLOCKED: evidenceManifest is empty"
    );
  }

  const memory: ApprovedBroadcastMemory = {
    version: "JOPD_APPROVED_BROADCAST_MEMORY_V1",
    memoryStatus: "APPROVED_MEMORY",

    /*
     * RETRIEVED는 이후 수석작가가 이 승인 기억을
     * 검색해서 사용할 때의 기억 계층을 의미한다.
     * 원 연구 자체의 truthClass는 RESEARCHED_NOW이며
     * researchId/provenance로 계속 추적된다.
     */
    truthClass: "RETRIEVED",

    promotedAt: new Date().toISOString(),
    researchId: research.researchId,
    researchCreatedAt: research.createdAt,
    researchQuestion: research.researchQuestion,
    sourceUrls: [...research.sourceUrls],
    evidenceManifest: research.evidenceManifest,
    promotionAudit: audit,
    analysis: research.analysis,
  };

  const filename =
    `approved-${research.researchId}.json`;

  const target = atomicWriteJson(
    filename,
    memory
  );

  return {
    promoted: true,
    path: path
      .relative(process.cwd(), target)
      .split(path.sep)
      .join("/"),
    memory,
  };
}
