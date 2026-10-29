import type {
  KagriEntityRef,
  KagriEntityType,
  KagriSourceRef,
} from "./types";

export const KAGRI_CANONICAL_TABLES = {
  USER: { table: "profiles", idColumn: "user_id" },
  FARMER: { table: "farmers", idColumn: "farmer_id" },
  FARM: { table: "farms", idColumn: "id" },
  VENDOR: { table: "vendors", idColumn: "vendor_id" },
  BOOTH: { table: "booths", idColumn: "booth_id" },
  PRODUCT: { table: "products", idColumn: "product_id" },
  BUYER: { table: "buyers", idColumn: "buyer_id" },
  LEAD: { table: "expo_consult_leads", idColumn: "lead_id" },
} as const;

export function makeSourceRef(
  sourceSystem: KagriSourceRef["sourceSystem"],
  sourceTable: string,
  sourceId: string,
): KagriSourceRef {
  return {
    sourceSystem,
    sourceTable,
    sourceId,
  };
}

export function makeEntityRef(
  entityType: KagriEntityType,
  source: KagriSourceRef,
  canonicalId?: string,
): KagriEntityRef {
  return {
    entityType,
    ...source,
    canonicalId,
  };
}

export function sourceRefKey(ref: KagriSourceRef): string {
  return `${ref.sourceSystem}:${ref.sourceTable}:${ref.sourceId}`;
}
