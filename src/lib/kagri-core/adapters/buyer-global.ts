import { makeEntityRef, makeSourceRef } from "../identity";
import type { KagriAdapterRecord } from "../types";

export type KagriBuyer = {
  buyerId: string;
  userId: string | null;
  companyName: string | null;
  country: string | null;
  language: string | null;
  buyerType: string | null;
  region: string | null;
  status: string | null;
  approvalStatus: string | null;
  verificationStatus: string | null;
};

export type KagriBuyerProfile = {
  userId: string;
  companyName: string | null;
  country: string | null;
  preferredLanguage: string | null;
  isForeign: boolean | null;
  buyerLevel: string | null;
  verificationStatus: string | null;
  interestCategories: string[];
  interestCrops: string[];
  sourcingTypes: string[];
  targetQuantity: string | null;
  consultationChannel: string | null;
};

export type KagriAgriBuyer = {
  agriBuyerId: string;
  companyName: string | null;
  buyerType: string | null;
  region: string | null;
  interestProducts: string | null;
  status: string | null;
  buyerGrade: string | null;
};

export type KagriBuyerDemand = {
  demandId: string;
  buyerUserId: string | null;
  categoryKey: string | null;
  cropKey: string | null;
  sourcingType: string | null;
  targetQuantity: string | null;
  country: string | null;
  preferredLanguage: string | null;
  isForeign: boolean | null;
  status: string | null;
};

export type KagriBuyerMatch = {
  matchId: string;
  demandId: string | null;
  leadId: string | null;
  vendorId: string | null;
  boothId: string | null;
  matchScore: number | null;
  exportScore: number | null;
  languageScore: number | null;
  quantityScore: number | null;
  matchStatus: string | null;
};

export type KagriExportQuote = {
  quoteId: string;
  leadId: string | null;
  vendorId: string | null;
  boothId: string | null;
  buyerUserId: string | null;
  productName: string | null;
  quantity: string | null;
  unitPrice: string | null;
  incoterm: string | null;
  paymentTerms: string | null;
  deliveryTime: string | null;
  origin: string | null;
  packaging: string | null;
  quoteLanguage: string | null;
  status: string | null;
};

export type KagriAgriTradeOffer = {
  offerId: string;
  storageAssetId: string | null;
  assetId: string | null;
  buyerId: string | null;
  productName: string | null;
  offerQuantity: number | null;
  unit: string | null;
  offerPrice: number | null;
  offerAmount: number | null;
  status: string | null;
};

type BuyerRow = {
  buyer_id: string;
  user_id?: string | null;
  company_name?: string | null;
  country?: string | null;
  language?: string | null;
  buyer_type?: string | null;
  region?: string | null;
  status?: string | null;
  approval_status?: string | null;
  verification_status?: string | null;
};

type BuyerProfileRow = {
  user_id: string;
  company_name?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  is_foreign?: boolean | null;
  buyer_level?: string | null;
  verification_status?: string | null;
  interest_categories?: string[] | null;
  interest_crops?: string[] | null;
  sourcing_types?: string[] | null;
  target_quantity?: string | null;
  consultation_channel?: string | null;
};

type AgriBuyerRow = {
  id: string;
  company_name?: string | null;
  buyer_type?: string | null;
  region?: string | null;
  interest_products?: string | null;
  status?: string | null;
  buyer_grade?: string | null;
};

type BuyerDemandRow = {
  id: string;
  buyer_user_id?: string | null;
  category_key?: string | null;
  crop_key?: string | null;
  sourcing_type?: string | null;
  target_quantity?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  is_foreign?: boolean | null;
  status?: string | null;
};

type BuyerMatchRow = {
  id: string;
  demand_id?: string | null;
  lead_id?: string | null;
  vendor_id?: string | null;
  booth_id?: string | null;
  match_score?: number | null;
  export_score?: number | null;
  language_score?: number | null;
  quantity_score?: number | null;
  match_status?: string | null;
};

type ExportQuoteRow = {
  id: string;
  lead_id?: string | null;
  vendor_id?: string | null;
  booth_id?: string | null;
  buyer_user_id?: string | null;
  product_name?: string | null;
  quantity?: string | null;
  unit_price?: string | null;
  incoterm?: string | null;
  payment_terms?: string | null;
  delivery_time?: string | null;
  origin?: string | null;
  packaging?: string | null;
  quote_language?: string | null;
  status?: string | null;
};

type AgriTradeOfferRow = {
  id: string;
  storage_asset_id?: string | null;
  asset_id?: string | null;
  buyer_id?: string | null;
  product_name?: string | null;
  offer_quantity?: number | null;
  unit?: string | null;
  offer_price?: number | null;
  offer_amount?: number | null;
  status?: string | null;
};

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

function requiredId(value: unknown, label: string): string {
  const id = cleanId(value);
  if (!id) {
    throw new Error(`K-AGRI Buyer/Global adapter: ${label}가 없습니다.`);
  }
  return id;
}

export function adaptBuyer(
  row: BuyerRow,
): KagriAdapterRecord<KagriBuyer> {
  const buyerId = requiredId(row.buyer_id, "buyer_id");
  const source = makeSourceRef("buyer", "buyers", buyerId);

  return {
    entity: makeEntityRef("BUYER", source, buyerId),
    data: {
      buyerId,
      userId: cleanId(row.user_id),
      companyName: row.company_name ?? null,
      country: row.country ?? null,
      language: row.language ?? null,
      buyerType: row.buyer_type ?? null,
      region: row.region ?? null,
      status: row.status ?? null,
      approvalStatus: row.approval_status ?? null,
      verificationStatus: row.verification_status ?? null,
    },
  };
}

export function adaptBuyerProfile(
  row: BuyerProfileRow,
): KagriBuyerProfile {
  const userId = requiredId(row.user_id, "buyer_profiles.user_id");

  return {
    userId,
    companyName: row.company_name ?? null,
    country: row.country ?? null,
    preferredLanguage: row.preferred_language ?? null,
    isForeign: row.is_foreign ?? null,
    buyerLevel: row.buyer_level ?? null,
    verificationStatus: row.verification_status ?? null,
    interestCategories: row.interest_categories ?? [],
    interestCrops: row.interest_crops ?? [],
    sourcingTypes: row.sourcing_types ?? [],
    targetQuantity: row.target_quantity ?? null,
    consultationChannel: row.consultation_channel ?? null,
  };
}

export function adaptAgriBuyer(
  row: AgriBuyerRow,
): KagriAdapterRecord<KagriAgriBuyer> {
  const agriBuyerId = requiredId(row.id, "agri_buyers.id");
  const source = makeSourceRef("buyer", "agri_buyers", agriBuyerId);

  return {
    entity: makeEntityRef("BUYER", source),
    data: {
      agriBuyerId,
      companyName: row.company_name ?? null,
      buyerType: row.buyer_type ?? null,
      region: row.region ?? null,
      interestProducts: row.interest_products ?? null,
      status: row.status ?? null,
      buyerGrade: row.buyer_grade ?? null,
    },
  };
}

export function adaptBuyerDemand(
  row: BuyerDemandRow,
): KagriAdapterRecord<KagriBuyerDemand> {
  const demandId = requiredId(row.id, "buyer_demands.id");
  const source = makeSourceRef("buyer", "buyer_demands", demandId);

  return {
    entity: makeEntityRef("DEMAND", source, demandId),
    data: {
      demandId,
      buyerUserId: cleanId(row.buyer_user_id),
      categoryKey: row.category_key ?? null,
      cropKey: row.crop_key ?? null,
      sourcingType: row.sourcing_type ?? null,
      targetQuantity: row.target_quantity ?? null,
      country: row.country ?? null,
      preferredLanguage: row.preferred_language ?? null,
      isForeign: row.is_foreign ?? null,
      status: row.status ?? null,
    },
  };
}

export function adaptBuyerMatch(
  row: BuyerMatchRow,
): KagriBuyerMatch {
  return {
    matchId: requiredId(row.id, "buyer_matches.id"),
    demandId: cleanId(row.demand_id),
    leadId: cleanId(row.lead_id),
    vendorId: cleanId(row.vendor_id),
    boothId: cleanId(row.booth_id),
    matchScore: row.match_score ?? null,
    exportScore: row.export_score ?? null,
    languageScore: row.language_score ?? null,
    quantityScore: row.quantity_score ?? null,
    matchStatus: row.match_status ?? null,
  };
}

export function adaptExportQuote(
  row: ExportQuoteRow,
): KagriExportQuote {
  return {
    quoteId: requiredId(row.id, "export_quotes.id"),
    leadId: cleanId(row.lead_id),
    vendorId: cleanId(row.vendor_id),
    boothId: cleanId(row.booth_id),
    buyerUserId: cleanId(row.buyer_user_id),
    productName: row.product_name ?? null,
    quantity: row.quantity ?? null,
    unitPrice: row.unit_price ?? null,
    incoterm: row.incoterm ?? null,
    paymentTerms: row.payment_terms ?? null,
    deliveryTime: row.delivery_time ?? null,
    origin: row.origin ?? null,
    packaging: row.packaging ?? null,
    quoteLanguage: row.quote_language ?? null,
    status: row.status ?? null,
  };
}

export function adaptAgriTradeOffer(
  row: AgriTradeOfferRow,
): KagriAgriTradeOffer {
  return {
    offerId: requiredId(row.id, "agri_trade_offers.id"),
    storageAssetId: cleanId(row.storage_asset_id),
    assetId: cleanId(row.asset_id),
    buyerId: cleanId(row.buyer_id),
    productName: row.product_name ?? null,
    offerQuantity: row.offer_quantity ?? null,
    unit: row.unit ?? null,
    offerPrice: row.offer_price ?? null,
    offerAmount: row.offer_amount ?? null,
    status: row.status ?? null,
  };
}
