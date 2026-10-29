import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  adaptExpoBehaviorEvent,
  adaptPhotoDoctorConsultLink,
  adaptPhotoDoctorOrderLink,
} from "@/lib/kagri-core/adapters";
import {
  getPhoneJourneyIdFromRow,
  summarizeJourneys,
} from "@/lib/kagri-core/journey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenericRow = Record<string, unknown>;

function str(row: GenericRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function time(row: GenericRow) {
  return (
    str(
      row,
      "created_at",
      "occurred_at",
      "updated_at",
      "converted_at",
      "ordered_at",
    ) ?? new Date(0).toISOString()
  );
}

function id(row: GenericRow) {
  return (
    str(
      row,
      "id",
      "lead_id",
      "order_id",
      "view_id",
      "conversion_id",
      "consult_id",
    ) ?? "unknown"
  );
}

function genericEvent(
  table: string,
  eventType: string,
  row: GenericRow,
) {
  const userId = str(
    row,
    "user_id",
    "farmer_id",
    "customer_id",
    "buyer_user_id",
  );

  const sessionId = str(
    row,
    "session_id",
    "farmer_session_id",
    "visitor_id",
  );

  const personJourneyId = getPhoneJourneyIdFromRow(row);

  const boothId = str(row, "booth_id");
  const productId = str(row, "product_id");
  const leadId = str(row, "lead_id", "consult_id");
  const orderId = str(row, "order_id");

  return {
    eventId: `${table}:${id(row)}`,
    eventType,
    occurredAt: time(row),

    actorType: userId ? "USER" : "ANONYMOUS",

    actor: userId
      ? {
          entityType: "USER",
          sourceSystem: "kagri365",
          sourceTable: table,
          sourceId: userId,
          canonicalId: userId,
        }
      : null,

    subject: {
      entityType:
        productId
          ? "PRODUCT"
          : boothId
            ? "BOOTH"
            : orderId
              ? "ORDER"
              : leadId
                ? "LEAD"
                : "CONTENT",

      sourceSystem: "kagri365",
      sourceTable: table,
      sourceId:
        productId ??
        boothId ??
        orderId ??
        leadId ??
        id(row),
    },

    object: null,

    channel:
      table.startsWith("photodoctor")
        ? "photodoctor"
        : "expo",

    source: {
      sourceSystem:
        table.startsWith("photodoctor")
          ? "photodoctor"
          : "expo",
      sourceTable: table,
      sourceId: id(row),
    },

    sessionId,

    journeyId:
      userId
        ? `user:${userId}`
        : personJourneyId
          ? personJourneyId
          : sessionId
            ? `session:${sessionId}`
            : null,

    metadata: {
      table,
      boothId,
      productId,
      leadId,
      orderId,
      crop: str(row, "crop", "crop_name"),
      status: str(
        row,
        "status",
        "order_status",
        "payment_status",
      ),
    },
  };
}

const SOURCES = [
  {
    table: "expo_behavior_logs",
    eventType: "EXPO_VISIT",
  },
  {
    table: "expo_booth_visits",
    eventType: "BOOTH_VIEW",
  },
  {
    table: "expo_product_views",
    eventType: "PRODUCT_VIEW",
  },
  {
    table: "expo_consult_leads",
    eventType: "CONSULT_CREATED",
  },
  {
    table: "expo_leads",
    eventType: "LEAD_CREATED",
  },
  {
    table: "expo_conversions",
    eventType: "OUTCOME_RECORDED",
  },
  {
    table: "expo_orders",
    eventType: "ORDER_CREATED",
  },
  {
    table: "expo_brand_orders",
    eventType: "ORDER_CREATED",
  },
  {
    table: "photodoctor_consults",
    eventType: "CONSULT_CREATED",
  },
  {
    table: "photodoctor_orders",
    eventType: "ORDER_CREATED",
  },
] as const;

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();

    const url = new URL(request.url);

    const requestedLimit = Number(
      url.searchParams.get("limit") ?? "50",
    );

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(
          Math.max(Math.trunc(requestedLimit), 1),
          200,
        )
      : 50;

    const events: GenericRow[] = [];
    const sources: GenericRow[] = [];

    for (const source of SOURCES) {
      const { data, error } = await supabase
        .from(source.table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        sources.push({
          table: source.table,
          ok: false,
          count: 0,
          error: error.message,
        });

        continue;
      }

      const rows = (data ?? []) as unknown as GenericRow[];

      sources.push({
        table: source.table,
        ok: true,
        count: rows.length,
      });

      for (const row of rows) {
        if (source.table === "expo_behavior_logs") {
          try {
            events.push(
              adaptExpoBehaviorEvent(
                row as Parameters<
                  typeof adaptExpoBehaviorEvent
                >[0],
              ) as unknown as GenericRow,
            );
            continue;
          } catch {
          }
        }

        if (source.table === "photodoctor_consults") {
          try {
            const link = adaptPhotoDoctorConsultLink(
              row as Parameters<
                typeof adaptPhotoDoctorConsultLink
              >[0],
            );

            events.push({
              ...genericEvent(
                source.table,
                source.eventType,
                row,
              ),
              metadata: {
                ...genericEvent(
                  source.table,
                  source.eventType,
                  row,
                ).metadata,
                photoDoctor: link,
              },
            });

            continue;
          } catch {
          }
        }

        if (source.table === "photodoctor_orders") {
          try {
            const link = adaptPhotoDoctorOrderLink(
              row as Parameters<
                typeof adaptPhotoDoctorOrderLink
              >[0],
            );

            events.push({
              ...genericEvent(
                source.table,
                source.eventType,
                row,
              ),
              metadata: {
                ...genericEvent(
                  source.table,
                  source.eventType,
                  row,
                ).metadata,
                photoDoctor: link,
              },
            });

            continue;
          } catch {
          }
        }

        events.push(
          genericEvent(
            source.table,
            source.eventType,
            row,
          ),
        );
      }
    }

    events.sort((a, b) => {
      const ta = new Date(
        String(a.occurredAt ?? 0),
      ).getTime();

      const tb = new Date(
        String(b.occurredAt ?? 0),
      ).getTime();

      return tb - ta;
    });

    const journeys = summarizeJourneys(events as any);

    const crossTableJourneys = journeys.filter(
      (journey) => journey.crossesTables,
    ).length;

    const crossChannelJourneys = journeys.filter(
      (journey) => journey.crossesChannels,
    ).length;

    return NextResponse.json({
      ok: true,

      engine: "K-AGRI 365 CONNECTION SPINE",
      version: "0.5.0",

      mode: "READ_EXISTING_DATA",
      databaseMutation: false,

      summary: {
        sourceTables: SOURCES.length,
        totalEvents: events.length,
        connectedJourneys: journeys.length,
        crossTableJourneys,
        crossChannelJourneys,
      },

      sources,

      journeys: journeys.slice(0, 100),

      events: events.slice(0, limit),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        stage: "KAGRI_365_CONNECTION_SPINE",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
