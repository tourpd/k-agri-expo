import type {
  KagriEntityRef,
  KagriEntityType,
  KagriSourceRef,
} from "./types";

export type KagriEventType =
  | "CONTENT_VIEW"
  | "CONTENT_CLICK"
  | "EXPO_VISIT"
  | "BOOTH_VIEW"
  | "PRODUCT_VIEW"
  | "PROBLEM_CREATED"
  | "PHOTODOCTOR_DIAGNOSIS"
  | "CONSULT_CREATED"
  | "LEAD_CREATED"
  | "PRODUCT_RECOMMENDED"
  | "ORDER_CREATED"
  | "ORDER_PAID"
  | "ORDER_SHIPPED"
  | "ORDER_COMPLETED"
  | "OUTCOME_RECORDED"
  | "BUYER_REGISTERED"
  | "DEMAND_CREATED"
  | "MATCH_CREATED"
  | "QUOTE_CREATED"
  | "QUOTE_SENT"
  | "TRADE_OFFER_CREATED"
  | "TRADE_COMPLETED"
  | "KNOWLEDGE_USED"
  | "CONTENT_CANDIDATE_CREATED"
  | "SHOOT_PLANNED"
  | "SHOOT_COMPLETED"
  | "CONTENT_PUBLISHED";

export type KagriActorType =
  | "ANONYMOUS"
  | "USER"
  | "FARMER"
  | "BUYER"
  | "VENDOR"
  | "ADMIN"
  | "SYSTEM"
  | "AI";

export type KagriChannel =
  | "koaftv"
  | "youtube"
  | "expo"
  | "photodoctor"
  | "kagri365"
  | "buyer"
  | "vendor"
  | "crm"
  | "jopd"
  | "admin"
  | "external"
  | "unknown";

export type KagriEvent = {
  eventId?: string;

  eventType: KagriEventType;
  occurredAt: string;

  actorType: KagriActorType;
  actor?: KagriEntityRef | null;

  subject: KagriEntityRef;

  object?: KagriEntityRef | null;

  channel: KagriChannel;

  source?: KagriSourceRef | null;

  sessionId?: string | null;
  journeyId?: string | null;

  metadata?: Record<string, unknown>;
};

export function makeKagriEvent(input: {
  eventType: KagriEventType;
  actorType: KagriActorType;
  subject: KagriEntityRef;
  channel: KagriChannel;

  occurredAt?: string;
  actor?: KagriEntityRef | null;
  object?: KagriEntityRef | null;
  source?: KagriSourceRef | null;

  sessionId?: string | null;
  journeyId?: string | null;

  metadata?: Record<string, unknown>;
}): KagriEvent {
  return {
    eventType: input.eventType,
    occurredAt: input.occurredAt ?? new Date().toISOString(),

    actorType: input.actorType,
    actor: input.actor ?? null,

    subject: input.subject,
    object: input.object ?? null,

    channel: input.channel,

    source: input.source ?? null,

    sessionId: input.sessionId ?? null,
    journeyId: input.journeyId ?? null,

    metadata: input.metadata ?? {},
  };
}

export function isEntityType(
  entity: KagriEntityRef | null | undefined,
  type: KagriEntityType,
): boolean {
  return entity?.entityType === type;
}
