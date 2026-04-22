import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { autoPlaceExpo } from "@/lib/expo-auto-placement";

type VendorApplicationRow = {
  id: string;
  application_code?: string | null;
  order_code?: string | null;

  company_name?: string | null;
  representative_name?: string | null;
  ceo_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  email?: string | null;
  contact_phone?: string | null;
  phone?: string | null;

  business_number?: string | null;
  business_address?: string | null;
  address?: string | null;
  biz_type?: string | null;
  business_type?: string | null;
  biz_item?: string | null;
  business_item?: string | null;

  category_primary?: string | null;
  company_intro?: string | null;
  intro?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  brochure_url?: string | null;

  preferred_hall_1?: string | null;
  preferred_hall_2?: string | null;
  preferred_category?: string | null;
  placement_preference?: string | null;
  promotion_preference?: string | null;

  assigned_hall?: string | null;
  assigned_slot_code?: string | null;
  assigned_booth_id?: string | null;

  provisioned_vendor_id?: string | null;
  provisioned_booth_id?: string | null;
};

type ProvisionResult = {
  vendorId: string | null;
  boothId: string | null;
  reused: boolean;
  hallId: string | null;
  slotCode: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown) {
  const v = normalizeString(value);
  return v || null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(base: string) {
  const safeBase = base || "booth";
  const tail = Math.random().toString(36).slice(2, 7);
  return `${safeBase}-${tail}`;
}

function pickCategory(application: VendorApplicationRow) {
  return (
    nullableString(application.preferred_category) ||
    nullableString(application.category_primary) ||
    null
  );
}

function inferHallFromCategory(category: string | null) {
  if (!category) return null;

  if (category === "insect_food" || category === "insect_bio") {
    return "future_insect";
  }

  if (category === "machinery") return "machinery";
  if (category === "smart_farm") return "smart_farm";
  if (category === "eco_friendly") return "eco_friendly";
  if (category === "seed" || category === "seedling") return "seeds_seedlings";

  return "agri_inputs";
}

function pickHall(application: VendorApplicationRow) {
  const category = pickCategory(application);

  return (
    nullableString(application.assigned_hall) ||
    nullableString(application.preferred_hall_1) ||
    nullableString(application.preferred_hall_2) ||
    inferHallFromCategory(category) ||
    null
  );
}

function pickCompanyName(application: VendorApplicationRow) {
  return normalizeString(application.company_name) || "이름없는 업체";
}

function pickRepName(application: VendorApplicationRow) {
  return (
    normalizeString(application.representative_name) ||
    normalizeString(application.ceo_name) ||
    normalizeString(application.contact_name) ||
    ""
  );
}

function pickEmail(application: VendorApplicationRow) {
  return (
    normalizeString(application.contact_email) ||
    normalizeString(application.email) ||
    ""
  );
}

function pickPhone(application: VendorApplicationRow) {
  return (
    normalizeString(application.contact_phone) ||
    normalizeString(application.phone) ||
    ""
  );
}

function pickExpoPromoMeta(application: VendorApplicationRow) {
  const companyName = pickCompanyName(application);
  const intro =
    nullableString(application.company_intro) ||
    nullableString(application.intro) ||
    null;

  const promotionPreference = nullableString(application.promotion_preference);

  return {
    promotionPreference,
    title:
      promotionPreference === "new_product_focus"
        ? `${companyName} 신제품`
        : companyName,
    subtitle:
      promotionPreference === "new_product_focus"
        ? intro || "새롭게 주목할 제품을 확인하세요"
        : intro || "지금 확인하세요",
    imageUrl: null,
    linkUrl: null,
  };
}

async function readApplication(applicationId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("vendor_applications_v2")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (error || !data) {
    throw new Error("신청 데이터를 찾을 수 없습니다.");
  }

  return data as VendorApplicationRow;
}

async function findExistingVendor(application: VendorApplicationRow) {
  const supabase = createSupabaseAdminClient();

  if (application.provisioned_vendor_id) {
    const { data } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", application.provisioned_vendor_id)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  const businessNumber = normalizeString(application.business_number);
  if (businessNumber) {
    const { data } = await supabase
      .from("vendors")
      .select("id")
      .eq("business_number", businessNumber)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  const companyName = pickCompanyName(application);
  if (companyName) {
    const { data } = await supabase
      .from("vendors")
      .select("id")
      .eq("company_name", companyName)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  return null;
}

async function createVendor(application: VendorApplicationRow) {
  const supabase = createSupabaseAdminClient();

  const payload = {
    company_name: pickCompanyName(application),
    representative_name: nullableString(pickRepName(application)),
    contact_name: nullableString(application.contact_name),
    contact_email: nullableString(pickEmail(application)),
    contact_phone: nullableString(pickPhone(application)),
    business_number: nullableString(application.business_number),
    address:
      nullableString(application.business_address) ||
      nullableString(application.address),
    business_type:
      nullableString(application.biz_type) ||
      nullableString(application.business_type),
    business_item:
      nullableString(application.biz_item) ||
      nullableString(application.business_item),
    website_url: nullableString(application.website_url),
    youtube_url: nullableString(application.youtube_url),
    brochure_url: nullableString(application.brochure_url),
    intro:
      nullableString(application.company_intro) ||
      nullableString(application.intro),
    application_id: application.id,
    application_code:
      nullableString(application.application_code) ||
      nullableString(application.order_code),
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("vendors")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "vendor 생성에 실패했습니다.");
  }

  return data.id as string;
}

async function getOrCreateVendor(application: VendorApplicationRow) {
  const existingVendorId = await findExistingVendor(application);
  if (existingVendorId) {
    return { vendorId: existingVendorId, reused: true };
  }

  const vendorId = await createVendor(application);
  return { vendorId, reused: false };
}

async function findExistingBooth(application: VendorApplicationRow) {
  const supabase = createSupabaseAdminClient();

  if (application.assigned_booth_id) {
    const { data } = await supabase
      .from("booths")
      .select("id")
      .eq("id", application.assigned_booth_id)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  if (application.provisioned_booth_id) {
    const { data } = await supabase
      .from("booths")
      .select("id")
      .eq("id", application.provisioned_booth_id)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  const { data } = await supabase
    .from("booths")
    .select("id")
    .eq("application_id", application.id)
    .maybeSingle();

  if (data?.id) return data.id as string;

  return null;
}

async function createBooth(application: VendorApplicationRow, vendorId: string) {
  const supabase = createSupabaseAdminClient();

  const companyName = pickCompanyName(application);
  const hallCode = pickHall(application);
  const categoryPrimary = pickCategory(application);
  const intro =
    nullableString(application.company_intro) ||
    nullableString(application.intro);

  const baseSlug = slugify(companyName || "booth");
  const boothSlug = uniqueSlug(baseSlug);

  const payload = {
    vendor_id: vendorId,
    application_id: application.id,
    application_code:
      nullableString(application.application_code) ||
      nullableString(application.order_code),

    name: companyName,
    title: companyName,
    slug: boothSlug,
    company_name: companyName,
    vendor_name: companyName,

    hall_code: hallCode,
    category_primary: categoryPrimary,
    intro,
    website_url: nullableString(application.website_url),
    youtube_url: nullableString(application.youtube_url),
    brochure_url: nullableString(application.brochure_url),

    status: "live",
    is_active: true,
    is_visible: true,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("booths")
    .insert(payload)
    .select("id, hall_code")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "booth 생성에 실패했습니다.");
  }

  return {
    boothId: data.id as string,
    hallId: (data.hall_code as string | null) ?? hallCode ?? null,
  };
}

async function getOrCreateBooth(
  application: VendorApplicationRow,
  vendorId: string
) {
  const existingBoothId = await findExistingBooth(application);

  if (existingBoothId) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("booths")
      .select("id, hall_code")
      .eq("id", existingBoothId)
      .single();

    return {
      boothId: existingBoothId,
      hallId: (data?.hall_code as string | null) ?? pickHall(application),
      reused: true,
    };
  }

  const created = await createBooth(application, vendorId);

  return {
    boothId: created.boothId,
    hallId: created.hallId,
    reused: false,
  };
}

async function assignRequestedSlot(
  boothId: string,
  application: VendorApplicationRow
) {
  const supabase = createSupabaseAdminClient();

  const requestedSlot = nullableString(application.assigned_slot_code);
  if (!requestedSlot) return null;

  const trySlots = await supabase
    .from("slots")
    .update({
      booth_id: boothId,
      updated_at: new Date().toISOString(),
    })
    .eq("slot_code", requestedSlot)
    .is("booth_id", null)
    .select("slot_code")
    .maybeSingle();

  if (!trySlots.error && trySlots.data?.slot_code) {
    return trySlots.data.slot_code as string;
  }

  const tryHallSlots = await supabase
    .from("hall_booth_slots")
    .update({
      booth_id: boothId,
      updated_at: new Date().toISOString(),
    })
    .eq("slot_code", requestedSlot)
    .is("booth_id", null)
    .select("slot_code")
    .maybeSingle();

  if (!tryHallSlots.error && tryHallSlots.data?.slot_code) {
    return tryHallSlots.data.slot_code as string;
  }

  return null;
}

async function autoAssignFreeSlot(boothId: string, hallCode: string | null) {
  const supabase = createSupabaseAdminClient();
  if (!hallCode) return null;

  const candidatesFromSlots = await supabase
    .from("slots")
    .select("slot_code, hall_code, priority_order")
    .eq("hall_code", hallCode)
    .is("booth_id", null)
    .order("priority_order", { ascending: true })
    .limit(1);

  if (!candidatesFromSlots.error && candidatesFromSlots.data?.[0]?.slot_code) {
    const slotCode = candidatesFromSlots.data[0].slot_code as string;

    const assigned = await supabase
      .from("slots")
      .update({
        booth_id: boothId,
        updated_at: new Date().toISOString(),
      })
      .eq("slot_code", slotCode)
      .is("booth_id", null)
      .select("slot_code")
      .maybeSingle();

    if (!assigned.error && assigned.data?.slot_code) {
      return assigned.data.slot_code as string;
    }
  }

  const candidatesFromHallSlots = await supabase
    .from("hall_booth_slots")
    .select("slot_code, hall_code, priority_order")
    .eq("hall_code", hallCode)
    .is("booth_id", null)
    .order("priority_order", { ascending: true })
    .limit(1);

  if (
    !candidatesFromHallSlots.error &&
    candidatesFromHallSlots.data?.[0]?.slot_code
  ) {
    const slotCode = candidatesFromHallSlots.data[0].slot_code as string;

    const assigned = await supabase
      .from("hall_booth_slots")
      .update({
        booth_id: boothId,
        updated_at: new Date().toISOString(),
      })
      .eq("slot_code", slotCode)
      .is("booth_id", null)
      .select("slot_code")
      .maybeSingle();

    if (!assigned.error && assigned.data?.slot_code) {
      return assigned.data.slot_code as string;
    }
  }

  return null;
}

async function syncApplicationProvisionResult(params: {
  applicationId: string;
  vendorId: string | null;
  boothId: string | null;
  hallId: string | null;
  slotCode: string | null;
}) {
  const supabase = createSupabaseAdminClient();

  const patch: Record<string, unknown> = {
    provisioned_vendor_id: params.vendorId,
    provisioned_booth_id: params.boothId,
    assigned_booth_id: params.boothId,
    assigned_hall: params.hallId,
    assigned_slot_code: params.slotCode,
    booth_progress_status: params.slotCode ? "assigned" : "building",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("vendor_applications_v2")
    .update(patch)
    .eq("id", params.applicationId);

  if (error) {
    throw new Error(error.message || "신청 결과 동기화에 실패했습니다.");
  }
}

export async function provisionVendorAndBooth(
  applicationId: string
): Promise<ProvisionResult> {
  const application = await readApplication(applicationId);

  const vendorResult = await getOrCreateVendor(application);
  const boothResult = await getOrCreateBooth(application, vendorResult.vendorId);

  const finalHallId = boothResult.hallId || pickHall(application);

  let finalSlotCode =
    (await assignRequestedSlot(boothResult.boothId, application)) || null;

  if (!finalSlotCode) {
    finalSlotCode = await autoAssignFreeSlot(boothResult.boothId, finalHallId);
  }

  await syncApplicationProvisionResult({
    applicationId,
    vendorId: vendorResult.vendorId,
    boothId: boothResult.boothId,
    hallId: finalHallId,
    slotCode: finalSlotCode,
  });

  if (boothResult.boothId) {
    const promo = pickExpoPromoMeta(application);

    await autoPlaceExpo(boothResult.boothId, {
      promotionPreference: promo.promotionPreference,
      title: promo.title,
      subtitle: promo.subtitle,
      imageUrl: promo.imageUrl,
      linkUrl: promo.linkUrl,
    });
  }

  return {
    vendorId: vendorResult.vendorId,
    boothId: boothResult.boothId,
    reused: vendorResult.reused || boothResult.reused,
    hallId: finalHallId,
    slotCode: finalSlotCode,
  };
}