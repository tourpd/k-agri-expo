import { makeEntityRef, makeSourceRef } from "../identity";
import type { KagriEntityType } from "../types";
import type {
  KagriActorType,
  KagriChannel,
  KagriEvent,
  KagriEventType,
} from "../event";

type ExpoBehaviorRow = {
  id: string;
  event_type?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  booth_id?: string | null;
  product_id?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  meta?: Record<string, unknown> | null;
  created_at?: string | null;
};

type CrmEventRow = {
  id: string;
  event_type?: string | null;
  ref_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type CustomerActivityRow = {
  id: string;
  customer_id?: string | null;
  activity_type?: string | null;
  activity_title?: string | null;
  activity_value?: string | null;
  source_channel?: string | null;
  source_page?: string | null;
  created_at?: string | null;
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
      `K-AGRI Event adapter: ${label}가 없습니다.`,
    );
  }

  return id;
}

function isoOrNow(value: string | null | undefined): string {
  if (!value) return new Date().toISOString();

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString();
  }

  return d.toISOString();
}

function expoEventType(
  value: string | null | undefined,
): KagriEventType {
  const v = (value ?? "").toLowerCase();

  if (v.includes("product")) return "PRODUCT_VIEW";
  if (v.includes("booth")) return "BOOTH_VIEW";
  if (v.includes("content")) return "CONTENT_VIEW";
  if (v.includes("click")) return "CONTENT_CLICK";

  return "EXPO_VISIT";
}

function targetEntityType(
  targetType: string | null | undefined,
  boothId: string | null,
  productId: string | null,
): KagriEntityType {
  const v = (targetType ?? "").toLowerCase();

  if (productId || v.includes("product")) return "PRODUCT";
  if (boothId || v.includes("booth")) return "BOOTH";
  if (v.includes("content")) return "CONTENT";

  return "CONTENT";
}

function channelFromString(
  value: string | null | undefined,
): KagriChannel {
  const v = (value ?? "").toLowerCase();

  if (v.includes("youtube")) return "youtube";
  if (v.includes("photodoctor")) return "photodoctor";
  if (v.includes("expo")) return "expo";
  if (v.includes("crm")) return "crm";
  if (v.includes("vendor")) return "vendor";
  if (v.includes("buyer")) return "buyer";
  if (v.includes("jopd")) return "jopd";

  return "unknown";
}

export function adaptExpoBehaviorEvent(
  row: ExpoBehaviorRow,
): KagriEvent {
  const eventId = requiredId(
    row.id,
    "expo_behavior_logs.id",
  );

  const boothId = cleanId(row.booth_id);
  const productId = cleanId(row.product_id);
  const targetId =
    cleanId(row.target_id) ??
    productId ??
    boothId ??
    eventId;

  const entityType = targetEntityType(
    row.target_type,
    boothId,
    productId,
  );

  const source = makeSourceRef(
    "expo",
    "expo_behavior_logs",
    eventId,
  );

  const subject = makeEntityRef(
    entityType,
    source,
    entityType === "PRODUCT"
      ? productId ?? undefined
      : entityType === "BOOTH"
        ? boothId ?? undefined
        : undefined,
  );

  const userId = cleanId(row.user_id);

  return {
    eventId,
    eventType: expoEventType(row.event_type),
    occurredAt: isoOrNow(row.created_at),

    actorType: userId ? "USER" : "ANONYMOUS",
    actor: userId
      ? makeEntityRef(
          "USER",
          makeSourceRef(
            "expo",
            "expo_behavior_logs",
            userId,
          ),
          userId,
        )
      : null,

    subject: {
      ...subject,
      sourceId: targetId,
    },

    object: null,
    channel: "expo",
    source,

    sessionId: cleanId(row.session_id),
    journeyId: null,

    metadata: {
      legacyEventType: row.event_type ?? null,
      legacyTargetType: row.target_type ?? null,
      boothId,
      productId,
      ...(row.meta ?? {}),
    },
  };
}

export function adaptCrmEvent(
  row: CrmEventRow,
): KagriEvent {
  const eventId = requiredId(
    row.id,
    "crm_events.id",
  );

  const refId = cleanId(row.ref_id) ?? eventId;

  const source = makeSourceRef(
    "crm",
    "crm_events",
    eventId,
  );

  return {
    eventId,
    eventType: "LEAD_CREATED",
    occurredAt: isoOrNow(row.created_at),

    actorType: "SYSTEM",
    actor: null,

    subject: makeEntityRef(
      "LEAD",
      makeSourceRef(
        "crm",
        "crm_events",
        refId,
      ),
    ),

    object: null,
    channel: "crm",
    source,

    sessionId: null,
    journeyId: null,

    metadata: {
      legacyEventType: row.event_type ?? null,
      ...(row.metadata ?? {}),
    },
  };
}

export function adaptCustomerActivityEvent(
  row: CustomerActivityRow,
): KagriEvent {
  const eventId = requiredId(
    row.id,
    "customer_activity_logs.id",
  );

  const customerId =
    cleanId(row.customer_id) ?? eventId;

  const source = makeSourceRef(
    "legacy",
    "customer_activity_logs",
    eventId,
  );

  return {
    eventId,
    eventType: "CONTENT_VIEW",
    occurredAt: isoOrNow(row.created_at),

    actorType: "USER",

    actor: makeEntityRef(
      "USER",
      makeSourceRef(
        "legacy",
        "customer_activity_logs",
        customerId,
      ),
    ),

    subject: makeEntityRef(
      "CONTENT",
      source,
    ),

    object: null,

    channel: channelFromString(
      row.source_channel,
    ),

    source,

    sessionId: null,
    journeyId: null,

    metadata: {
      legacyActivityType:
        row.activity_type ?? null,
      activityTitle:
        row.activity_title ?? null,
      activityValue:
        row.activity_value ?? null,
      sourcePage:
        row.source_page ?? null,
    },
  };
}

export type KagriLegacyEventAdapterResult = {
  event: KagriEvent;
  attributionReady: boolean;
  reason: string;
};

export function assessAttributionReadiness(
  event: KagriEvent,
): KagriLegacyEventAdapterResult {
  if (event.journeyId) {
    return {
      event,
      attributionReady: true,
      reason: "journeyId가 존재합니다.",
    };
  }

  if (event.sessionId) {
    return {
      event,
      attributionReady: false,
      reason:
        "sessionId는 있으나 K-AGRI 전체 journeyId는 없습니다.",
    };
  }

  return {
    event,
    attributionReady: false,
    reason:
      "공통 journeyId/sessionId가 없어 직접 Attribution 근거로 사용할 수 없습니다.",
  };
}
