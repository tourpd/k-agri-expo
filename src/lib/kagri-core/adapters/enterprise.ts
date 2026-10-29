import type { SupabaseClient } from "@supabase/supabase-js";

import { makeEntityRef, makeSourceRef } from "../identity";
import type { KagriAdapterRecord } from "../types";

export type KagriVendor = {
  vendorId: string;
  companyName: string | null;
  status: string | null;
};

export type KagriBooth = {
  boothId: string;
  vendorId: string | null;
  name: string | null;
  hallId: string | null;
  categoryPrimary: string | null;
  region: string | null;
  status: string | null;
};

export type KagriEnterpriseProduct = {
  productId: string;
  boothId: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  priceKrw: number | null;
  priceText: string | null;
  active: boolean | null;
};

type VendorRow = {
  vendor_id?: string | null;
  id?: string | null;
  company_name?: string | null;
  status?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  id?: string | null;
  vendor_id?: string | null;
  name?: string | null;
  hall_id?: string | null;
  category_primary?: string | null;
  region?: string | null;
  status?: string | null;
};

type ProductRow = {
  product_id?: string | null;
  id?: string | null;
  booth_id?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  price_krw?: number | null;
  price_text?: string | null;
  active?: boolean | null;
  is_active?: boolean | null;
};

function requiredId(
  row: { [key: string]: unknown },
  primaryKey: string,
  legacyKey = "id",
): string {
  const primary = row[primaryKey];
  if (typeof primary === "string" && primary) return primary;

  const legacy = row[legacyKey];
  if (typeof legacy === "string" && legacy) return legacy;

  throw new Error(
    `K-AGRI adapter: ${primaryKey}/${legacyKey} 식별자가 없습니다.`,
  );
}

export function adaptVendor(
  row: VendorRow,
): KagriAdapterRecord<KagriVendor> {
  const vendorId = requiredId(
    row as Record<string, unknown>,
    "vendor_id",
  );

  const source = makeSourceRef(
    "expo",
    "vendors",
    vendorId,
  );

  return {
    entity: makeEntityRef(
      "VENDOR",
      source,
      vendorId,
    ),
    data: {
      vendorId,
      companyName: row.company_name ?? null,
      status: row.status ?? null,
    },
  };
}

export function adaptBooth(
  row: BoothRow,
): KagriAdapterRecord<KagriBooth> {
  const boothId = requiredId(
    row as Record<string, unknown>,
    "booth_id",
  );

  const source = makeSourceRef(
    "expo",
    "booths",
    boothId,
  );

  return {
    entity: makeEntityRef(
      "BOOTH",
      source,
      boothId,
    ),
    data: {
      boothId,
      vendorId: row.vendor_id ?? null,
      name: row.name ?? null,
      hallId: row.hall_id ?? null,
      categoryPrimary: row.category_primary ?? null,
      region: row.region ?? null,
      status: row.status ?? null,
    },
  };
}

export function adaptEnterpriseProduct(
  row: ProductRow,
): KagriAdapterRecord<KagriEnterpriseProduct> {
  const productId = requiredId(
    row as Record<string, unknown>,
    "product_id",
  );

  const source = makeSourceRef(
    "expo",
    "products",
    productId,
  );

  return {
    entity: makeEntityRef(
      "PRODUCT",
      source,
      productId,
    ),
    data: {
      productId,
      boothId: row.booth_id ?? null,
      name: row.name ?? null,
      description: row.description ?? null,
      category: row.category ?? null,
      priceKrw: row.price_krw ?? null,
      priceText: row.price_text ?? null,
      active: row.active ?? row.is_active ?? null,
    },
  };
}

export async function getKagriVendor(
  supabase: SupabaseClient,
  vendorId: string,
) {
  const { data, error } = await supabase
    .from("vendors")
    .select("vendor_id,company_name,status")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return adaptVendor(data as VendorRow);
}

export async function getKagriBooth(
  supabase: SupabaseClient,
  boothId: string,
) {
  const { data, error } = await supabase
    .from("booths")
    .select(
      "booth_id,vendor_id,name,hall_id,category_primary,region,status",
    )
    .eq("booth_id", boothId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return adaptBooth(data as BoothRow);
}

export async function getKagriEnterpriseProduct(
  supabase: SupabaseClient,
  productId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "product_id,booth_id,name,description,category,price_krw,price_text,active,is_active",
    )
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return adaptEnterpriseProduct(data as ProductRow);
}

export async function getKagriBoothProducts(
  supabase: SupabaseClient,
  boothId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "product_id,booth_id,name,description,category,price_krw,price_text,active,is_active",
    )
    .eq("booth_id", boothId);

  if (error) throw error;

  return (data ?? []).map((row) =>
    adaptEnterpriseProduct(row as ProductRow),
  );
}
