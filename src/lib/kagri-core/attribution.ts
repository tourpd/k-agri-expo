import type {
  KagriEntityRef,
  KagriSourceRef,
} from "./types";

export type KagriAttributionRole =
  | "ORIGIN"
  | "DISCOVERY"
  | "INFLUENCE"
  | "ASSIST"
  | "CONVERSION"
  | "OUTCOME";

export type KagriAttributionConfidence =
  | "DIRECT"
  | "STRONG"
  | "INFERRED"
  | "UNKNOWN";

export type KagriAttribution = {
  attributionId?: string;

  journeyId?: string | null;

  from: KagriEntityRef;
  to: KagriEntityRef;

  role: KagriAttributionRole;
  confidence: KagriAttributionConfidence;

  source?: KagriSourceRef | null;

  occurredAt?: string | null;

  metadata?: Record<string, unknown>;
};

export function makeAttribution(input: {
  from: KagriEntityRef;
  to: KagriEntityRef;

  role: KagriAttributionRole;
  confidence: KagriAttributionConfidence;

  journeyId?: string | null;
  source?: KagriSourceRef | null;
  occurredAt?: string | null;

  metadata?: Record<string, unknown>;
}): KagriAttribution {
  return {
    from: input.from,
    to: input.to,

    role: input.role,
    confidence: input.confidence,

    journeyId: input.journeyId ?? null,
    source: input.source ?? null,
    occurredAt: input.occurredAt ?? null,

    metadata: input.metadata ?? {},
  };
}

export function canClaimDirectAttribution(
  attribution: KagriAttribution,
): boolean {
  return attribution.confidence === "DIRECT";
}
