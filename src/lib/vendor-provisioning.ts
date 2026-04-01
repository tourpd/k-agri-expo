import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { allocateBoothSlot } from "@/lib/booth-slot-allocator";
import {
  DEFAULT_BOOTH_COVER_URL,
  DEFAULT_BOOTH_LOGO_URL,
} from "@/lib/booth-default-images";

type VendorApplicationRow = {
  application_id: string;
  application_code: string | null;
  company_name: string | null;
  representative_name: string | null;
  email: string | null;
  phone: string | null;
  tax_email: string | null;
  business_number: string | null;
  business_address: string | null;
  category_primary: string | null;
  company_intro: string | null;
  website_url: string | null;
  youtube_url: string | null;
  booth_type: string | null;
  provision_status: string | null;
  provision_result: string | null;
  provisioned_vendor_id: string | null;
  provisioned_booth_id: string | null;
};

type ExistingBoothRow = {
  booth_id: string;
  hall_id: string | null;
  slot_code: string | null;
};

function normalize(value: string | null | undefined) {
  return (value || "").trim();
}

function mapPlanType(boothType: string) {
  if (boothType === "premium") return "premium";
  if (boothType === "basic") return "basic";
  return "basic";
}

function mapTier(boothType: string) {
  if (boothType === "premium") return "premium";
  return "basic";
}

function mapCompanyType(boothType: string) {
  if (boothType === "premium") return "premium";
  return "general";
}

function mapFeatured(boothType: string) {
  return boothType === "premium";
}

function mapSponsorWeight(boothType: string) {
  if (boothType === "premium") return 100;
  if (boothType === "basic") return 30;
  return 0;
}

function mapSponsorSortOrder(boothType: string) {
  if (boothType === "premium") return 10;
  if (boothType === "basic") return 200;
  return 999;
}

function mapManualBoost(boothType: string) {
  if (boothType === "premium") return 30;
  if (boothType === "basic") return 5;
  return 0;
}

function normalizeBoothTypeForSlot(
  value: string
): "free" | "basic" | "premium" {
  if (value === "premium") return "premium";
  if (value === "basic") return "basic";
  return "free";
}

async function findExistingVendorIdByCompanyOrEmail(params: {
  companyName: string;
  email: string;
}) {
  const supabase = getSupabaseAdmin();

  if (params.companyName) {
    const { data, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("company_name", params.companyName)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "기존 vendor 조회 중 오류가 발생했습니다.");
    }

    if (data?.id) return data.id;
  }

  if (params.email) {
    const { data, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("email", params.email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "기존 vendor 조회 중 오류가 발생했습니다.");
    }

    if (data?.id) return data.id;
  }

  return null;
}

async function findExistingBooth(params: {
  vendorId: string;
  boothName: string;
}) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("booths")
    .select("booth_id, hall_id, slot_code")
    .eq("vendor_id", params.vendorId)
    .eq("name", params.boothName)
    .maybeSingle<ExistingBoothRow>();

  if (error) {
    throw new Error(error.message || "기존 booth 조회 중 오류가 발생했습니다.");
  }

  return data || null;
}

export async function provisionVendorAndBooth(applicationId: string) {
  const supabase = getSupabaseAdmin();

  const { data: app, error: appError } = await supabase
    .from("vendor_applications_v2")
    .select(`
      application_id,
      application_code,
      company_name,
      representative_name,
      email,
      phone,
      tax_email,
      business_number,
      business_address,
      category_primary,
      company_intro,
      website_url,
      youtube_url,
      booth_type,
      provision_status,
      provision_result,
      provisioned_vendor_id,
      provisioned_booth_id
    `)
    .eq("application_id", applicationId)
    .single<VendorApplicationRow>();

  if (appError || !app) {
    throw new Error(appError?.message || "신청 정보를 찾지 못했습니다.");
  }

  if (app.provisioned_vendor_id && app.provisioned_booth_id) {
    return {
      vendorId: app.provisioned_vendor_id,
      boothId: app.provisioned_booth_id,
      reused: true,
    };
  }

  const nowIso = new Date().toISOString();

  const companyName = normalize(app.company_name);
  const representativeName = normalize(app.representative_name);
  const email = normalize(app.tax_email) || normalize(app.email);
  const phone = normalize(app.phone);
  const categoryPrimary = normalize(app.category_primary);
  const companyIntro = normalize(app.company_intro);
  const businessAddress = normalize(app.business_address);
  const websiteUrl = normalize(app.website_url);
  const youtubeUrl = normalize(app.youtube_url);
  const boothType = normalize(app.booth_type);
  const slotBoothType = normalizeBoothTypeForSlot(boothType);
  const boothName = companyName || app.application_code || "새 벤더 부스";

  let vendorId = app.provisioned_vendor_id || null;
  let boothId = app.provisioned_booth_id || null;

  let finalHallId: string | null = null;
  let finalSlotCode: string | null = null;

  // 1) vendor 생성 또는 재사용
  if (!vendorId) {
    const existingVendorId = await findExistingVendorIdByCompanyOrEmail({
      companyName,
      email,
    });

    if (existingVendorId) {
      vendorId = existingVendorId;

      const { error: updateVendorError } = await supabase
        .from("vendors")
        .update({
          email: email || null,
          company_name: companyName || null,
          contact_name: representativeName || null,
          tier: mapTier(boothType),
          plan_type: mapPlanType(boothType),
          verify_status: "approved",
          status: "active",
          approved_at: nowIso,
        })
        .eq("id", vendorId);

      if (updateVendorError) {
        throw new Error(
          updateVendorError.message || "vendor 갱신 중 오류가 발생했습니다."
        );
      }
    } else {
      const { data: insertedVendor, error: insertVendorError } = await supabase
        .from("vendors")
        .insert({
          user_id: null,
          email: email || null,
          company_name: companyName || null,
          contact_name: representativeName || null,
          tier: mapTier(boothType),
          plan_type: mapPlanType(boothType),
          verify_status: "approved",
          approved_at: nowIso,
          approved_by: null,
          status: "active",
        })
        .select("id")
        .single();

      if (insertVendorError || !insertedVendor) {
        throw new Error(
          insertVendorError?.message || "vendor 생성 중 오류가 발생했습니다."
        );
      }

      vendorId = insertedVendor.id;
    }
  }

  // 2) booth 생성 또는 재사용
  if (!boothId) {
    const existingBooth = await findExistingBooth({
      vendorId,
      boothName,
    });

    if (existingBooth?.booth_id) {
      boothId = existingBooth.booth_id;

      if (!existingBooth.hall_id || !existingBooth.slot_code) {
        const allocatedSlot = await allocateBoothSlot(slotBoothType);
        finalHallId = allocatedSlot.hallId;
        finalSlotCode = allocatedSlot.slotCode;
      } else {
        finalHallId = existingBooth.hall_id;
        finalSlotCode = existingBooth.slot_code;
      }

      const { error: updateBoothError } = await supabase
        .from("booths")
        .update({
          name: boothName,
          category_primary: categoryPrimary || null,
          region: businessAddress || null,
          contact_name: representativeName || null,
          phone: phone || null,
          email: email || null,
          intro: companyIntro || null,
          description: companyIntro || null,
          status: "approved",
          vendor_id: vendorId,
          owner_user_id: null,
          vendor_user_id: null,
          website_url: websiteUrl || null,
          youtube_url: youtubeUrl || null,
          company_type: mapCompanyType(boothType),
          hall_id: finalHallId,
          slot_code: finalSlotCode,
          is_public: true,
          is_active: true,
          is_published: true,
          is_verified: true,
          is_featured: mapFeatured(boothType),
          sponsor_weight: mapSponsorWeight(boothType),
          sponsor_sort_order: mapSponsorSortOrder(boothType),
          manual_boost: mapManualBoost(boothType),
          cover_image_url: DEFAULT_BOOTH_COVER_URL,
          logo_image_url: DEFAULT_BOOTH_LOGO_URL,
          updated_at: nowIso,
        })
        .eq("booth_id", boothId);

      if (updateBoothError) {
        throw new Error(
          updateBoothError.message || "booth 갱신 중 오류가 발생했습니다."
        );
      }
    } else {
      const allocatedSlot = await allocateBoothSlot(slotBoothType);
      finalHallId = allocatedSlot.hallId;
      finalSlotCode = allocatedSlot.slotCode;

      const { data: insertedBooth, error: insertBoothError } = await supabase
        .from("booths")
        .insert({
          owner_user_id: null,
          vendor_user_id: null,
          vendor_id: vendorId,
          name: boothName,
          category_primary: categoryPrimary || null,
          region: businessAddress || null,
          contact_name: representativeName || null,
          phone: phone || null,
          email: email || null,
          intro: companyIntro || null,
          description: companyIntro || null,
          status: "approved",
          is_published: true,
          website_url: websiteUrl || null,
          youtube_url: youtubeUrl || null,
          company_type: mapCompanyType(boothType),
          is_verified: true,
          hall_id: finalHallId,
          slot_code: finalSlotCode,
          is_public: true,
          is_active: true,
          is_featured: mapFeatured(boothType),
          sponsor_weight: mapSponsorWeight(boothType),
          sponsor_sort_order: mapSponsorSortOrder(boothType),
          manual_boost: mapManualBoost(boothType),
          cover_image_url: DEFAULT_BOOTH_COVER_URL,
          logo_image_url: DEFAULT_BOOTH_LOGO_URL,
          updated_at: nowIso,
        })
        .select("booth_id")
        .single();

      if (insertBoothError || !insertedBooth) {
        throw new Error(
          insertBoothError?.message || "booth 생성 중 오류가 발생했습니다."
        );
      }

      boothId = insertedBooth.booth_id;
    }
  } else {
    const { data: existingProvisionedBooth, error: provisionedBoothError } =
      await supabase
        .from("booths")
        .select("booth_id, hall_id, slot_code")
        .eq("booth_id", boothId)
        .maybeSingle<ExistingBoothRow>();

    if (provisionedBoothError) {
      throw new Error(
        provisionedBoothError.message ||
          "기존 provisioned booth 조회 중 오류가 발생했습니다."
      );
    }

    if (!existingProvisionedBooth) {
      throw new Error("연결된 booth를 찾지 못했습니다.");
    }

    if (!existingProvisionedBooth.hall_id || !existingProvisionedBooth.slot_code) {
      const allocatedSlot = await allocateBoothSlot(slotBoothType);
      finalHallId = allocatedSlot.hallId;
      finalSlotCode = allocatedSlot.slotCode;
    } else {
      finalHallId = existingProvisionedBooth.hall_id;
      finalSlotCode = existingProvisionedBooth.slot_code;
    }

    const { error: updateBoothError } = await supabase
      .from("booths")
      .update({
        name: boothName,
        category_primary: categoryPrimary || null,
        region: businessAddress || null,
        contact_name: representativeName || null,
        phone: phone || null,
        email: email || null,
        intro: companyIntro || null,
        description: companyIntro || null,
        status: "approved",
        vendor_id: vendorId,
        owner_user_id: null,
        vendor_user_id: null,
        website_url: websiteUrl || null,
        youtube_url: youtubeUrl || null,
        company_type: mapCompanyType(boothType),
        hall_id: finalHallId,
        slot_code: finalSlotCode,
        is_public: true,
        is_active: true,
        is_published: true,
        is_verified: true,
        is_featured: mapFeatured(boothType),
        sponsor_weight: mapSponsorWeight(boothType),
        sponsor_sort_order: mapSponsorSortOrder(boothType),
        manual_boost: mapManualBoost(boothType),
        cover_image_url: DEFAULT_BOOTH_COVER_URL,
        logo_image_url: DEFAULT_BOOTH_LOGO_URL,
        updated_at: nowIso,
      })
      .eq("booth_id", boothId);

    if (updateBoothError) {
      throw new Error(
        updateBoothError.message ||
          "기존 provisioned booth 갱신 중 오류가 발생했습니다."
      );
    }
  }

  const resultMessage =
    finalHallId && finalSlotCode
      ? `vendor/booth 자동 생성 완료 (${finalHallId} / ${finalSlotCode})`
      : "vendor/booth 자동 생성 완료";

  const { error: updateAppError } = await supabase
    .from("vendor_applications_v2")
    .update({
      provision_status: "completed",
      provision_result: resultMessage,
      provisioned_vendor_id: vendorId,
      provisioned_booth_id: boothId,
      updated_at: nowIso,
    })
    .eq("application_id", applicationId);

  if (updateAppError) {
    throw new Error(
      updateAppError.message || "신청건 provision 결과 저장 중 오류가 발생했습니다."
    );
  }

  return {
    vendorId,
    boothId,
    reused: false,
    hallId: finalHallId,
    slotCode: finalSlotCode,
  };
} 