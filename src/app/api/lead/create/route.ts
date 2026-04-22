import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   유틸
========================= */

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/* =========================
   POST
========================= */

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const supabaseServer = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const body = await req.json();

    const boothId = n(body.booth_id);
    const dealId = n(body.deal_id);

    const message = n(body.message);
    const contactName = n(body.contact_name);
    const phone = n(body.phone);
    const email = n(body.email);

    const sourceType = n(body.source_type) || "booth_inquiry";

    // 외국인/수출 문의 확장 필드
    const country = n(body.country);
    const inquiryLanguage = n(body.language) || "ko";
    const quantity = n(body.quantity);
    const tradeType =
      sourceType === "global_inquiry" || !!country ? "export" : "domestic";
    const isForeign = tradeType === "export";

    if (!boothId && !dealId) {
      return jsonError("booth_id 또는 deal_id 필요");
    }

    if (!message) {
      return jsonError("문의 내용을 입력해주세요");
    }

    /* =========================
       부스 조회
    ========================= */

    let booth: {
      id: string;
      vendor_id?: string | null;
      company_name?: string | null;
      title?: string | null;
      name?: string | null;
    } | null = null;

    if (boothId) {
      const { data, error } = await supabaseAdmin
        .from("booths")
        .select("id, vendor_id, company_name, title, name")
        .eq("id", boothId)
        .single();

      if (error || !data) {
        return jsonError("부스를 찾을 수 없습니다", 404);
      }

      booth = data;
    }

    /* =========================
       바이어 프로필
    ========================= */

    const { data: buyer } = await supabaseAdmin
      .from("buyer_profiles")
      .select("name, company_name, phone, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const finalContactName =
      contactName || buyer?.name || n(user.user_metadata?.name);

    const finalPhone =
      phone || buyer?.phone || n(user.user_metadata?.phone);

    const finalEmail =
      email || buyer?.email || user.email || "";

    const buyerCompany =
      buyer?.company_name || n(user.user_metadata?.company);

    /* =========================
       리드 점수
    ========================= */

    let score = 30;

    if (finalPhone) score += 25;
    if (finalEmail) score += 15;
    if (message.length >= 20) score += 20;
    if (buyerCompany) score += 10;
    if (dealId) score += 15;
    if (sourceType === "expo_deal") score += 10;
    if (isForeign) score += 20;
    if (quantity) score += 10;

    /* =========================
       통제형 CRM 구조
    ========================= */

    const insertPayload = {
      booth_id: booth?.id || boothId || null,
      vendor_id: booth?.vendor_id || null,
      deal_id: dealId || null,

      buyer_user_id: user.id,

      company_name: buyerCompany || null,
      contact_name: finalContactName || null,
      phone: finalPhone || null,
      email: finalEmail || null,

      message,
      translated_message: null,

      source_type: sourceType,
      trade_type: tradeType,
      inquiry_language: inquiryLanguage,
      country: country || null,
      quantity: quantity || null,
      is_foreign: isForeign,

      lead_score: score,
      priority_rank: score,

      // CRM 상태
      lead_stage: "new",
      status: "active",

      // 견적/수출
      quote_status: "not_started",

      // 관리자 운영용
      admin_memo: null,
      first_contacted_at: null,
      last_contacted_at: null,
      closed_at: null,
      vendor_notified_at: null,
      vendor_notification_status: "pending",
      vendor_notification_error: null,

      created_at: new Date().toISOString(),
    };

    const { data: lead, error } = await supabaseAdmin
      .from("deal_leads")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !lead) {
      return jsonError(error?.message || "리드 저장 실패", 500);
    }

    /* =========================
       응답
    ========================= */

    return NextResponse.json({
      ok: true,
      item: lead,
      message: isForeign
        ? "수출 문의가 접수되었습니다. 관리자 검토 후 연결됩니다."
        : "문의가 접수되었습니다. 관리자 검토 후 연결됩니다.",
      booth: booth
        ? {
            id: booth.id,
            name: booth.company_name || booth.title || booth.name || "",
          }
        : null,
      deal_id: dealId || null,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류",
      500
    );
  }
}