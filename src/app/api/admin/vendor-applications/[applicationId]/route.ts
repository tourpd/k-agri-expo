import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  autoPlaceExpo,
  removeExpoPlacement,
} from "@/lib/expo-auto-placement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";
type PaymentStatus = "not_required" | "waiting" | "confirmed";
type BoothProgressStatus =
  | "not_started"
  | "assigned"
  | "building"
  | "completed"
  | "failed";

type AdminAction =
  | "start_review"
  | "confirm_payment"
  | "approve"
  | "reject"
  | "save_rejection_reason"
  | "assign_slot"
  | "create_booth"
  | "promote_new_product"
  | "demote_new_product"
  | "promote_hero";

type PatchBody = {
  action?: AdminAction;
  rejection_reason?: string | null;
  assigned_hall?: string | null;
  assigned_slot_code?: string | null;
  booth_name?: string | null;
  booth_slug?: string | null;
  create_booth_payload?: Record<string, unknown> | null;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableTrim(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function slugifyKoreanSafe(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildPromoTitle(application: any) {
  const companyName = safeTrim(application.company_name) || "신제품";
  return `${companyName} 신제품`;
}

function buildPromoSubtitle(application: any) {
  return (
    nullableTrim(application.company_intro) ||
    nullableTrim(application.intro) ||
    "새롭게 주목할 제품을 확인하세요"
  );
}

function buildHeroTitle(application: any) {
  return safeTrim(application.company_name) || "추천 브랜드";
}

function buildHeroSubtitle(application: any) {
  return (
    nullableTrim(application.company_intro) ||
    nullableTrim(application.intro) ||
    "지금 가장 먼저 확인할 업체"
  );
}

function resolveBoothId(booth: any) {
  return booth?.booth_id ?? booth?.id ?? booth?.uuid ?? null;
}

function resolveBoothName(booth: any, fallback: string) {
  return booth?.name ?? booth?.title ?? booth?.booth_name ?? fallback;
}

async function readApplicationOrThrow(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  applicationId: string
) {
  const { data, error } = await supabase
    .from("vendor_applications_v2")
    .select("*")
    .eq("application_id", applicationId)
    .single();

  if (error || !data) {
    throw new Error("신청 데이터를 찾을 수 없습니다.");
  }

  return data;
}

async function updateApplication(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  applicationId: string,
  patch: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("vendor_applications_v2")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("application_id", applicationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "신청 데이터 업데이트에 실패했습니다.");
  }

  return data;
}

async function findOrCreateVendorFromApplication(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  application: any
) {
  if (application.provisioned_vendor_id) {
    return application.provisioned_vendor_id;
  }

  const companyName = safeTrim(application.company_name) || "이름없는 업체";
  const contactName =
    safeTrim(application.contact_name) ||
    safeTrim(application.representative_name) ||
    safeTrim(application.ceo_name) ||
    companyName;

  const phone =
    nullableTrim(application.contact_phone) || nullableTrim(application.phone);

  const email =
    nullableTrim(application.contact_email) || nullableTrim(application.email);

  const intro =
    nullableTrim(application.company_intro) || nullableTrim(application.intro);

  const categoryPrimary =
    nullableTrim(application.preferred_category) ||
    nullableTrim(application.category_primary);

  const region =
    nullableTrim(application.business_address) || nullableTrim(application.address);

  // 1) email로 기존 vendor 찾기
  if (email) {
    const { data: byEmail, error: byEmailError } = await supabase
      .from("vendors")
      .select("vendor_id")
      .eq("email", email)
      .maybeSingle();

    if (!byEmailError && byEmail?.vendor_id) {
      return byEmail.vendor_id;
    }
  }

  // 2) 회사명으로 기존 vendor 찾기
  const { data: byName, error: byNameError } = await supabase
    .from("vendors")
    .select("vendor_id")
    .eq("name", companyName)
    .maybeSingle();

  if (!byNameError && byName?.vendor_id) {
    return byName.vendor_id;
  }

  // 3) 새 vendor 생성
  const vendorPayload: Record<string, unknown> = {
    name: companyName,
    contact_name: contactName,
    phone,
    email,
    intro,
    status: "approved",
    category_primary: categoryPrimary,
    region,
  };

  const { data: createdVendor, error: vendorError } = await supabase
    .from("vendors")
    .insert(vendorPayload)
    .select("vendor_id")
    .single();

  if (vendorError || !createdVendor?.vendor_id) {
    throw new Error(vendorError?.message || "vendors 생성에 실패했습니다.");
  }

  return createdVendor.vendor_id;
}

async function createBoothFromApplication(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  application: any,
  options?: {
    booth_name?: string | null;
    booth_slug?: string | null;
    assigned_hall?: string | null;
    assigned_slot_code?: string | null;
    create_booth_payload?: Record<string, unknown> | null;
  }
) {
  if (application.assigned_booth_id) {
    return {
      booth_id: application.assigned_booth_id,
      booth_name: safeTrim(application.company_name) || "기존 부스",
      already_exists: true,
      vendor_id: application.provisioned_vendor_id || null,
    };
  }

  const vendorId = await findOrCreateVendorFromApplication(supabase, application);

  const companyName = safeTrim(application.company_name);
  const boothName =
    nullableTrim(options?.booth_name) || companyName || "이름없는-부스";

  const intro =
    nullableTrim(application.company_intro) ||
    nullableTrim(application.intro) ||
    null;

  const region =
    nullableTrim(application.business_address) ||
    nullableTrim(application.address) ||
    null;

  const categoryPrimary =
    nullableTrim(application.preferred_category) ||
    nullableTrim(application.category_primary) ||
    null;

  const contactName =
    nullableTrim(application.contact_name) ||
    nullableTrim(application.representative_name) ||
    nullableTrim(application.ceo_name) ||
    null;

  const phone =
    nullableTrim(application.contact_phone) ||
    nullableTrim(application.phone) ||
    null;

  const email =
    nullableTrim(application.contact_email) ||
    nullableTrim(application.email) ||
    null;

  const extraPayload = options?.create_booth_payload ?? {};

  // booths 테이블에서 실제 확인된 최소 안전 컬럼 위주
  const candidatePayloads: Record<string, unknown>[] = [
    {
      vendor_id: vendorId,
      owner_user_id: application.user_id || null,
      name: boothName,
      category_primary: categoryPrimary,
      region,
      contact_name: contactName,
      phone,
      email,
      intro,
      description: intro,
      status: "approved",
      ...extraPayload,
    },
    {
      vendor_id: vendorId,
      name: boothName,
      category_primary: categoryPrimary,
      region,
      contact_name: contactName,
      phone,
      email,
      intro,
      description: intro,
      status: "approved",
    },
    {
      vendor_id: vendorId,
      name: boothName,
      contact_name: contactName,
      phone,
      email,
      status: "approved",
    },
    {
      vendor_id: vendorId,
      name: boothName,
      status: "approved",
    },
    {
      vendor_id: vendorId,
      name: boothName,
    },
  ];

  let lastError: any = null;

  for (const payload of candidatePayloads) {
    const { data: booth, error } = await supabase
      .from("booths")
      .insert(payload)
      .select("*")
      .single();

    if (!error && booth) {
      const boothId = resolveBoothId(booth);
      if (!boothId) {
        lastError = new Error("booths 테이블의 PK 컬럼을 찾지 못했습니다.");
        console.error("[createBoothFromApplication] booth row:", booth);
        continue;
      }

      return {
        booth_id: boothId,
        booth_name: resolveBoothName(booth, boothName),
        booth_slug:
          nullableTrim(options?.booth_slug) ||
          slugifyKoreanSafe(companyName || boothName) ||
          null,
        already_exists: false,
        vendor_id: vendorId,
      };
    }

    lastError = error;
    console.error("[createBoothFromApplication] failed payload:", payload);
    console.error("[createBoothFromApplication] failed error:", error);
  }

  throw new Error(lastError?.message || "부스 생성에 실패했습니다.");
}

async function assignSlotIfPossible(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  params: { slotCode: string; boothId: string }
) {
  const trySlots = await supabase
    .from("slots")
    .update({ booth_id: params.boothId })
    .eq("slot_code", params.slotCode)
    .select("slot_code, booth_id")
    .maybeSingle();

  if (!trySlots.error && trySlots.data) {
    return { table: "slots", data: trySlots.data };
  }

  const tryHallSlots = await supabase
    .from("hall_booth_slots")
    .update({ booth_id: params.boothId })
    .eq("slot_code", params.slotCode)
    .select("slot_code, booth_id")
    .maybeSingle();

  if (!tryHallSlots.error && tryHallSlots.data) {
    return { table: "hall_booth_slots", data: tryHallSlots.data };
  }

  return null;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { applicationId } = await context.params;

    const { data, error } = await supabase
      .from("vendor_applications_v2")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "신청 데이터를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, item: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { applicationId } = await context.params;
    const body = (await req.json()) as PatchBody;

    const action = safeTrim(body.action) as AdminAction;
    if (!action) {
      return NextResponse.json(
        { ok: false, error: "action 값이 필요합니다." },
        { status: 400 }
      );
    }

    const application = await readApplicationOrThrow(supabase, applicationId);
    const nowIso = new Date().toISOString();

    if (action === "start_review") {
      const next = await updateApplication(supabase, applicationId, {
        application_status: "under_review" satisfies ApplicationStatus,
        status: "under_review",
        reviewed_at: application.reviewed_at || nowIso,
      });

      return NextResponse.json(
        { ok: true, message: "검토 시작 처리되었습니다.", item: next },
        { status: 200 }
      );
    }

    if (action === "confirm_payment") {
      const next = await updateApplication(supabase, applicationId, {
        payment_status: "confirmed" satisfies PaymentStatus,
        payment_confirmed: true,
        payment_confirmed_at: nowIso,
      });

      return NextResponse.json(
        { ok: true, message: "입금 확인 처리되었습니다.", item: next },
        { status: 200 }
      );
    }

    if (action === "save_rejection_reason") {
      const next = await updateApplication(supabase, applicationId, {
        rejection_reason: nullableTrim(body.rejection_reason),
      });

      return NextResponse.json(
        { ok: true, message: "반려사유가 저장되었습니다.", item: next },
        { status: 200 }
      );
    }

    if (action === "reject") {
      const next = await updateApplication(supabase, applicationId, {
        application_status: "rejected" satisfies ApplicationStatus,
        status: "rejected",
        rejection_reason: nullableTrim(body.rejection_reason),
        rejected_at: nowIso,
      });

      return NextResponse.json(
        { ok: true, message: "반려 처리되었습니다.", item: next },
        { status: 200 }
      );
    }

    if (action === "assign_slot") {
      const assignedHall =
        nullableTrim(body.assigned_hall) ||
        nullableTrim(application.assigned_hall) ||
        nullableTrim(application.preferred_hall_1);

      const assignedSlotCode = nullableTrim(body.assigned_slot_code);

      if (!assignedHall) {
        return NextResponse.json(
          { ok: false, error: "assigned_hall 값이 필요합니다." },
          { status: 400 }
        );
      }

      if (!assignedSlotCode) {
        return NextResponse.json(
          { ok: false, error: "assigned_slot_code 값이 필요합니다." },
          { status: 400 }
        );
      }

      const next = await updateApplication(supabase, applicationId, {
        assigned_hall: assignedHall,
        assigned_slot_code: assignedSlotCode,
        booth_progress_status: "assigned" satisfies BoothProgressStatus,
      });

      return NextResponse.json(
        { ok: true, message: "슬롯 배정이 저장되었습니다.", item: next },
        { status: 200 }
      );
    }

    if (action === "approve") {
      const currentAmount =
        typeof application.amount_krw === "number"
          ? application.amount_krw
          : typeof application.amount === "number"
          ? application.amount
          : 0;

      const isPaid =
        application.payment_status === "confirmed" ||
        application.payment_confirmed === true;

      if (currentAmount > 0 && !isPaid) {
        return NextResponse.json(
          { ok: false, error: "유료 신청은 입금 확인 후 승인할 수 있습니다." },
          { status: 400 }
        );
      }

      const next = await updateApplication(supabase, applicationId, {
        application_status: "approved" satisfies ApplicationStatus,
        status: "approved",
        approved_at: nowIso,
      });

      return NextResponse.json(
        { ok: true, message: "승인 처리되었습니다.", item: next },
        { status: 200 }
      );
    }

    if (action === "create_booth") {
      if (application.application_status !== "approved") {
        return NextResponse.json(
          { ok: false, error: "부스 생성은 승인된 신청만 가능합니다." },
          { status: 400 }
        );
      }

      const assignedHall =
        nullableTrim(body.assigned_hall) ||
        nullableTrim(application.assigned_hall) ||
        nullableTrim(application.preferred_hall_1);

      const assignedSlotCode =
        nullableTrim(body.assigned_slot_code) ||
        nullableTrim(application.assigned_slot_code);

      const boothResult = await createBoothFromApplication(supabase, application, {
        booth_name: nullableTrim(body.booth_name),
        booth_slug: nullableTrim(body.booth_slug),
        assigned_hall: assignedHall,
        assigned_slot_code: assignedSlotCode,
        create_booth_payload: body.create_booth_payload ?? null,
      });

      const patch: Record<string, unknown> = {
        assigned_booth_id: boothResult.booth_id,
        booth_progress_status: "completed" satisfies BoothProgressStatus,
        provision_status: "completed",
        provisioned_booth_id: boothResult.booth_id,
        provisioned_vendor_id: boothResult.vendor_id,
      };

      if (assignedHall) patch.assigned_hall = assignedHall;
      if (assignedSlotCode) patch.assigned_slot_code = assignedSlotCode;

      const next = await updateApplication(supabase, applicationId, patch);

      let slotAssignment: any = null;
      if (assignedSlotCode && boothResult.booth_id) {
        slotAssignment = await assignSlotIfPossible(supabase, {
          slotCode: assignedSlotCode,
          boothId: boothResult.booth_id,
        });
      }

      if (boothResult.booth_id) {
        try {
          await autoPlaceExpo(boothResult.booth_id, {
            promotionPreference: application.promotion_preference,
            title:
              application.promotion_preference === "new_product"
                ? buildPromoTitle(application)
                : safeTrim(application.company_name) || "신규 입점 업체",
            subtitle: buildPromoSubtitle(application),
          });
        } catch (expoError) {
          console.error("[create_booth] autoPlaceExpo error:", expoError);
        }
      }

      const refreshed = await readApplicationOrThrow(supabase, applicationId);

      return NextResponse.json(
        {
          ok: true,
          message: boothResult.already_exists
            ? "이미 생성된 부스를 연결했습니다."
            : "부스가 생성되었습니다.",
          booth: boothResult,
          slot_assignment: slotAssignment,
          item: refreshed,
        },
        { status: 200 }
      );
    }

    if (action === "promote_new_product") {
      const next = await updateApplication(supabase, applicationId, {
        promotion_preference: "new_product",
      });

      const boothId =
        application.assigned_booth_id ||
        application.provisioned_booth_id ||
        next.assigned_booth_id ||
        null;

      if (!boothId) {
        return NextResponse.json(
          {
            ok: false,
            error: "먼저 부스를 생성한 뒤 신제품 승격을 진행해주세요.",
            item: next,
          },
          { status: 400 }
        );
      }

      await autoPlaceExpo(boothId, {
        slotType: "featured",
        promotionPreference: "new_product",
        title: buildPromoTitle(application),
        subtitle: buildPromoSubtitle(application),
      });

      const refreshed = await readApplicationOrThrow(supabase, applicationId);

      return NextResponse.json(
        {
          ok: true,
          message: "이달의 신제품으로 승격되었습니다.",
          item: refreshed,
        },
        { status: 200 }
      );
    }

    if (action === "demote_new_product") {
      const next = await updateApplication(supabase, applicationId, {
        promotion_preference: "standard",
      });

      const boothId =
        application.assigned_booth_id ||
        application.provisioned_booth_id ||
        next.assigned_booth_id ||
        null;

      if (!boothId) {
        return NextResponse.json(
          {
            ok: false,
            error: "부스가 없어 승격 취소를 반영할 수 없습니다.",
            item: next,
          },
          { status: 400 }
        );
      }

      await removeExpoPlacement(boothId);

      const refreshed = await readApplicationOrThrow(supabase, applicationId);

      return NextResponse.json(
        {
          ok: true,
          message: "신제품 승격이 취소되고 일반 신규 노출로 복귀했습니다.",
          item: refreshed,
        },
        { status: 200 }
      );
    }

    if (action === "promote_hero") {
      const boothId =
        application.assigned_booth_id ||
        application.provisioned_booth_id ||
        null;

      if (!boothId) {
        return NextResponse.json(
          {
            ok: false,
            error: "먼저 부스를 생성한 뒤 히어로 승격을 진행해주세요.",
          },
          { status: 400 }
        );
      }

      await autoPlaceExpo(boothId, {
        slotType: "hero",
        title: buildHeroTitle(application),
        subtitle: buildHeroSubtitle(application),
      });

      const refreshed = await readApplicationOrThrow(supabase, applicationId);

      return NextResponse.json(
        {
          ok: true,
          message: "메인 히어로 영역으로 승격되었습니다.",
          item: refreshed,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "지원하지 않는 action 입니다." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}