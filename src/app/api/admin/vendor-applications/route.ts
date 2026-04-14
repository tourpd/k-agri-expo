import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const ALLOWED_APPLICATION_STATUS: ApplicationStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
];

const ALLOWED_PAYMENT_STATUS: PaymentStatus[] = [
  "not_required",
  "waiting",
  "confirmed",
];

const ALLOWED_BOOTH_PROGRESS_STATUS: BoothProgressStatus[] = [
  "not_started",
  "assigned",
  "building",
  "completed",
  "failed",
];

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSupabaseAdmin() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function parseBoolean(value: string | null) {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return ALLOWED_APPLICATION_STATUS.includes(value as ApplicationStatus);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return ALLOWED_PAYMENT_STATUS.includes(value as PaymentStatus);
}

function isBoothProgressStatus(value: string): value is BoothProgressStatus {
  return ALLOWED_BOOTH_PROGRESS_STATUS.includes(value as BoothProgressStatus);
}

function buildIlikePattern(keyword: string) {
  return `%${keyword.replace(/\s+/g, "%")}%`;
}

function mapApplicationStatus(row: any): ApplicationStatus {
  const status =
    safeTrim(row?.application_status) || safeTrim(row?.status) || "pending";

  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "under_review") return "under_review";
  return "pending";
}

function mapPaymentStatus(row: any): PaymentStatus {
  const direct = safeTrim(row?.payment_status);

  if (direct === "not_required") return "not_required";
  if (direct === "confirmed") return "confirmed";
  if (direct === "waiting") return "waiting";

  const amount = typeof row?.amount_krw === "number" ? row.amount_krw : 0;

  if (amount === 0) return "not_required";
  if (row?.payment_confirmed === true) return "confirmed";
  return "waiting";
}

function mapBoothProgressStatus(row: any): BoothProgressStatus {
  const direct = safeTrim(row?.booth_progress_status);

  if (
    direct === "not_started" ||
    direct === "assigned" ||
    direct === "building" ||
    direct === "completed" ||
    direct === "failed"
  ) {
    return direct;
  }

  const provisionStatus = safeTrim(row?.provision_status);

  if (provisionStatus === "completed") return "completed";
  if (provisionStatus === "processing") return "building";
  if (provisionStatus === "failed") return "failed";
  if (provisionStatus === "rejected") return "failed";

  if (
    row?.assigned_slot_code ||
    row?.assigned_booth_id ||
    row?.provisioned_booth_id
  ) {
    return "assigned";
  }

  return "not_started";
}

function matchesApplicationStatus(row: any, expected: ApplicationStatus) {
  return mapApplicationStatus(row) === expected;
}

function matchesPaymentStatus(row: any, expected: PaymentStatus) {
  return mapPaymentStatus(row) === expected;
}

function matchesBoothProgressStatus(row: any, expected: BoothProgressStatus) {
  return mapBoothProgressStatus(row) === expected;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);

    const q = safeTrim(searchParams.get("q"));
    const applicationStatus = safeTrim(searchParams.get("application_status"));
    const paymentStatus = safeTrim(searchParams.get("payment_status"));
    const boothProgressStatus = safeTrim(
      searchParams.get("booth_progress_status")
    );
    const preferredHall = safeTrim(searchParams.get("preferred_hall"));
    const preferredCategory = safeTrim(searchParams.get("preferred_category"));
    const assignedOnly = parseBoolean(searchParams.get("assigned_only"));
    const unassignedOnly = parseBoolean(searchParams.get("unassigned_only"));

    const page = Math.max(1, safeInt(searchParams.get("page"), 1));
    const pageSize = Math.min(
      100,
      Math.max(1, safeInt(searchParams.get("page_size"), 20))
    );

    let query = supabase
      .from("vendor_applications_v2")
      .select(
        `
        application_id,
        user_id,
        application_code,
        order_code,

        booth_type,
        duration_key,
        duration_months,
        amount_krw,
        product_code,
        plan_code,

        company_name,
        representative_name,
        ceo_name,
        contact_name,
        email,
        contact_email,
        phone,
        contact_phone,
        tax_email,
        business_number,
        open_date,
        business_address,
        address,
        biz_type,
        business_type,
        biz_item,
        business_item,

        category_primary,
        company_intro,
        intro,
        website_url,
        youtube_url,
        brochure_url,

        source_file_name,
        source_file_mime,
        source_extracted_json,

        business_license_bucket,
        business_license_path,
        business_license_url,

        preferred_hall_1,
        preferred_hall_2,
        preferred_category,
        placement_preference,
        promotion_preference,
        hall_preference,
        position_preference,
        exposure_preference,

        status,
        application_status,
        payment_status,
        booth_progress_status,

        admin_note,
        rejection_reason,

        payment_confirmed,
        payment_confirmed_at,
        payment_confirmed_by_email,

        approved_at,
        approved_by_email,

        rejected_at,
        rejected_by_email,

        reviewed_at,

        provision_status,
        provision_result,
        provisioned_vendor_id,
        provisioned_booth_id,
        provisioned_at,

        assigned_hall,
        assigned_slot_code,
        assigned_booth_id,

        created_at,
        updated_at
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (q) {
      const pattern = buildIlikePattern(q);
      query = query.or(
        [
          `company_name.ilike.${pattern}`,
          `representative_name.ilike.${pattern}`,
          `ceo_name.ilike.${pattern}`,
          `contact_name.ilike.${pattern}`,
          `email.ilike.${pattern}`,
          `contact_email.ilike.${pattern}`,
          `phone.ilike.${pattern}`,
          `contact_phone.ilike.${pattern}`,
          `business_number.ilike.${pattern}`,
          `application_code.ilike.${pattern}`,
          `order_code.ilike.${pattern}`,
          `category_primary.ilike.${pattern}`,
          `preferred_category.ilike.${pattern}`,
          `booth_type.ilike.${pattern}`,
        ].join(",")
      );
    }

    if (preferredHall) {
      query = query.or(
        [
          `preferred_hall_1.eq.${preferredHall}`,
          `preferred_hall_2.eq.${preferredHall}`,
          `assigned_hall.eq.${preferredHall}`,
        ].join(",")
      );
    }

    if (preferredCategory) {
      query = query.or(
        [
          `preferred_category.eq.${preferredCategory}`,
          `category_primary.eq.${preferredCategory}`,
        ].join(",")
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/vendor-applications] list error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "신청 목록 조회에 실패했습니다.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    let rows = data ?? [];

    if (applicationStatus && isApplicationStatus(applicationStatus)) {
      rows = rows.filter((row) =>
        matchesApplicationStatus(row, applicationStatus)
      );
    }

    if (paymentStatus && isPaymentStatus(paymentStatus)) {
      rows = rows.filter((row) => matchesPaymentStatus(row, paymentStatus));
    }

    if (boothProgressStatus && isBoothProgressStatus(boothProgressStatus)) {
      rows = rows.filter((row) =>
        matchesBoothProgressStatus(row, boothProgressStatus)
      );
    }

    if (assignedOnly) {
      rows = rows.filter(
        (row) =>
          !!row?.assigned_booth_id ||
          !!row?.assigned_slot_code ||
          !!row?.assigned_hall ||
          !!row?.provisioned_booth_id ||
          !!row?.provisioned_vendor_id
      );
    }

    if (unassignedOnly) {
      rows = rows.filter(
        (row) =>
          !row?.assigned_booth_id &&
          !row?.assigned_slot_code &&
          !row?.assigned_hall &&
          !row?.provisioned_booth_id &&
          !row?.provisioned_vendor_id
      );
    }

    const total = rows.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const pagedRows = rows.slice(from, to);

    const items = pagedRows.map((row) => {
      const displayAmount =
        typeof row.amount_krw === "number" ? row.amount_krw : 0;

      const mappedApplicationStatus = mapApplicationStatus(row);
      const mappedPaymentStatus = mapPaymentStatus(row);
      const mappedBoothProgressStatus = mapBoothProgressStatus(row);

      return {
        id: row.application_id,

        application_id: row.application_id,
        application_code: row.application_code || "",
        order_code: row.order_code || row.application_code || "",

        company_name: row.company_name || "",
        representative_name: row.representative_name || "",
        ceo_name: row.ceo_name || "",
        contact_name: row.contact_name || "",
        contact_email: row.contact_email || row.email || "",
        email: row.email || "",
        contact_phone: row.contact_phone || row.phone || "",
        phone: row.phone || "",
        business_number: row.business_number || "",

        booth_type: row.booth_type || "",
        duration_key: row.duration_key || "",
        duration_months: row.duration_months ?? null,
        amount_krw: displayAmount,
        product_code: row.product_code || "",
        plan_code: row.plan_code || "",

        category_primary: row.category_primary || "",
        preferred_hall_1: row.preferred_hall_1 || "",
        preferred_hall_2: row.preferred_hall_2 || "",
        preferred_category: row.preferred_category || row.category_primary || "",
        placement_preference:
          row.placement_preference || row.position_preference || "",
        promotion_preference:
          row.promotion_preference || row.exposure_preference || "",

        business_license_url: row.business_license_url || "",
        business_license_bucket: row.business_license_bucket || "",
        business_license_path: row.business_license_path || "",
        source_file_name: row.source_file_name || "",
        source_file_mime: row.source_file_mime || "",

        application_status: mappedApplicationStatus,
        payment_status: mappedPaymentStatus,
        booth_progress_status: mappedBoothProgressStatus,

        assigned_hall: row.assigned_hall || "",
        assigned_slot_code: row.assigned_slot_code || "",
        assigned_booth_id:
          row.assigned_booth_id || row.provisioned_booth_id || "",

        rejection_reason: row.rejection_reason || "",

        reviewed_at: row.reviewed_at,
        approved_at: row.approved_at,
        rejected_at: row.rejected_at,
        payment_confirmed_at: row.payment_confirmed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,

        detail: {
          application_id: row.application_id,
          user_id: row.user_id,

          booth_type: row.booth_type || "",
          duration_key: row.duration_key || "",
          duration_months: row.duration_months ?? null,
          amount_krw: displayAmount,
          product_code: row.product_code || "",
          plan_code: row.plan_code || "",

          company_name: row.company_name || "",
          representative_name: row.representative_name || "",
          ceo_name: row.ceo_name || "",
          contact_name: row.contact_name || "",
          email: row.email || "",
          contact_email: row.contact_email || row.email || "",
          phone: row.phone || "",
          contact_phone: row.contact_phone || row.phone || "",
          tax_email: row.tax_email || "",
          business_number: row.business_number || "",
          open_date: row.open_date || "",
          business_address: row.business_address || row.address || "",
          address: row.address || row.business_address || "",
          biz_type: row.biz_type || row.business_type || "",
          business_type: row.business_type || row.biz_type || "",
          biz_item: row.biz_item || row.business_item || "",
          business_item: row.business_item || row.biz_item || "",

          category_primary: row.category_primary || "",
          company_intro: row.company_intro || row.intro || "",
          intro: row.intro || row.company_intro || "",
          website_url: row.website_url || "",
          youtube_url: row.youtube_url || "",
          brochure_url: row.brochure_url || "",

          preferred_hall_1: row.preferred_hall_1 || "",
          preferred_hall_2: row.preferred_hall_2 || "",
          preferred_category:
            row.preferred_category || row.category_primary || "",
          placement_preference:
            row.placement_preference || row.position_preference || "",
          promotion_preference:
            row.promotion_preference || row.exposure_preference || "",

          source_file_name: row.source_file_name || "",
          source_file_mime: row.source_file_mime || "",
          source_extracted_json: row.source_extracted_json || null,

          business_license_bucket: row.business_license_bucket || "",
          business_license_path: row.business_license_path || "",
          business_license_url: row.business_license_url || "",

          application_status: mappedApplicationStatus,
          payment_status: mappedPaymentStatus,
          booth_progress_status: mappedBoothProgressStatus,

          assigned_hall: row.assigned_hall || "",
          assigned_slot_code: row.assigned_slot_code || "",
          assigned_booth_id:
            row.assigned_booth_id || row.provisioned_booth_id || "",

          rejection_reason: row.rejection_reason || "",

          status: row.status || "",
          admin_note: row.admin_note || "",
          payment_confirmed: row.payment_confirmed || false,
          payment_confirmed_by_email: row.payment_confirmed_by_email || "",
          approved_by_email: row.approved_by_email || "",
          rejected_by_email: row.rejected_by_email || "",
          provision_status: row.provision_status || "",
          provision_result: row.provision_result || "",
          provisioned_vendor_id: row.provisioned_vendor_id || "",
          provisioned_booth_id: row.provisioned_booth_id || "",
          provisioned_at: row.provisioned_at || null,

          reviewed_at: row.reviewed_at,
          approved_at: row.approved_at,
          rejected_at: row.rejected_at,
          payment_confirmed_at: row.payment_confirmed_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
    });

    return NextResponse.json(
      {
        ok: true,
        items,
        pagination: {
          page,
          page_size: pageSize,
          total,
          total_pages: total ? Math.ceil(total / pageSize) : 0,
          raw_total_from_db: count ?? total,
        },
        filters: {
          q,
          application_status: applicationStatus || null,
          payment_status: paymentStatus || null,
          booth_progress_status: boothProgressStatus || null,
          preferred_hall: preferredHall || null,
          preferred_category: preferredCategory || null,
          assigned_only: assignedOnly,
          unassigned_only: unassignedOnly,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[admin/vendor-applications] unexpected error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}