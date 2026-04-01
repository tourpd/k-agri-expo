import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function calcCommission(finalAmount: number, rate: number) {
  return Math.round(finalAmount * rate);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const admin = await requireAdminUser();
    const { leadId } = await context.params;
    const body = await req.json();

    const action = normalize(body.action);
    const note = normalize(body.note);
    const nextStatus = normalize(body.status);
    const finalAmount = Number(body.final_amount_krw || 0);
    const commissionRate = Number(body.commission_rate || 0);

    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from("booth_leads")
      .select("*")
      .eq("lead_id", leadId)
      .single();

    if (existingError || !existing) {
      return jsonError("상담 건을 찾지 못했습니다.", 404);
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "save_note") {
      updatePayload.memo = note;
    }

    if (action === "change_status") {
      updatePayload.status = nextStatus;

      if (nextStatus === "contacted") {
        updatePayload.first_contacted_at = new Date().toISOString();
      }
      if (nextStatus === "quoted") {
        updatePayload.quoted_at = new Date().toISOString();
      }
      if (nextStatus === "won") {
        updatePayload.won_at = new Date().toISOString();
      }
      if (nextStatus === "lost") {
        updatePayload.lost_at = new Date().toISOString();
      }
      if (nextStatus === "closed") {
        updatePayload.closed_at = new Date().toISOString();
      }
    }

    if (action === "mark_won") {
      updatePayload.status = "won";
      updatePayload.won_at = new Date().toISOString();
      updatePayload.final_amount_krw = finalAmount;
      updatePayload.commission_rate = commissionRate;
      updatePayload.commission_amount_krw = calcCommission(finalAmount, commissionRate);
    }

    const { data, error } = await supabase
      .from("booth_leads")
      .update(updatePayload)
      .eq("lead_id", leadId)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "상담 상태 업데이트 실패", 500);
    }

    await supabase.from("booth_lead_events").insert({
      lead_id: leadId,
      event_type: action || "updated",
      actor_email: admin.email,
      note: note || null,
      old_status: existing.status || null,
      new_status: data.status || null,
    });

    return Response.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "상담 관리 중 오류",
      500
    );
  }
}