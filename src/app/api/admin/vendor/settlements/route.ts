import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENDOR_COOKIE = "kagri_vendor_session";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
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

    let session: any = null;
    try {
      session = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
      return jsonError("로그인 세션이 올바르지 않습니다.", 401);
    }

    const vendorId = clean(session?.vendor_id);
    if (!vendorId) {
      return jsonError("벤더 정보가 없습니다.", 401);
    }

    const url = new URL(req.url);
    const status = clean(url.searchParams.get("status"));
    const q = clean(url.searchParams.get("q"));

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("vendor_billing_events")
      .select(`
        billing_event_id,
        vendor_id,
        lead_id,
        event_type,
        amount_krw,
        status,
        description,
        meta,
        created_at
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (q) {
      query = query.or(
        [
          `event_type.ilike.%${q}%`,
          `description.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data: rows, error } = await query;

    if (error) {
      return jsonError(error.message, 500);
    }

    const summary = {
      total_count: (rows || []).length,
      pending_count: (rows || []).filter((x: any) => x.status === "pending").length,
      paid_count: (rows || []).filter((x: any) => x.status === "paid").length,
      pending_amount_krw: (rows || []).reduce(
        (sum: number, x: any) =>
          sum + (x.status === "pending" ? Number(x.amount_krw || 0) : 0),
        0
      ),
      paid_amount_krw: (rows || []).reduce(
        (sum: number, x: any) =>
          sum + (x.status === "paid" ? Number(x.amount_krw || 0) : 0),
        0
      ),
      total_amount_krw: (rows || []).reduce(
        (sum: number, x: any) => sum + Number(x.amount_krw || 0),
        0
      ),
    };

    return Response.json({
      success: true,
      summary,
      items: rows || [],
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "정산 조회 중 오류",
      500
    );
  }
}