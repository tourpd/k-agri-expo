export * from "./events";
export * from "./knowledge-content";
export * from "./buyer-global";
export * from "./farmer-photodoctor";
export * from "./enterprise";
export const KAGRI_ADAPTER_SOURCES = {
  FARMER: [
    "farmers",
    "farmer_profiles",
    "expo_farmers",
    "live_farmers",
    "customers",
  ],
  PRODUCT: [
    "products",
    "booth_products",
    "expo_products",
    "expo_brand_products",
    "farmer_products",
  ],
  BUYER: [
    "buyers",
    "buyer_profiles",
    "agri_buyers",
  ],
  ORDER: [
    "expo_orders",
    "expo_brand_orders",
    "photodoctor_orders",
    "farmer_orders",
    "deal_orders",
  ],
  LEAD: [
    "expo_consult_leads",
    "booth_leads",
    "expo_leads",
    "ai_consult_leads",
    "vendor_leads",
    "deal_leads",
  ],
} as const;

export type KagriAdapterGroup =
  keyof typeof KAGRI_ADAPTER_SOURCES;

export function isKnownAdapterSource(
  group: KagriAdapterGroup,
  table: string,
): boolean {
  return (KAGRI_ADAPTER_SOURCES[group] as readonly string[]).includes(table);
}
