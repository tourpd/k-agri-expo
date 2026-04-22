import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { analyzeInquiry } from "@/lib/leads/analyze-inquiry";
import { sendAdminHotLeadAlert } from "@/lib/leads/send-admin-hot-lead-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DemandBody = {
  buyer_user_id?: string;
  category_key?: string;
  crop_key?: string;
  sourcing_type?: string;
  target_quantity?: string;
  consultation_channel?: string;
  demand_note?: string;
};

type BuyerProfile = {
  user_id: string;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  is_foreign?: boolean | null;
  buyer_level?: string | null;
  verification_status?: string | null;
};

type VendorCapability = {
  id: string;
  vendor_id: string;
  booth_id?: string | null;
  category_keys?: string[] | null;
  crop_keys?: string[] | null;
  supports_export?: boolean | null;
  supported_languages?: string[] | null;
  min_order_quantity?: string | null;
  max_order_quantity?: string | null;
  shipping_regions?: string[] | null;
  is_featured?: boolean | null;
  response_priority?: number | null;
};

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function parseQuantityScore(targetQuantity: string, minOrder?: string | null, maxOrder?: string | null) {
  const target = n(targetQuantity).toLowerCase();
  if (!target) return 5;

  const hasContainer = /container|컨테이너/.test(target);
  const hasTon = /ton|톤/.test(target);
  const hasKg = /kg|킬로/.test(target);

  const min = n(minOrder).toLowerCase();
  const max = n(maxOrder).toLowerCase();

  let score = 0;

  if (hasContainer && /container|컨테이너/.test(`${min} ${max}`)) score += 10;
  if (hasTon && /ton|톤/.test(`${min} ${max}`)) score += 10;
  if (hasKg && /kg|킬로/.test(`${min} ${max}`)) score += 10;

  if (score === 0) score = 5;

  return score;
}

function computeMatchScore(params: {
  demandCategory: string;
  demandCrop: string;
  targetQuantity: string;
  preferredLanguage: string;
  isForeign: boolean;
  capability: VendorCapability;
}) {
  const {
    demandCategory,
    demandCrop,
    targetQuantity,
    preferredLanguage,
    isForeign,
    capability,
  } = params;

  const categoryKeys = normalizeTextArray(capability.category_keys);
  const cropKeys = normalizeTextArray(capability.crop_keys);
  const supportedLanguages = normalizeTextArray(capability.supported_languages);

  let categoryScore = 0;
  let cropScore = 0;
  let exportScore = 0;
  let languageScore = 0;
  let quantityScore = 0;
  let priorityScore = 0;

  if (demandCategory && categoryKeys.includes(demandCategory)) {
    categoryScore = 30;
  }

  if (demandCrop && cropKeys.includes(demandCrop)) {
    cropScore = 20;
  }

  if (isForeign) {
    exportScore = capability.supports_export ? 20 : 0;
  } else {
    exportScore = 5;
  }

  if (preferredLanguage) {
    if (supportedLanguages.includes(preferredLanguage)) {
      languageScore = 15;
    } else if (supportedLanguages.includes("en") && preferredLanguage !== "ko") {
      languageScore = 10;
    } else if (!preferredLanguage || preferredLanguage === "ko") {
      languageScore = 5;
    }
  }

  quantityScore = parseQuantityScore(
    targetQuantity,
    capability.min_order_quantity,
    capability.max_order_quantity
  );

  if (capability.is_featured) priorityScore += 10;
  priorityScore += Number(capability.response_priority || 0);

  const matchScore =
    categoryScore +
    cropScore +
    exportScore +
    languageScore +
    quantityScore +
    priorityScore;

  const reasons: string[] = [];
  if (categoryScore > 0) reasons.push("카테고리 일치");
  if (cropScore > 0) reasons.push("작물 일치");
  if (exportScore >= 20) reasons.push("해외 대응 가능");
  if (languageScore >= 10) reasons.push("언어 대응 가능");
  if (quantityScore >= 10) reasons.push("요청 물량 대응 가능");
  if (capability.is_featured) reasons.push("추천 우선 업체");
  if (Number(capability.response_priority || 0) > 0) reasons.push("운영 우선순위 반영");

  return {
    matchScore,
    categoryScore,
    cropScore,
    exportScore,
    languageScore,
    quantityScore,
    priorityScore,
    reasoning: reasons.join(", "),
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = (await req.json()) as DemandBody;

    const buyerUserId = n(body.buyer_user_id);
    const categoryKey = n(body.category_key);
    const cropKey = n(body.crop_key);
    const sourcingType = n(body.sourcing_type);
    const targetQuantity = n(body.target_quantity);
    const consultationChannel = n(body.consultation_channel);
    const demandNote = n(body.demand_note);

    if (!buyerUserId) {
      return NextResponse.json(
        { ok: false, error: "buyer_user_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (!categoryKey && !cropKey && !demandNote) {
      return NextResponse.json(
        { ok: false, error: "카테고리, 작물, 요청사항 중 하나 이상은 필요합니다." },
        { status: 400 }
      );
    }

    const { data: buyerProfile, error: buyerError } = await supabase
      .from("buyer_profiles")
      .select("*")
      .eq("user_id", buyerUserId)
      .single();

    if (buyerError || !buyerProfile) {
      return NextResponse.json(
        { ok: false, error: "바이어 프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profile = buyerProfile as BuyerProfile;
    const nowIso = new Date().toISOString();

    const inquirySourceText = [
      demandNote,
      targetQuantity,
      sourcingType,
      categoryKey,
      cropKey,
    ]
      .filter(Boolean)
      .join(" / ");

    const detection = analyzeInquiry(inquirySourceText);

    const { data: demand, error: demandError } = await supabase
      .from("buyer_demands")
      .insert({
        buyer_user_id: buyerUserId,
        category_key: categoryKey || null,
        crop_key: cropKey || null,
        sourcing_type: sourcingType || null,
        target_quantity: targetQuantity || null,
        consultation_channel: consultationChannel || null,
        demand_note: demandNote || null,
        country: profile.country || null,
        preferred_language: profile.preferred_language || null,
        is_foreign: !!profile.is_foreign,
        status: "open",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .single();

    if (demandError || !demand) {
      return NextResponse.json(
        { ok: false, error: demandError?.message || "바이어 수요 저장 실패" },
        { status: 500 }
      );
    }

    const baseLeadScore = 40;
    const leadScore = baseLeadScore + detection.score;
    const priorityRank =
      (profile.is_foreign ? 80 : 50) + detection.score;

    const { data: lead, error: leadError } = await supabase
      .from("deal_leads")
      .insert({
        buyer_user_id: buyerUserId,
        company_name: profile.company_name || null,
        contact_name: profile.contact_name || null,
        phone: profile.phone || null,
        email: profile.email || null,
        source_type: "buyer_demand",
        source_channel: "buyer_dashboard",
        trade_type: sourcingType || null,
        inquiry_language: profile.preferred_language || null,
        country: profile.country || null,
        quantity: targetQuantity || null,
        is_foreign: !!profile.is_foreign,
        message: demandNote || null,
        lead_stage: detection.hotLead ? "screening" : "new",
        status: "new",
        lead_score: leadScore,
        priority_rank: priorityRank,
        buyer_level: profile.buyer_level || "guest",
        buyer_verification_status: profile.verification_status || "none",
        quantity_detected: detection.quantityDetected,
        price_detected: detection.priceDetected,
        hot_lead: detection.hotLead,
        detection_summary: detection.summary,
        created_at: nowIso,
      })
      .select("*")
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { ok: false, error: leadError?.message || "리드 생성 실패" },
        { status: 500 }
      );
    }

    const { data: capabilities, error: capabilityError } = await supabase
      .from("vendor_capabilities")
      .select("*");

    if (capabilityError) {
      return NextResponse.json(
        { ok: false, error: capabilityError.message },
        { status: 500 }
      );
    }

    const scoredMatches = ((capabilities || []) as VendorCapability[])
      .map((capability) => {
        const scores = computeMatchScore({
          demandCategory: categoryKey,
          demandCrop: cropKey,
          targetQuantity,
          preferredLanguage: n(profile.preferred_language),
          isForeign: !!profile.is_foreign,
          capability,
        });

        return {
          capability,
          ...scores,
        };
      })
      .filter((item) => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    if (scoredMatches.length > 0) {
      const rows = scoredMatches.map((item) => ({
        lead_id: lead.id,
        demand_id: demand.id,
        vendor_id: item.capability.vendor_id,
        booth_id: item.capability.booth_id || null,
        match_score: item.matchScore,
        category_score: item.categoryScore,
        crop_score: item.cropScore,
        export_score: item.exportScore,
        language_score: item.languageScore,
        quantity_score: item.quantityScore,
        priority_score: item.priorityScore,
        reasoning: item.reasoning || null,
        match_status: "suggested",
        created_at: nowIso,
      }));

      const { error: matchError } = await supabase
        .from("buyer_matches")
        .insert(rows);

      if (matchError) {
        return NextResponse.json(
          { ok: false, error: matchError.message },
          { status: 500 }
        );
      }
    }

    await supabase.from("lead_activity_logs").insert({
      lead_id: lead.id,
      activity_type: "buyer_demand_created",
      counterparty_type: "buyer",
      counterparty_name: profile.contact_name || profile.company_name || "바이어",
      counterparty_phone: profile.phone || null,
      counterparty_email: profile.email || null,
      summary: detection.hotLead
        ? `바이어 수요 등록으로 HOT 리드 자동 생성 (${detection.summary})`
        : "바이어 수요 등록으로 신규 리드 자동 생성",
      detail: `카테고리: ${categoryKey || "-"} / 작물: ${cropKey || "-"} / 수량: ${targetQuantity || "-"} / 감지결과: ${detection.summary}`,
      created_by: "system",
      created_at: nowIso,
    });

    let adminAlertResult: { ok: boolean; error?: string } | null = null;

    if (detection.hotLead) {
      adminAlertResult = await sendAdminHotLeadAlert({
        leadId: lead.id,
        companyName: profile.company_name || null,
        contactName: profile.contact_name || null,
        email: profile.email || null,
        phone: profile.phone || null,
        country: profile.country || null,
        message: demandNote || null,
        detectionSummary: detection.summary,
        score: detection.score,
      });

      if (adminAlertResult.ok) {
        await supabase
          .from("deal_leads")
          .update({
            admin_alert_sent_at: nowIso,
          })
          .eq("id", lead.id);
      }
    }

    return NextResponse.json({
      ok: true,
      demand_id: demand.id,
      lead_id: lead.id,
      match_count: scoredMatches.length,
      detection: {
        quantity_detected: detection.quantityDetected,
        price_detected: detection.priceDetected,
        hot_lead: detection.hotLead,
        summary: detection.summary,
        score: detection.score,
      },
      admin_alert: adminAlertResult,
      top_matches: scoredMatches.slice(0, 3).map((item) => ({
        vendor_id: item.capability.vendor_id,
        booth_id: item.capability.booth_id || null,
        match_score: item.matchScore,
        reasoning: item.reasoning,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "자동 매칭 생성 실패",
      },
      { status: 500 }
    );
  }
}