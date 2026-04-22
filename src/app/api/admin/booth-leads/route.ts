import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(value: string | null) {
  return (value || "").trim();
}

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(req.url);
    const status = normalize(searchParams.get("status"));
    const q = normalize(searchParams.get("q"));

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("booth_leads")
      .select(`
        lead_id,
        booth_id,
        vendor_id,
        hall_id,
        slot_code,
        farmer_name,
        farmer_phone,
        farmer_email,
        crop_name,
        area_text,
        issue_type,
        message,
        source_type,
        source_ref_id,
        status,
        priority,
        assigned_to_email,
        first_contacted_at,
        quoted_at,
        won_at,
        lost_at,
        closed_at,
        estimated_amount_krw,
        final_amount_krw,
        commission_rate,
        commission_amount_krw,
        memo,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (q) {
      query = query.or(
        [
          `farmer_name.ilike.%${q}%`,
          `farmer_phone.ilike.%${q}%`,
          `crop_name.ilike.%${q}%`,
          `issue_type.ilike.%${q}%`,
          `message.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data, error } = await query.limit(300);

    if (error) {
      return jsonError(error.message || "상담 목록 조회 실패", 500);
    }

    return Response.json({
      success: true,
      items: data || [],
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "상담 목록 조회 중 오류",
      500
    );
  }
}