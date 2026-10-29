import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCES = [
  {
    table: "expo_orders",
    phoneFields: ["buyer_phone", "phone"],
  },
  {
    table: "expo_brand_orders",
    phoneFields: ["phone"],
  },
  {
    table: "photodoctor_consults",
    phoneFields: ["phone"],
  },
  {
    table: "photodoctor_orders",
    phoneFields: ["farmer_phone", "buyer_phone", "receiver_phone"],
  },
] as const;

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;

  const digits = value.replace(/\D/g, "");

  if (digits.length < 9) return null;

  return digits;
}

function phoneKey(phone: string) {
  return createHash("sha256")
    .update(`kagri365:${phone}`)
    .digest("hex")
    .slice(0, 16);
}

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const identities = new Map<
    string,
    {
      journeyKey: string;
      sources: Set<string>;
      records: number;
    }
  >();

  const sourceSummary = [];

  for (const source of SOURCES) {
    const { data, error } = await supabase
      .from(source.table)
      .select("*")
      .limit(200);

    if (error) {
      sourceSummary.push({
        table: source.table,
        ok: false,
        error: error.message,
      });
      continue;
    }

    const rows = (data ?? []) as unknown as Record<string, unknown>[];

    let rowsWithPhone = 0;

    for (const row of rows) {
      let phone: string | null = null;

      for (const field of source.phoneFields) {
        phone = normalizePhone(row[field]);
        if (phone) break;
      }

      if (!phone) continue;

      rowsWithPhone++;

      const key = phoneKey(phone);

      const current = identities.get(key) ?? {
        journeyKey: key,
        sources: new Set<string>(),
        records: 0,
      };

      current.sources.add(source.table);
      current.records++;

      identities.set(key, current);
    }

    sourceSummary.push({
      table: source.table,
      ok: true,
      rows: rows.length,
      rowsWithPhone,
    });
  }

  const journeys = Array.from(identities.values())
    .map((item) => ({
      journeyKey: item.journeyKey,
      sourceCount: item.sources.size,
      sources: Array.from(item.sources),
      records: item.records,
    }))
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) {
        return b.sourceCount - a.sourceCount;
      }
      return b.records - a.records;
    });

  return NextResponse.json({
    ok: true,
    engine: "K-AGRI 365 JOURNEY PROBE",
    version: "0.1.0",
    databaseMutation: false,
    privacy: "PHONE_NORMALIZED_THEN_SHA256_HASHED",
    summary: {
      uniquePeople: journeys.length,
      crossSystemJourneys: journeys.filter(
        (journey) => journey.sourceCount >= 2,
      ).length,
    },
    sources: sourceSummary,
    journeys,
  });
}
