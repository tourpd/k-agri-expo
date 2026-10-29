import { createHash } from "crypto";

export type KagriJourneyEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  channel?: string | null;
  journeyId?: string | null;
  source?: {
    sourceTable?: string | null;
  } | null;
};

export type KagriJourneySummary = {
  journeyId: string;
  eventCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  eventTypes: string[];
  sourceTables: string[];
  channels: string[];
  crossesTables: boolean;
  crossesChannels: boolean;
  currentStage: "ORDER" | "CONSULT" | "ACTIVITY";
  nextAction:
    | "TRACK_ORDER_OUTCOME"
    | "FOLLOW_UP_CONSULT"
    | "CONTINUE_TRACKING";
};

export function normalizeJourneyPhone(value: unknown) {
  if (typeof value !== "string") return null;

  const digits = value.replace(/\D/g, "");

  if (digits.length < 9) return null;

  return digits;
}

export function makePhoneJourneyId(value: unknown) {
  const phone = normalizeJourneyPhone(value);

  if (!phone) return null;

  const hash = createHash("sha256")
    .update(`kagri365:${phone}`)
    .digest("hex")
    .slice(0, 16);

  return `person:${hash}`;
}

export function getPhoneJourneyIdFromRow(
  row: Record<string, unknown>
) {
  const fields = [
    "farmer_phone",
    "buyer_phone",
    "phone",
    "receiver_phone",
  ];

  for (const field of fields) {
    const journeyId = makePhoneJourneyId(row[field]);

    if (journeyId) return journeyId;
  }

  return null;
}

export function summarizeJourneys(
  events: KagriJourneyEvent[]
): KagriJourneySummary[] {
  const map = new Map<
    string,
    {
      journeyId: string;
      eventCount: number;
      firstSeenAt: string;
      lastSeenAt: string;
      eventTypes: Set<string>;
      sourceTables: Set<string>;
      channels: Set<string>;
    }
  >();

  for (const event of events) {
    const journeyId = event.journeyId;

    if (!journeyId) continue;

    const sourceTable =
      event.source?.sourceTable?.trim() || "unknown";

    const channel =
      event.channel?.trim() || "unknown";

    const current = map.get(journeyId);

    if (!current) {
      map.set(journeyId, {
        journeyId,
        eventCount: 1,
        firstSeenAt: event.occurredAt,
        lastSeenAt: event.occurredAt,
        eventTypes: new Set([event.eventType]),
        sourceTables: new Set([sourceTable]),
        channels: new Set([channel]),
      });

      continue;
    }

    current.eventCount += 1;
    current.eventTypes.add(event.eventType);
    current.sourceTables.add(sourceTable);
    current.channels.add(channel);

    if (event.occurredAt < current.firstSeenAt) {
      current.firstSeenAt = event.occurredAt;
    }

    if (event.occurredAt > current.lastSeenAt) {
      current.lastSeenAt = event.occurredAt;
    }
  }

  return Array.from(map.values())
    .map((journey) => {
      const eventTypes = Array.from(journey.eventTypes);
      const sourceTables = Array.from(journey.sourceTables);
      const channels = Array.from(journey.channels);

      const hasOrder = eventTypes.includes("ORDER_CREATED");
      const hasConsult = eventTypes.includes("CONSULT_CREATED");

      const currentStage: KagriJourneySummary["currentStage"] =
        hasOrder
          ? "ORDER"
          : hasConsult
            ? "CONSULT"
            : "ACTIVITY";

      const nextAction: KagriJourneySummary["nextAction"] =
        hasOrder
          ? "TRACK_ORDER_OUTCOME"
          : hasConsult
            ? "FOLLOW_UP_CONSULT"
            : "CONTINUE_TRACKING";

      return {
        journeyId: journey.journeyId,
        eventCount: journey.eventCount,
        firstSeenAt: journey.firstSeenAt,
        lastSeenAt: journey.lastSeenAt,
        eventTypes,
        sourceTables,
        channels,
        crossesTables: sourceTables.length >= 2,
        crossesChannels: channels.length >= 2,
        currentStage,
        nextAction,
      };
    })
    .sort((a, b) => {
      if (a.crossesChannels !== b.crossesChannels) {
        return a.crossesChannels ? -1 : 1;
      }

      if (a.crossesTables !== b.crossesTables) {
        return a.crossesTables ? -1 : 1;
      }

      return b.eventCount - a.eventCount;
    });
}
