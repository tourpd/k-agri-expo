import React from "react";
import { redirect } from "next/navigation";
import BoothEditorClient from "@/app/expo/vendor/booth-editor/BoothEditorClient";
import { requireVendorUser } from "@/lib/vendor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VendorRow = {
  vendor_id?: string | null;
  user_id?: string | null;
  company_name?: string | null;
  approval_status?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;

  name?: string | null;
  title?: string | null;
  intro?: string | null;
  description?: string | null;

  category_primary?: string | null;
  category_secondary?: string | null;

  hall_id?: string | null;
  slot_code?: string | null;

  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;

  website_url?: string | null;
  kakao_url?: string | null;
  open_kakao_url?: string | null;

  logo_url?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  banner_url?: string | null;

  youtube_url?: string | null;
  video_url?: string | null;
  youtube_link?: string | null;

  booth_type?: string | null;
  plan_type?: string | null;

  consult_enabled?: boolean | null;
  kakao_enabled?: boolean | null;
  phone_bridge_enabled?: boolean | null;

  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
  status?: string | null;
};

type ProductRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;

  name?: string | null;
  title?: string | null;
  description?: string | null;

  image_url?: string | null;
  image_file_url?: string | null;
  thumbnail_url?: string | null;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string | null;

  youtube_url?: string | null;

  catalog_url?: string | null;
  catalog_file_url?: string | null;
  catalog_filename?: string | null;

  headline_text?: string | null;
  urgency_text?: string | null;
  cta_text?: string | null;

  point_1?: string | null;
  point_2?: string | null;
  point_3?: string | null;

  is_active?: boolean | null;
  status?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function normalizeHallId(v?: string | null) {
  const hall = safe(v, "");
  if (!hall) return "";

  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";

  return hall;
}

function normalizeSlotCode(v?: string | null) {
  const slot = safe(v, "");
  if (!slot) return "";

  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const matched = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);

  if (!matched) return raw;

  return `${matched[1]}-${matched[2].padStart(2, "0")}`;
}

function toTime(v?: string | null) {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortProducts(rows: ProductRow[]) {
  return [...rows].sort((a, b) => {
    const aOrder =
      typeof a.sort_order === "number" && Number.isFinite(a.sort_order)
        ? a.sort_order
        : 9999;

    const bOrder =
      typeof b.sort_order === "number" && Number.isFinite(b.sort_order)
        ? b.sort_order
        : 9999;

    if (aOrder !== bOrder) return aOrder - bOrder;

    const byCreatedAt = toTime(b.created_at) - toTime(a.created_at);
    if (byCreatedAt !== 0) return byCreatedAt;

    return safe(a.name ?? a.title, "").localeCompare(
      safe(b.name ?? b.title, ""),
      "ko"
    );
  });
}

async function loadVendorByUserId(userId: string): Promise<VendorRow | null> {
  if (!userId) return null;

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("vendors")
      .select("vendor_id,user_id,company_name,approval_status")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[vendor/booth-editor] vendors lookup error:", error);
      return null;
    }

    return (data ?? null) as VendorRow | null;
  } catch (error) {
    console.error("[vendor/booth-editor] loadVendorByUserId exception:", error);
    return null;
  }
}

async function loadBoothForVendor(params: {
  userId: string;
  vendorId: string;
  boothId?: string;
}): Promise<BoothRow | null> {
  const { userId, vendorId, boothId } = params;

  try {
    const supabase = createSupabaseAdminClient();

    if (boothId) {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .eq("booth_id", boothId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as BoothRow;
      }

      if (error) {
        console.error("[vendor/booth-editor] booth by booth_id error:", error);
      }
    }

    if (vendorId) {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .eq("vendor_id", vendorId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as BoothRow;
      }

      if (error) {
        console.error("[vendor/booth-editor] booth by vendor_id error:", error);
      }
    }

    if (userId) {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .eq("vendor_user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as BoothRow;
      }

      if (error) {
        console.error(
          "[vendor/booth-editor] booth by vendor_user_id error:",
          error
        );
      }
    }

    return null;
  } catch (error) {
    console.error("[vendor/booth-editor] loadBoothForVendor exception:", error);
    return null;
  }
}

async function loadProductsForBooth(boothId: string): Promise<ProductRow[]> {
  if (!boothId) return [];

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_products")
      .select("*")
      .eq("booth_id", boothId)
      .order("sort_order", { ascending: true });

    if (!error) {
      return sortProducts(
        ((data ?? []) as ProductRow[]).filter(
          (item) => item.is_active == null || item.is_active === true
        )
      );
    }

    console.error("[vendor/booth-editor] expo_products error:", error);

    const fallback = await supabase
      .from("products")
      .select("*")
      .eq("booth_id", boothId)
      .order("sort_order", { ascending: true });

    if (!fallback.error) {
      return sortProducts(
        ((fallback.data ?? []) as ProductRow[]).filter(
          (item) => item.is_active == null || item.is_active === true
        )
      );
    }

    console.error(
      "[vendor/booth-editor] products fallback error:",
      fallback.error
    );

    return [];
  } catch (error) {
    console.error("[vendor/booth-editor] loadProductsForBooth exception:", error);
    return [];
  }
}

export default async function VendorBoothEditorPage({
  searchParams,
}: {
  searchParams?: Promise<{ booth_id?: string }> | { booth_id?: string };
}) {
  const session = await requireVendorUser();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedBoothId = safe(resolvedSearchParams?.booth_id, "");

  const vendor = await loadVendorByUserId(session.user_id);

  const booth = await loadBoothForVendor({
    userId: session.user_id,
    vendorId: safe(vendor?.vendor_id, ""),
    boothId: requestedBoothId,
  });

  if (!booth) {
    redirect("/vendor");
  }

  const products = await loadProductsForBooth(safe(booth.booth_id, ""));

  const normalizedVendor = {
    user_id: safe(session.user_id, ""),
    vendor_id: safe(vendor?.vendor_id, safe(booth.vendor_id, "")),
    company_name:
      safe(vendor?.company_name, "") ||
      safe(booth.name, "") ||
      safe(booth.title, "") ||
      safe(session.email, ""),
    approval_status: safe(vendor?.approval_status, "승인 대기"),
  };

  const normalizedBooth = {
    booth_id: safe(booth.booth_id, ""),
    vendor_id: safe(booth.vendor_id, safe(vendor?.vendor_id, "")),
    vendor_user_id: safe(booth.vendor_user_id, session.user_id),

    name: safe(booth.name, safe(booth.title, "내 부스")),
    title: safe(booth.title, safe(booth.name, "내 부스")),
    intro: safe(booth.intro, ""),
    description: safe(booth.description, ""),

    category_primary: safe(booth.category_primary, ""),
    category_secondary: safe(booth.category_secondary, ""),

    hall_id: normalizeHallId(booth.hall_id),
    slot_code: normalizeSlotCode(booth.slot_code),

    contact_name: safe(booth.contact_name, ""),
    phone: safe(booth.phone, ""),
    email: safe(booth.email, session.email),

    website_url: safe(booth.website_url, ""),
    kakao_url: safe(booth.kakao_url ?? booth.open_kakao_url, ""),

    logo_url: safe(booth.logo_url, ""),
    thumbnail_url: safe(booth.thumbnail_url, ""),
    cover_image_url: safe(booth.cover_image_url, ""),
    banner_url: safe(booth.banner_url, ""),

    youtube_url:
      safe(booth.youtube_url, "") ||
      safe(booth.video_url, "") ||
      safe(booth.youtube_link, ""),

    booth_type: safe(booth.booth_type, "general"),
    plan_type: safe(booth.plan_type, "basic"),

    consult_enabled: booth.consult_enabled !== false,
    kakao_enabled: booth.kakao_enabled !== false,
    phone_bridge_enabled: booth.phone_bridge_enabled !== false,

    is_public: booth.is_public === true,
    is_active: booth.is_active !== false,
    is_published: booth.is_published === true,
    status: safe(booth.status, "draft"),
  };

  const normalizedProducts = products.map((item) => ({
    id: item.id ?? item.product_id ?? undefined,
    product_id: item.product_id ?? item.id ?? undefined,
    booth_id: safe(item.booth_id, normalizedBooth.booth_id),

    name: safe(item.name, safe(item.title, "")),
    title: safe(item.title, safe(item.name, "")),
    description: safe(item.description, ""),

    image_url: safe(item.image_url, ""),
    image_file_url: safe(item.image_file_url, ""),
    thumbnail_url: safe(item.thumbnail_url, ""),

    price_krw:
      typeof item.price_krw === "number" ? item.price_krw : null,
    sale_price_krw:
      typeof item.sale_price_krw === "number" ? item.sale_price_krw : null,
    price_text: safe(item.price_text, ""),

    youtube_url: safe(item.youtube_url, ""),

    catalog_url: safe(item.catalog_url, ""),
    catalog_file_url: safe(item.catalog_file_url, ""),
    catalog_filename: safe(item.catalog_filename, ""),

    headline_text: safe(item.headline_text, ""),
    urgency_text: safe(item.urgency_text, ""),
    cta_text: safe(item.cta_text, ""),

    point_1: safe(item.point_1, ""),
    point_2: safe(item.point_2, ""),
    point_3: safe(item.point_3, ""),

    is_active: item.is_active !== false,
    status: safe(item.status, ""),
    sort_order:
      typeof item.sort_order === "number" ? item.sort_order : null,
  }));

  return (
    <BoothEditorClient
      vendor={normalizedVendor}
      booth={normalizedBooth}
      initialProducts={normalizedProducts}
    />
  );
}