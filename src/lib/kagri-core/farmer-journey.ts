import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  makePhoneJourneyId,
  normalizeJourneyPhone,
} from "@/lib/kagri-core/journey";

type Row = Record<string, unknown>;

export type FarmerJourneyItem = {
  id: string;
  occurredAt: string;
  sourceTable: string;
  channel: "expo" | "photodoctor";
  eventType: "CONSULT_CREATED" | "ORDER_CREATED";
  label: string;
  detail: string;
  status: string | null;
};

function text(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

function rowId(row: Row) {
  return (
    text(row, "id", "order_id", "consult_id") ??
    "unknown"
  );
}

function occurredAt(row: Row) {
  return (
    text(
      row,
      "created_at",
      "ordered_at",
      "updated_at",
    ) ?? new Date(0).toISOString()
  );
}

function orderDetail(row: Row) {
  return (
    text(
      row,
      "product_name",
      "product",
      "crop",
      "memo",
    ) ?? "주문"
  );
}

function consultDetail(row: Row) {
  return (
    text(
      row,
      "problem_name",
      "problem",
      "crop",
      "memo",
    ) ?? "상담"
  );
}

function status(row: Row) {
  return text(
    row,
    "order_status",
    "payment_status",
    "status",
    "consult_status",
  );
}

export async function getFarmerJourneyByPhone(
  rawPhone: string
) {
  const phone = normalizeJourneyPhone(rawPhone);

  if (!phone) {
    return {
      phone: null,
      journeyId: null,
      items: [] as FarmerJourneyItem[],
      sourceTables: [] as string[],
      channels: [] as string[],
      crossesTables: false,
      crossesChannels: false,
    };
  }

  const supabase = createSupabaseAdminClient();

  const [
    expoOrdersResult,
    brandOrdersResult,
    photoConsultsResult,
    photoOrdersResult,
  ] = await Promise.all([
    supabase
      .from("expo_orders")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(5000),

    supabase
      .from("expo_brand_orders")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(5000),

    supabase
      .from("photodoctor_consults")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(5000),

    supabase
      .from("photodoctor_orders")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(5000),
  ]);

  const samePhone = (value: unknown) =>
    normalizeJourneyPhone(value) === phone;

  const expoOrders = ((expoOrdersResult.data ?? []) as Row[]).filter(
    (row) =>
      samePhone(row.buyer_phone) ||
      samePhone(row.phone)
  );

  const brandOrders = ((brandOrdersResult.data ?? []) as Row[]).filter(
    (row) => samePhone(row.phone)
  );

  const photoConsults = ((photoConsultsResult.data ?? []) as Row[]).filter(
    (row) => samePhone(row.phone)
  );

  const photoOrders = ((photoOrdersResult.data ?? []) as Row[]).filter(
    (row) =>
      samePhone(row.farmer_phone) ||
      samePhone(row.buyer_phone) ||
      samePhone(row.receiver_phone)
  );

  const items: FarmerJourneyItem[] = [];

  for (const row of expoOrders) {
    items.push({
      id: `expo_orders:${rowId(row)}`,
      occurredAt: occurredAt(row),
      sourceTable: "expo_orders",
      channel: "expo",
      eventType: "ORDER_CREATED",
      label: "EXPO 주문",
      detail: orderDetail(row),
      status: status(row),
    });
  }

  for (const row of brandOrders) {
    items.push({
      id: `expo_brand_orders:${rowId(row)}`,
      occurredAt: occurredAt(row),
      sourceTable: "expo_brand_orders",
      channel: "expo",
      eventType: "ORDER_CREATED",
      label: "브랜드 상품 주문",
      detail: orderDetail(row),
      status: status(row),
    });
  }

  for (const row of photoConsults) {
    items.push({
      id: `photodoctor_consults:${rowId(row)}`,
      occurredAt: occurredAt(row),
      sourceTable: "photodoctor_consults",
      channel: "photodoctor",
      eventType: "CONSULT_CREATED",
      label: "포토닥터 상담",
      detail: consultDetail(row),
      status: status(row),
    });
  }

  for (const row of photoOrders) {
    items.push({
      id: `photodoctor_orders:${rowId(row)}`,
      occurredAt: occurredAt(row),
      sourceTable: "photodoctor_orders",
      channel: "photodoctor",
      eventType: "ORDER_CREATED",
      label: "포토닥터 주문",
      detail: orderDetail(row),
      status: status(row),
    });
  }

  items.sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt)
  );

  const sourceTables = Array.from(
    new Set(items.map((item) => item.sourceTable))
  );

  const channels = Array.from(
    new Set(items.map((item) => item.channel))
  );

  return {
    phone,
    journeyId: makePhoneJourneyId(phone),
    items,
    sourceTables,
    channels,
    crossesTables: sourceTables.length >= 2,
    crossesChannels: channels.length >= 2,
  };
}
