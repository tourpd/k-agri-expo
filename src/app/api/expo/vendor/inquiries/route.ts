import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function jsonSuccess(data: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      ...data,
    },
    {
      headers: noStoreHeaders(),
    }
  );
}

function clean(v: string | null) {
  return (v ?? "").trim();
}

function escapeLike(value: string) {
  return value.replace(/[\\%_,]/g, (match) => `\\${match}`);
}

function isAllowedStatus(status: string) {
  return ["all", "new", "contacted", "closed"].includes(status);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const boothId = clean(url.searchParams.get("booth_id"));
    const status = clean(url.searchParams.get("status"));
    const q = clean(url.searchParams.get("q"));

    if (status && !isAllowedStatus(status)) {
      return jsonError("invalid status. allowed: all, new, contacted, closed", 400);
    }

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("expo_inquiries")
      .select(
        `
        inquiry_id,
        booth_id,
        vendor_id,
        hall_id,
        slot_code,

        farmer_name,
        phone,
        email,
        region,
        crop,
        quantity_text,
        inquiry_type,
        message,

        source,
        source_type,
        status,

        memo,
        vendor_memo,

        recommended_product_ids,
        recommended_reason,

        contacted_at,
        closed_at,
        updated_at,
        created_at
        `
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (boothId) {
      query = query.eq("booth_id", boothId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (q) {
      const escaped = escapeLike(q);

      query = query.or(
        [
          `inquiry_id.ilike.%${escaped}%`,
          `booth_id.ilike.%${escaped}%`,
          `farmer_name.ilike.%${escaped}%`,
          `phone.ilike.%${escaped}%`,
          `email.ilike.%${escaped}%`,
          `region.ilike.%${escaped}%`,
          `crop.ilike.%${escaped}%`,
          `quantity_text.ilike.%${escaped}%`,
          `inquiry_type.ilike.%${escaped}%`,
          `message.ilike.%${escaped}%`,
          `memo.ilike.%${escaped}%`,
          `vendor_memo.ilike.%${escaped}%`,
          `source.ilike.%${escaped}%`,
          `source_type.ilike.%${escaped}%`,
          `recommended_reason.ilike.%${escaped}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/vendor/inquiries] query error:", error);
      return jsonError(error.message || "failed to load inquiries", 500);
    }

    return jsonSuccess({
      items: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error("[api/vendor/inquiries] exception:", error);

    return jsonError(
      error instanceof Error ? error.message : "failed to load inquiries",
      500
    );
  }
}

export async function POST() {
  return jsonError("POST is not supported.", 405);
}