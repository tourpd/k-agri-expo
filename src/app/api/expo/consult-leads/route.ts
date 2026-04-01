import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rankVendorsForLead } from "@/lib/expo/lead-assignment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = createSupabaseAdminClient();

    const source = safeText(body?.source) || "expo_consult";
    const source_detail = safeText(body?.source_detail) || null;
    const user_name = safeText(body?.user_name) || null;
    const phone = safeText(body?.phone) || null;
    const region = safeText(body?.region) || null;
    const city = safeText(body?.city) || null;

    const crop = safeText(body?.crop) || null;
    const category = safeText(body?.category) || null;
    const problem_name = safeText(body?.problem_name) || null;
    const urgency_level = safeText(body?.urgency_level) || null;
    const purchase_intent = safeText(body?.purchase_intent) || null;

    const question_text = safeText(body?.question_text);
    const ai_summary = safeText(body?.ai_summary) || null;
    const ai_payload =
      body?.ai_payload && typeof body.ai_payload === "object" ? body.ai_payload : {};

    const is_photo_required = !!body?.is_photo_required;
    const photo_url = safeText(body?.photo_url) || null;

    if (!question_text) {
      return NextResponse.json(
        { ok: false, error: "question_text가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: lead, error: leadError } = await admin
      .from("expo_consult_leads")
      .insert({
        source,
        source_detail,
        user_name,
        phone,
        region,
        city,
        crop,
        category,
        problem_name,
        urgency_level,
        purchase_intent,
        question_text,
        ai_summary,
        ai_payload,
        is_photo_required,
        photo_url,
        status: "new",
      })
      .select()
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { ok: false, error: leadError?.message || "리드 저장 실패" },
        { status: 500 }
      );
    }

    const ranked = await rankVendorsForLead({ region, crop, category }, 3);

    if (ranked.length > 0) {
      const assignmentRows = ranked.map((r) => ({
        lead_id: lead.lead_id,
        vendor_id: r.vendor_id,
        rank_no: r.rank_no,
        match_score: r.match_score,
        sponsor_score: r.sponsor_score,
        performance_score: r.performance_score,
        final_score: r.final_score,
        status: "assigned",
      }));

      const { error: assignmentError } = await admin
        .from("expo_lead_assignments")
        .insert(assignmentRows);

      if (assignmentError) {
        return NextResponse.json(
          { ok: false, error: assignmentError.message },
          { status: 500 }
        );
      }

      await admin
        .from("expo_consult_leads")
        .update({
          assigned_top_vendor_id: ranked[0].vendor_id,
          assigned_vendor_count: ranked.length,
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", lead.lead_id);

      await admin.from("expo_lead_logs").insert({
        lead_id: lead.lead_id,
        actor_type: "system",
        action_type: "auto_assigned",
        note: `자동 배정 ${ranked.length}건`,
      });
    }

    return NextResponse.json({
      ok: true,
      lead_id: lead.lead_id,
      assigned_count: ranked.length,
      top_vendors: ranked,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "서버 오류" },
      { status: 500 }
    );
  }
}