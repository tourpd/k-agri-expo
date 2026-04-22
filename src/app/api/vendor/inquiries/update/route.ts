import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  inquiry_id?: string;
  status?: string;
  memo?: string;
};

type InquiryRow = {
  inquiry_id?: string | null;
  status?: string | null;
  contacted_at?: string | null;
  closed_at?: string | null;
  memo?: string | null;
  vendor_memo?: string | null;
  recommended_product_ids?: string[] | null;
  recommended_reason?: string | null;
};

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

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function nullableString(v: unknown) {
  const value = clean(v);
  return value || null;
}

function isAllowedStatus(status: string) {
  return ["new", "contacted", "closed"].includes(status);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const inquiryId = clean(body.inquiry_id);
    const status = clean(body.status);
    const memoRaw = body.memo;

    if (!inquiryId) {
      return jsonError("inquiry_id is required.", 400);
    }

    if (!status && memoRaw === undefined) {
      return jsonError("status or memo is required.", 400);
    }

    if (status && !isAllowedStatus(status)) {
      return jsonError("invalid status. allowed: new, contacted, closed", 400);
    }

    const supabase = createSupabaseAdminClient();

    const { data: currentRow, error: currentError } = await supabase
      .from("expo_inquiries")
      .select(
        `
        inquiry_id,
        status,
        contacted_at,
        closed_at,
        memo,
        vendor_memo,
        recommended_product_ids,
        recommended_reason
        `
      )
      .eq("inquiry_id", inquiryId)
      .maybeSingle<InquiryRow>();

    if (currentError) {
      console.error("[api/vendor/inquiries/update] current row read error:", currentError);
      return jsonError(currentError.message, 500);
    }

    if (!currentRow?.inquiry_id) {
      return jsonError("inquiry not found.", 404);
    }

    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updated_at: now,
    };

    if (status) {
      updateData.status = status;

      if (status === "contacted") {
        updateData.contacted_at = currentRow.contacted_at || now;
        updateData.closed_at = null;
      } else if (status === "closed") {
        updateData.closed_at = now;
        updateData.contacted_at = currentRow.contacted_at || now;
      } else if (status === "new") {
        updateData.contacted_at = null;
        updateData.closed_at = null;
      }
    }

    if (memoRaw !== undefined) {
      const memo = nullableString(memoRaw);
      updateData.memo = memo;
      updateData.vendor_memo = memo;
    }

    const { data, error } = await supabase
      .from("expo_inquiries")
      .update(updateData)
      .eq("inquiry_id", inquiryId)
      .select(
        `
        inquiry_id,
        booth_id,
        farmer_name,
        phone,
        email,
        region,
        crop,
        quantity_text,
        inquiry_type,
        message,
        status,
        source,
        source_type,
        memo,
        vendor_memo,
        contacted_at,
        closed_at,
        updated_at,
        created_at,
        recommended_product_ids,
        recommended_reason
        `
      )
      .single();

    if (error) {
      console.error("[api/vendor/inquiries/update] update error:", error);
      return jsonError(error.message, 500);
    }

    return jsonSuccess({
      item: data,
      notice: "문의 상태가 저장되었습니다.",
    });
  } catch (error) {
    console.error("[api/vendor/inquiries/update] exception:", error);

    return jsonError(
      error instanceof Error ? error.message : "update failed",
      500
    );
  }
}