import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canAccessBooth, canAccessVendorRow, getVendorScope, scopeDenied } from "@/lib/security/vendor-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string | null) {
  return (v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  try {
    // 서명 없는 쿠키 대신 실제 로그인으로 확인 (관리자는 전체)
    const scope = await getVendorScope();
    if (!scope) return jsonError("로그인이 필요합니다.", 401);

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
      .order("created_at", { ascending: false })
      .limit(300);

    if (!scope.isAdmin) {
      if (boothId && !canAccessBooth(scope, boothId)) {
        return jsonError("본인 부스의 리드만 볼 수 있습니다.", 403);
      }
      // 검색(q)에서 or()를 쓰므로 여기서는 in()으로만 거릅니다.
      query = scope.vendorIds.length
        ? query.in("vendor_id", scope.vendorIds)
        : query.in("booth_id", scope.boothIds);
    }

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

    const isMine = (row: any) =>
      scope.isAdmin || scope.vendorIds.includes(String(row.accepted_by_vendor_id || ""));

    const items = (data || []).map((row: any) => ({
      ...row,
      farmer_name:
        row.contact_unlocked && isMine(row)
          ? row.farmer_name
          : row.masked_farmer_name,
      farmer_phone:
        row.contact_unlocked && isMine(row)
          ? row.farmer_phone
          : row.masked_farmer_phone,
      farmer_email:
        row.contact_unlocked && isMine(row)
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