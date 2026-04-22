import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const form = await req.formData();

    const assignmentId = safeText(form.get("assignment_id"));
    const productName = safeText(form.get("product_name")) || null;
    const quantity = safeText(form.get("quantity")) || null;
    const quotedAmount = safeNumber(form.get("quoted_amount"));
    const finalAmount = safeNumber(form.get("final_amount"));
    const memo = safeText(form.get("memo")) || null;

    if (!assignmentId) {
      return NextResponse.json(
        { ok: false, error: "assignment_id가 필요합니다." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: vendor, error: vendorError } = await admin
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorError) {
      return NextResponse.json(
        { ok: false, error: vendorError.message },
        { status: 500 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { ok: false, error: "업체 계정이 아닙니다." },
        { status: 403 }
      );
    }

    const { data: assignment, error: assignmentError } = await admin
      .from("expo_lead_assignments")
      .select("assignment_id, lead_id, vendor_id")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (assignmentError) {
      return NextResponse.json(
        { ok: false, error: assignmentError.message },
        { status: 500 }
      );
    }

    if (!assignment || assignment.vendor_id !== vendor.id) {
      return NextResponse.json(
        { ok: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const { error: insertError } = await admin.from("expo_conversions").insert({
      lead_id: assignment.lead_id,
      assignment_id: assignment.assignment_id,
      vendor_id: vendor.id,
      product_name: productName,
      quantity,
      quoted_amount: quotedAmount,
      final_amount: finalAmount,
      status: "won",
      memo,
      won_at: now,
      created_at: now,
    });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    const { error: assignmentUpdateError } = await admin
      .from("expo_lead_assignments")
      .update({
        status: "won",
        won_at: now,
        updated_at: now,
      })
      .eq("assignment_id", assignment.assignment_id)
      .eq("vendor_id", vendor.id);

    if (assignmentUpdateError) {
      return NextResponse.json(
        { ok: false, error: assignmentUpdateError.message },
        { status: 500 }
      );
    }

    const { error: leadUpdateError } = await admin
      .from("expo_consult_leads")
      .update({
        status: "won",
        conversion_status: "won",
        conversion_amount: finalAmount,
        won_at: now,
        updated_at: now,
      })
      .eq("lead_id", assignment.lead_id);

    if (leadUpdateError) {
      return NextResponse.json(
        { ok: false, error: leadUpdateError.message },
        { status: 500 }
      );
    }

    const { error: logError } = await admin.from("expo_lead_logs").insert({
      lead_id: assignment.lead_id,
      assignment_id: assignment.assignment_id,
      actor_type: "vendor",
      actor_id: vendor.id,
      action_type: "conversion_won",
      note: memo || "판매 완료 기록",
      created_at: now,
    });

    if (logError) {
      return NextResponse.json(
        { ok: false, error: logError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "판매 기록 실패" },
      { status: 500 }
    );
  }
}