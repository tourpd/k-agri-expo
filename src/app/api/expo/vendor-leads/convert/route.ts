import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const assignmentId = safeText(body?.assignment_id);
    const productName = safeText(body?.product_name) || null;
    const quantity = safeText(body?.quantity) || null;
    const quotedAmount = safeNumber(body?.quoted_amount);
    const finalAmount = safeNumber(body?.final_amount);
    const memo = safeText(body?.memo) || null;

    const admin = createSupabaseAdminClient();

    const { data: vendor } = await admin
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json({ ok: false, error: "업체 계정이 아닙니다." }, { status: 403 });
    }

    const { data: assignment } = await admin
      .from("expo_lead_assignments")
      .select("assignment_id, lead_id, vendor_id")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (!assignment || assignment.vendor_id !== vendor.id) {
      return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });
    }

    const { error: insertError } = await admin
      .from("expo_conversions")
      .insert({
        lead_id: assignment.lead_id,
        assignment_id: assignment.assignment_id,
        vendor_id: vendor.id,
        product_name: productName,
        quantity: quantity,
        quoted_amount: quotedAmount,
        final_amount: finalAmount,
        status: "won",
        memo,
        won_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    await admin
      .from("expo_lead_assignments")
      .update({
        status: "won",
        won_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("assignment_id", assignment.assignment_id);

    await admin
      .from("expo_consult_leads")
      .update({
        status: "won",
        conversion_status: "won",
        conversion_amount: finalAmount,
        won_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", assignment.lead_id);

    await admin.from("expo_lead_logs").insert({
      lead_id: assignment.lead_id,
      assignment_id: assignment.assignment_id,
      actor_type: "vendor",
      actor_id: vendor.id,
      action_type: "conversion_won",
      note: memo || "판매 완료 기록",
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "판매 기록 실패" },
      { status: 500 }
    );
  }
}