import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BoothPermissionRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
};

type VendorRow = {
  vendor_id?: string | null;
  user_id?: string | null;
  company_name?: string | null;
};

type BoothUpdatePayload = {
  booth_id?: string;

  name?: string;
  title?: string;
  intro?: string;
  description?: string;

  category_primary?: string;
  category_secondary?: string;

  contact_name?: string;
  phone?: string;
  email?: string;

  website_url?: string;
  kakao_url?: string;

  logo_url?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  banner_url?: string;

  youtube_url?: string;

  hall_id?: string;
  slot_code?: string;

  booth_type?: string;
  plan_type?: string;

  consult_enabled?: boolean;
  kakao_enabled?: boolean;
  phone_bridge_enabled?: boolean;

  is_public?: boolean;
  is_active?: boolean;
  is_published?: boolean;

  status?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

function cleanString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullableString(v: unknown): string | null {
  const value = cleanString(v);
  return value ? value : null;
}

function cleanBoolean(
  v: unknown,
  options?: {
    defaultValue?: boolean;
    falseOnly?: boolean;
  }
): boolean {
  const defaultValue = options?.defaultValue ?? false;
  const falseOnly = options?.falseOnly ?? false;

  if (typeof v === "boolean") {
    return v;
  }

  if (falseOnly) {
    return defaultValue;
  }

  return defaultValue;
}

function normalizeHallId(v: unknown): string | null {
  const value = cleanString(v);
  if (!value) return null;

  if (value === "agri_inputs") return "agri-inputs";
  if (value === "smart_farm") return "smartfarm";
  if (value === "eco_friendly") return "eco-friendly";
  if (value === "future_insect") return "future-insect";

  return value;
}

function normalizeSlotCode(v: unknown): string | null {
  const value = cleanString(v);
  if (!value) return null;

  const raw = value.toUpperCase().replace(/\s+/g, "");
  const match = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);

  if (!match) return raw;

  return `${match[1]}-${match[2].padStart(2, "0")}`;
}

function normalizeEmail(v: unknown): string | null {
  const value = cleanString(v).toLowerCase();
  return value || null;
}

function normalizeUrl(v: unknown): string | null {
  const value = cleanString(v);
  return value || null;
}

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[api/vendor/booth/update] auth.getUser error:", error);
      return null;
    }

    return user?.id ?? null;
  } catch (error) {
    console.error("[api/vendor/booth/update] getAuthenticatedUserId exception:", error);
    return null;
  }
}

async function getBoothForPermissionCheck(
  boothId: string
): Promise<BoothPermissionRow | null> {
  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("booths")
      .select("booth_id, vendor_id, vendor_user_id")
      .eq("booth_id", boothId)
      .maybeSingle<BoothPermissionRow>();

    if (error) {
      console.error("[api/vendor/booth/update] booth permission lookup error:", error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("[api/vendor/booth/update] getBoothForPermissionCheck exception:", error);
    return null;
  }
}

async function getVendorByVendorId(vendorId: string): Promise<VendorRow | null> {
  if (!vendorId) return null;

  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("vendors")
      .select("vendor_id, user_id, company_name")
      .eq("vendor_id", vendorId)
      .maybeSingle<VendorRow>();

    if (error) {
      console.error("[api/vendor/booth/update] vendor lookup by vendor_id error:", error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("[api/vendor/booth/update] getVendorByVendorId exception:", error);
    return null;
  }
}

async function hasBoothEditPermission(
  boothId: string,
  userId: string
): Promise<boolean> {
  const booth = await getBoothForPermissionCheck(boothId);

  if (!booth?.booth_id) {
    return false;
  }

  if (booth.vendor_user_id && booth.vendor_user_id === userId) {
    return true;
  }

  if (booth.vendor_id) {
    const vendor = await getVendorByVendorId(booth.vendor_id);
    if (vendor?.user_id && vendor.user_id === userId) {
      return true;
    }
  }

  return false;
}

function buildUpdateData(body: BoothUpdatePayload) {
  return {
    name: cleanNullableString(body.name),
    title: cleanNullableString(body.title),
    intro: cleanNullableString(body.intro),
    description: cleanNullableString(body.description),

    category_primary: cleanNullableString(body.category_primary),
    category_secondary: cleanNullableString(body.category_secondary),

    contact_name: cleanNullableString(body.contact_name),
    phone: cleanNullableString(body.phone),
    email: normalizeEmail(body.email),

    website_url: normalizeUrl(body.website_url),
    kakao_url: normalizeUrl(body.kakao_url),

    logo_url: normalizeUrl(body.logo_url),
    thumbnail_url: normalizeUrl(body.thumbnail_url),
    cover_image_url: normalizeUrl(body.cover_image_url),
    banner_url: normalizeUrl(body.banner_url),

    youtube_url: normalizeUrl(body.youtube_url),

    hall_id: normalizeHallId(body.hall_id),
    slot_code: normalizeSlotCode(body.slot_code),

    booth_type: cleanNullableString(body.booth_type),
    plan_type: cleanNullableString(body.plan_type),

    consult_enabled: cleanBoolean(body.consult_enabled, {
      defaultValue: true,
      falseOnly: true,
    }),
    kakao_enabled: cleanBoolean(body.kakao_enabled, {
      defaultValue: true,
      falseOnly: true,
    }),
    phone_bridge_enabled: cleanBoolean(body.phone_bridge_enabled, {
      defaultValue: true,
      falseOnly: true,
    }),

    is_public: cleanBoolean(body.is_public, {
      defaultValue: false,
    }),
    is_active: cleanBoolean(body.is_active, {
      defaultValue: true,
      falseOnly: true,
    }),
    is_published: cleanBoolean(body.is_published, {
      defaultValue: false,
    }),

    status: cleanNullableString(body.status),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as BoothUpdatePayload;

    const boothId = cleanString(body.booth_id);

    if (!boothId) {
      return jsonResponse(
        {
          success: false,
          error: "booth_id가 필요합니다.",
        },
        400
      );
    }

    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return jsonResponse(
        {
          success: false,
          error: "로그인이 필요합니다.",
        },
        401
      );
    }

    const allowed = await hasBoothEditPermission(boothId, userId);

    if (!allowed) {
      return jsonResponse(
        {
          success: false,
          error: "이 부스를 수정할 권한이 없습니다.",
        },
        403
      );
    }

    const updateData = buildUpdateData(body);

    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("booths")
      .update(updateData)
      .eq("booth_id", boothId)
      .select("*")
      .single();

    if (error) {
      console.error("[api/vendor/booth/update] update error:", error);

      return jsonResponse(
        {
          success: false,
          error: error.message || "부스 저장 중 오류가 발생했습니다.",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      message: "부스 정보가 저장되었습니다.",
      item: data,
    });
  } catch (error) {
    console.error("[api/vendor/booth/update] exception:", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "부스 업데이트에 실패했습니다.",
      },
      500
    );
  }
}