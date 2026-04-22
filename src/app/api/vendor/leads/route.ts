import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENDOR_COOKIE = "kagri_vendor_session";

function clean(v: string | null) {
  return (v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(VENDOR_COOKIE)?.value;

    if (!raw) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const session = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    const vendorId = clean(session?.vendor_id || "");

    if (!vendorId) {
      return jsonError("벤더 정보가 없습니다.", 401);
    }

    const url = new URL(req.url);
    const boothId = clean(url.searchParams.get("booth_id"));
    const status = clean(url.searchParams.get("status"));
    const q = clean(url.searchParams.get("q"));

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("booth_leads")
      .select(`
        lead_id,
        booth_id,
        vendor_id,
        hall_id,
        slot_code,
        crop_name,
        area_text,
        issue_type,
        message,
        source_type,
        source_ref_id,
        status,
        priority,
        estimated_amount_krw,
        final_amount_krw,
        commission_rate,
        commission_amount_krw,
        created_at,
        updated_at,
        masked_farmer_name,
        masked_farmer_phone,
        farmer_name,
        farmer_phone,
        farmer_email,
        contact_unlocked,
        accepted_at,
        accepted_by_vendor_id
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (boothId) {
      query = query.eq("booth_id", boothId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (q) {
      query = query.or(
        [
          `crop_name.ilike.%${q}%`,
          `issue_type.ilike.%${q}%`,
          `message.ilike.%${q}%`,
          `source_type.ilike.%${q}%`,
          `area_text.ilike.%${q}%`,
          `masked_farmer_name.ilike.%${q}%`,
          `masked_farmer_phone.ilike.%${q}%`,
          `farmer_name.ilike.%${q}%`,
          `farmer_phone.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      return jsonError(error.message, 500);
    }

    const items = (data || []).map((row: any) => ({
      ...row,
      farmer_name:
        row.contact_unlocked && String(row.accepted_by_vendor_id || "") === vendorId
          ? row.farmer_name
          : row.masked_farmer_name,
      farmer_phone:
        row.contact_unlocked && String(row.accepted_by_vendor_id || "") === vendorId
          ? row.farmer_phone
          : row.masked_farmer_phone,
      farmer_email:
        row.contact_unlocked && String(row.accepted_by_vendor_id || "") === vendorId
          ? row.farmer_email
          : null,
    }));

    return Response.json({
      success: true,
      items,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "리드 조회 오류",
      500
    );
  }
}