import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLES = [
  "expo_booth_visits",
  "expo_product_views",
  "expo_consult_leads",
  "expo_leads",
  "expo_conversions",
  "expo_orders",
  "expo_brand_orders",
  "photodoctor_consults",
  "photodoctor_orders",
] as const;

const IDENTITY_HINTS = [
  "user",
  "farmer",
  "customer",
  "phone",
  "mobile",
  "tel",
  "session",
  "visitor",
  "lead",
  "consult",
  "order",
  "booth",
  "product",
  "email",
  "name",
];

function isIdentityColumn(column: string) {
  const lower = column.toLowerCase();
  return IDENTITY_HINTS.some((hint) => lower.includes(hint));
}

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const results = [];

  for (const table of TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(5);

    if (error) {
      results.push({
        table,
        ok: false,
        error: error.message,
      });
      continue;
    }

    const rows = (data ?? []) as unknown as Record<string, unknown>[];

    const allColumns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row))),
    ).sort();

    const identityColumns = allColumns.filter(isIdentityColumn);

    const presence = Object.fromEntries(
      identityColumns.map((column) => [
        column,
        rows.filter((row) => {
          const value = row[column];
          return value !== null && value !== undefined && value !== "";
        }).length,
      ]),
    );

    results.push({
      table,
      ok: true,
      sampledRows: rows.length,
      identityColumns,
      populatedInSample: presence,
    });
  }

  return NextResponse.json({
    ok: true,
    engine: "K-AGRI 365 IDENTITY PROBE",
    version: "0.1.0",
    privacy: "COLUMN_NAMES_AND_PRESENCE_ONLY",
    databaseMutation: false,
    results,
  });
}
