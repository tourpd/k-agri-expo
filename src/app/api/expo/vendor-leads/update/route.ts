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
    const nextStatus = safeText(body?.status);
    const note = safeText(body?.note) || null;

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

    const patch: Record<string, any> = {
      status: nextStatus || "contacted",
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "opened") patch.first_opened_at = new Date().toISOString();
    if (nextStatus === "contacted") patch.first_contacted_at = new Date().toISOString();
    if (nextStatus === "quoted") patch.quoted_at = new Date().toISOString();
    if (nextStatus === "won") patch.won_at = new Date().toISOString();

    const { error } = await admin
      .from("expo_lead_assignments")
      .update(patch)
      .eq("assignment_id", assignmentId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await admin.from("expo_lead_logs").insert({
      lead_id: assignment.lead_id,
      assignment_id: assignment.assignment_id,
      actor_type: "vendor",
      actor_id: vendor.id,
      action_type: nextStatus || "updated",
      note,
    });

    if (nextStatus === "won") {
      await admin
        .from("expo_consult_leads")
        .update({
          status: "won",
          conversion_status: "won",
          won_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", assignment.lead_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "상태 변경 실패" },
      { status: 500 }
    );
  }
}