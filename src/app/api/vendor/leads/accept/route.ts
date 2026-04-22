import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENDOR_COOKIE = "kagri_vendor_session";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getLeadFeeByVendorPlan(planType: string) {
  if (planType === "premium") return 1500;
  if (planType === "enterprise") return 0;
  return 3000;
}

export async function POST(req: Request) {
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
    const vendorEmail = clean(session?.email);

    if (!vendorId) {
      return jsonError("벤더 정보가 없습니다.", 401);
    }

    const body = await req.json();
    const leadId = clean(body?.lead_id);

    if (!leadId) {
      return jsonError("lead_id가 필요합니다.");
    }

    const supabase = createSupabaseAdminClient();

    // 1) 리드 조회
    const { data: lead, error: leadError } = await supabase
      .from("booth_leads")
      .select(`
        lead_id,
        vendor_id,
        booth_id,
        status,
        contact_unlocked,
        accepted_at,
        accepted_by_vendor_id,
        farmer_name,
        farmer_phone,
        farmer_email
      `)
      .eq("lead_id", leadId)
      .single();

    if (leadError || !lead) {
      return jsonError(leadError?.message || "리드를 찾지 못했습니다.", 404);
    }

    if (String(lead.vendor_id || "") !== vendorId) {
      return jsonError("본인 리드만 수락할 수 있습니다.", 403);
    }

    // 2) 이미 공개되었으면 그대로 반환
    if (lead.contact_unlocked) {
      return Response.json({
        success: true,
        item: {
          lead_id: lead.lead_id,
          farmer_name: lead.farmer_name,
          farmer_phone: lead.farmer_phone,
          farmer_email: lead.farmer_email,
          contact_unlocked: true,
          accepted_at: lead.accepted_at,
          accepted_by_vendor_id: lead.accepted_by_vendor_id,
          status: lead.status,
        },
      });
    }

    // 3) 업체 플랜 조회
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_id, company_name, plan_type")
      .eq("vendor_id", vendorId)
      .single();

    if (vendorError || !vendor) {
      return jsonError(vendorError?.message || "벤더 정보를 찾지 못했습니다.", 404);
    }

    const leadFee = getLeadFeeByVendorPlan(String(vendor.plan_type || "basic"));
    const now = new Date().toISOString();
    const nextStatus = lead.status === "new" ? "contacted" : lead.status;

    // 4) 연락처 공개 처리
    const { data: updated, error: updateError } = await supabase
      .from("booth_leads")
      .update({
        contact_unlocked: true,
        accepted_at: now,
        accepted_by_vendor_id: vendorId,
        status: nextStatus,
        updated_at: now,
      })
      .eq("lead_id", leadId)
      .eq("contact_unlocked", false)
      .select(`
        lead_id,
        vendor_id,
        booth_id,
        status,
        contact_unlocked,
        accepted_at,
        accepted_by_vendor_id,
        farmer_name,
        farmer_phone,
        farmer_email
      `)
      .single();

    if (updateError || !updated) {
      return jsonError(updateError?.message || "상담 수락 처리 실패", 500);
    }

    // 5) 리드 이벤트 기록
    try {
      await supabase.from("booth_lead_events").insert({
        lead_id: updated.lead_id,
        event_type: "accepted",
        actor_email: vendorEmail || null,
        old_status: lead.status,
        new_status: updated.status,
        note: "업체가 상담 리드를 수락하여 연락처 공개",
        created_at: now,
      });
    } catch {}

    // 6) 자동 과금 이벤트 생성
    try {
      await supabase.from("vendor_billing_events").insert({
        vendor_id: vendorId,
        lead_id: updated.lead_id,
        event_type: "lead_accept_fee",
        amount_krw: leadFee,
        status: "pending",
        description: `상담 수락 과금 / ${vendor.company_name || "업체"} / lead ${updated.lead_id}`,
        meta: {
          booth_id: updated.booth_id,
          accepted_at: now,
          vendor_plan_type: vendor.plan_type || "basic",
        },
        created_at: now,
      });
    } catch (e) {
      return jsonError("상담 수락은 되었지만 과금 이벤트 생성에 실패했습니다.", 500);
    }

    return Response.json({
      success: true,
      item: {
        lead_id: updated.lead_id,
        farmer_name: updated.farmer_name,
        farmer_phone: updated.farmer_phone,
        farmer_email: updated.farmer_email,
        contact_unlocked: updated.contact_unlocked,
        accepted_at: updated.accepted_at,
        accepted_by_vendor_id: updated.accepted_by_vendor_id,
        status: updated.status,
        lead_fee_krw: leadFee,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "수락 처리 중 오류가 발생했습니다.",
      500
    );
  }
}