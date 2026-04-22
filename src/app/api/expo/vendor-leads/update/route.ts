import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
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
    const nextStatus = safeText(form.get("status")) || "contacted";
    const note = safeText(form.get("note")) || null;

    if (!assignmentId) {
      return NextResponse.json(
        { ok: false, error: "assignment_id가 필요합니다." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["opened", "contacted", "quoted", "won"];
    if (!allowedStatuses.includes(nextStatus)) {
      return NextResponse.json(
        { ok: false, error: "허용되지 않는 status 입니다." },
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
      .select("assignment_id, lead_id, vendor_id, status")
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

    const patch: Record<string, any> = {
      status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === "opened" && !assignment.status) {
      patch.first_opened_at = now;
    }

    if (nextStatus === "opened") {
      patch.first_opened_at = now;
    }

    if (nextStatus === "contacted") {
      patch.first_contacted_at = now;
    }

    if (nextStatus === "quoted") {
      patch.quoted_at = now;
    }

    if (nextStatus === "won") {
      patch.won_at = now;
    }

    const { error: updateError } = await admin
      .from("expo_lead_assignments")
      .update(patch)
      .eq("assignment_id", assignmentId)
      .eq("vendor_id", vendor.id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    const { error: logError } = await admin.from("expo_lead_logs").insert({
      lead_id: assignment.lead_id,
      assignment_id: assignment.assignment_id,
      actor_type: "vendor",
      actor_id: vendor.id,
      action_type: nextStatus,
      note,
      created_at: now,
    });

    if (logError) {
      return NextResponse.json(
        { ok: false, error: logError.message },
        { status: 500 }
      );
    }

    if (nextStatus === "won") {
      const { error: leadUpdateError } = await admin
        .from("expo_consult_leads")
        .update({
          status: "won",
          conversion_status: "won",
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
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "상태 변경 실패" },
      { status: 500 }
    );
  }
}