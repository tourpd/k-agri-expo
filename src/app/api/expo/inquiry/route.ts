// src/app/api/expo/inquiry/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { calcLeadScore, calcPriorityRank } from "@/lib/leadScore";

export const dynamic = "force-dynamic";

type Body = {
  booth_id?: string;
  farmer_name?: string;
  phone?: string;
  email?: string;
  message?: string;
  source?: string;
  session_id?: string;
  campaign?: string;
  video_code?: string;
  landing_type?: string;
  region?: string;
  crop?: string;
  product_id?: string;
  product_name?: string;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

async function strengthenLead(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  booth_id: string;
  farmer_name: string;
  phone: string;
  email: string | null;
  message: string;
  source: string;
  session_id: string | null;
  campaign: string | null;
  video_code: string | null;
  landing_type: string | null;
  region: string | null;
  crop: string | null;
  product_id: string | null;
  product_name: string | null;
}) {
  const {
    supabase,
    booth_id,
    farmer_name,
    phone,
    email,
    message,
    source,
    session_id,
    campaign,
    video_code,
    landing_type,
    region,
    crop,
    product_id,
    product_name,
  } = params;

  const now = new Date().toISOString();
  let existing: any = null;

  // 1차: session_id + booth_id
  if (session_id) {
    const { data, error } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("booth_id", booth_id)
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    existing = data?.[0] ?? null;
  }

  // 2차: phone + booth_id
  if (!existing && phone) {
    const { data, error } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("booth_id", booth_id)
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    existing = data?.[0] ?? null;
  }

  // 이미 closed면 유지, 아니면 문의 유입은 contacted로 강화
  const nextStatus = existing?.status === "closed" ? "closed" : "contacted";

  const nextCallCount = Number(existing?.call_count ?? 0);
  const nextLastCalledAt = existing?.last_called_at ?? null;
  const nextMemo = existing?.memo ?? null;
  const nextCreatedAt = existing?.created_at || now;
  const nextContactedAt =
    nextStatus === "contacted"
      ? existing?.contacted_at ?? now
      : existing?.contacted_at ?? null;

  const score = calcLeadScore({
    source,
    landing_type: landing_type || "booth",
    message,
    phone,
    email,
    region,
    crop,
    product_id,
    product_name,
    status: nextStatus,
    created_at: nextCreatedAt,
    memo: nextMemo,
    call_count: nextCallCount,
    last_called_at: nextLastCalledAt,
  });

  const priorityRank = calcPriorityRank(score, nextStatus);

  const basePayload = {
    booth_id,
    name: farmer_name,
    phone,
    email,
    message,
    source,
    status: nextStatus,
    session_id,
    campaign,
    video_code,
    landing_type: landing_type || "booth",
    region,
    crop,
    product_id,
    product_name,
    memo: nextMemo,
    lead_score: score,
    priority_rank: priorityRank,
    call_count: nextCallCount,
    last_called_at: nextLastCalledAt,
    updated_at: now,
  };

  if (existing?.id) {
    const updatePayload: Record<string, any> = {
      ...basePayload,
    };

    if (nextStatus === "contacted" && !existing.contacted_at) {
      updatePayload.contacted_at = now;
    }

    const { data, error } = await supabase
      .from("deal_leads")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;

    return {
      mode: "updated",
      item: data,
    };
  }

  const insertPayload: Record<string, any> = {
    ...basePayload,
    created_at: now,
    contacted_at: nextStatus === "contacted" ? now : null,
  };

  const { data, error } = await supabase
    .from("deal_leads")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;

  return {
    mode: "inserted",
    item: data,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const booth_id = clean(body.booth_id);
    const farmer_name = clean(body.farmer_name);
    const phone = clean(body.phone);
    const email = clean(body.email) || null;
    const message = clean(body.message);
    const source = clean(body.source) || "direct";

    const session_id = clean(body.session_id) || null;
    const campaign = clean(body.campaign) || null;
    const video_code = clean(body.video_code) || null;
    const landing_type = clean(body.landing_type) || "booth";
    const region = clean(body.region) || null;
    const crop = clean(body.crop) || null;
    const product_id = clean(body.product_id) || null;
    const product_name = clean(body.product_name) || null;

    if (!booth_id) {
      return NextResponse.json(
        { ok: false, error: "booth_id required" },
        { status: 400 }
      );
    }

    if (!farmer_name) {
      return NextResponse.json(
        { ok: false, error: "farmer_name required" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "phone required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "message required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 문의 테이블 저장
    const inquiryPayload = {
      booth_id,
      farmer_name,
      phone,
      email,
      message,
      status: "new",
      source,
      contact_channel: "form",
      session_id,
      name: farmer_name,
      buyer_contact: farmer_name,
      buyer_phone: phone,
      buyer_email: email,
      region,
      crop,
      product_id,
      product_name,
      booth_name: null,
      updated_at: new Date().toISOString(),
    };

    const { data: inquiry, error: inquiryError } = await supabase
      .from("expo_inquiries")
      .insert(inquiryPayload)
      .select("*")
      .single();

    if (inquiryError) {
      return NextResponse.json(
        { ok: false, error: inquiryError.message },
        { status: 500 }
      );
    }

    let leadResult: any = null;

    try {
      leadResult = await strengthenLead({
        supabase,
        booth_id,
        farmer_name,
        phone,
        email,
        message,
        source,
        session_id,
        campaign,
        video_code,
        landing_type,
        region,
        crop,
        product_id,
        product_name,
      });
    } catch (leadError: any) {
      console.error("[expo/inquiry] lead strengthen failed:", leadError);
      leadResult = {
        mode: "failed",
        error: leadError?.message || "lead strengthen failed",
      };
    }

    // 카카오 알림은 실패해도 전체 저장은 성공 처리
    try {
      const origin = new URL(req.url).origin;

      await fetch(`${origin}/api/notifications/kakao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_code: "expo_inquiry",
          to: phone,
          variables: {
            farmer_name,
            booth_id,
          },
        }),
      });
    } catch (e) {
      console.error("[expo/inquiry] kakao notify error:", e);
    }

    return NextResponse.json({
      ok: true,
      item: inquiry,
      lead: leadResult,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "inquiry failed" },
      { status: 500 }
    );
  }
}