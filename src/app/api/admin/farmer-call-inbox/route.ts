// src/app/api/admin/farmer-call-inbox/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function phoneOnly(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => safe(x)).filter(Boolean);
}

function buyProbability(analyzed: any) {
  const direct = Number(analyzed.buy_probability);

  if (Number.isFinite(direct) && direct >= 0) {
    return Math.min(100, Math.max(0, direct));
  }

  const repurchase = Number(analyzed.repurchase_score);

  if (Number.isFinite(repurchase) && repurchase >= 0) {
    return Math.min(100, Math.max(0, repurchase));
  }

  return 50;
}

function customerValue(score: number, crop?: string, farmSize?: string) {
  const farmText = safe(farmSize);
  const farmNumber = Number(farmText.replace(/[^0-9]/g, "") || 0);

  if (score >= 80 || farmNumber >= 10000) return "A";
  if (score >= 60 || farmNumber >= 3000) return "B";
  if (score >= 35) return "C";

  return "D";
}

function callPriority(score: number) {
  if (score >= 80) return "긴급";
  if (score >= 60) return "높음";
  if (score >= 35) return "보통";
  return "낮음";
}

function leadType(analyzed: any) {
  const stage = safe(analyzed.stage);
  const purchaseSignal = safe(analyzed.purchase_signal);
  const summary = safe(analyzed.summary);
  const action = safe(analyzed.action);
  const text = `${stage} ${purchaseSignal} ${summary} ${action}`;

  if (text.includes("견적")) return "견적문의";
  if (text.includes("재구매")) return "재구매";
  if (text.includes("구매") || text.includes("주문")) return "구매문의";
  if (text.includes("대체작목")) return "대체작목상담";
  if (text.includes("효과") || text.includes("사용")) return "사용후상담";

  return "신규문의";
}

function makeTags(analyzed: any, matched: boolean) {
  const tags = new Set<string>();

  const crop = safe(analyzed.crop);
  const stage = safe(analyzed.stage);
  const recommendedProduct = safe(analyzed.recommended_product);
  const purchaseSignal = safe(analyzed.purchase_signal);
  const moneySignal = safe(analyzed.money_signal);
  const satisfaction = safe(analyzed.satisfaction);

  if (crop) tags.add(crop);
  if (stage) tags.add(stage);
  if (recommendedProduct) tags.add(recommendedProduct);
  if (purchaseSignal) tags.add(`구매신호-${purchaseSignal}`);
  if (moneySignal) tags.add(`매출가능-${moneySignal}`);
  if (satisfaction) tags.add(`만족도-${satisfaction}`);
  if (matched) tags.add("기존CRM");
  else tags.add("신규리드");

  for (const p of arr(analyzed.interest_products)) tags.add(p);
  for (const p of arr(analyzed.used_products)) tags.add(`사용-${p}`);

  return Array.from(tags).slice(0, 20);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "통화녹음 파일이 없습니다." },
        { status: 400 }
      );
    }

    const forwardForm = new FormData();
    forwardForm.append("file", file);

    const origin = new URL(req.url).origin;

    const transcribeRes = await fetch(`${origin}/api/admin/farmer-transcribe`, {
      method: "POST",
      body: forwardForm,
    });

    const analyzed = await transcribeRes.json();

    if (!analyzed?.success) {
      return NextResponse.json(
        {
          success: false,
          error: analyzed?.error || "AI 상담 분석 실패",
        },
        { status: 500 }
      );
    }

    const detectedPhone = phoneOnly(analyzed.detected_phone);

    let matchedFarmerName = "";
    let matched = false;
    let profileUrl = "";

    if (detectedPhone) {
      const { data: profile } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("phone", detectedPhone)
        .maybeSingle();

      if (profile) {
        matched = true;
        matchedFarmerName = safe(profile.farmer_name);
      }

      if (!matched) {
        const { data: order } = await supabase
          .from("expo_brand_orders")
          .select("*")
          .eq("phone", detectedPhone)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (order) {
          matched = true;
          matchedFarmerName = safe(order.farmer_name);
        }
      }

      profileUrl = `/admin/farmer-crm/${encodeURIComponent(detectedPhone)}`;
    }

    const score = buyProbability(analyzed);
    const crop = safe(analyzed.crop);
    const farmSize = safe(analyzed.farm_size);
    const finalLeadType = leadType(analyzed);
    const finalCustomerValue = customerValue(score, crop, farmSize);
    const finalCallPriority = callPriority(score);
    const tags = makeTags(analyzed, matched);

    const inboxPayload = {
      phone: detectedPhone || null,
      farmer_name: matchedFarmerName || null,

      transcript: safe(analyzed.transcript),

      summary: safe(analyzed.summary),
      crop: crop || null,
      farm_size: farmSize || null,

      lead_type: finalLeadType,
      customer_value: finalCustomerValue,
      buy_probability: score,

      stage: safe(analyzed.stage) || "상담중",
      recommended_product: safe(analyzed.recommended_product) || null,
      next_action: safe(analyzed.action) || null,

      call_priority: finalCallPriority,
      tags,

      matched,
      saved_to_crm: false,

      updated_at: new Date().toISOString(),
    };

    const { data: inboxRow, error: inboxError } = await supabase
      .from("farmer_call_inbox")
      .insert(inboxPayload)
      .select("*")
      .single();

    if (inboxError) {
      return NextResponse.json(
        {
          success: false,
          error: inboxError.message || "AI 상담수신함 저장 실패",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      inbox_id: inboxRow?.id,
      matched,
      matched_farmer_name: matchedFarmerName,
      farmer_name: matchedFarmerName,
      profile_url: profileUrl,

      detected_phone: detectedPhone,
      transcript: analyzed.transcript,

      summary: analyzed.summary,
      stage: analyzed.stage,
      next_contact_at: analyzed.next_contact_at,
      repurchase_score: analyzed.repurchase_score,
      recommended_product: analyzed.recommended_product,
      action: analyzed.action,

      crop: analyzed.crop,
      farm_size: analyzed.farm_size,
      used_products: analyzed.used_products || [],
      interest_products: analyzed.interest_products || [],
      satisfaction: analyzed.satisfaction,
      objections: analyzed.objections || [],
      purchase_signal: analyzed.purchase_signal,
      money_signal: analyzed.money_signal,
      manager_memo: analyzed.manager_memo,

      lead_type: finalLeadType,
      customer_value: finalCustomerValue,
      buy_probability: score,
      call_priority: finalCallPriority,
      tags,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "AI 상담수신함 처리 실패",
      },
      { status: 500 }
    );
  }
}