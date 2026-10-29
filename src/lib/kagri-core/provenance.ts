import type { KagriSourceRef } from "./types";

export type KagriProvenanceType =
  | "SOURCE"
  | "EXPERT_SOURCE"
  | "OFFICIAL_SOURCE"
  | "FIELD_CASE"
  | "JOPD_ARCHIVE"
  | "RESEARCH"
  | "PRODUCT_CLAIM"
  | "AI_INFERENCE"
  | "EDITORIAL";

export type KagriVerificationStatus =
  | "UNVERIFIED"
  | "CANDIDATE"
  | "VERIFIED"
  | "CONFLICTED"
  | "BLOCKED";

export type KagriProvenance = {
  type: KagriProvenanceType;
  source?: KagriSourceRef;
  sourceFile?: string;
  sourcePage?: number;
  sourceTimecodeStart?: number;
  sourceTimecodeEnd?: number;
  verificationStatus: KagriVerificationStatus;
  createdAt?: string;
  verifiedAt?: string;
};

export function isVerified(
  provenance: KagriProvenance,
): boolean {
  return provenance.verificationStatus === "VERIFIED";
}

export function canPresentAsVerifiedFact(
  provenance: KagriProvenance,
): boolean {
  if (!isVerified(provenance)) return false;

  return (
    provenance.type === "SOURCE" ||
    provenance.type === "EXPERT_SOURCE" ||
    provenance.type === "OFFICIAL_SOURCE"
  );
}
