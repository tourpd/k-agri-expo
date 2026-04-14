import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadStage =
  | "new"
  | "screening"
  | "qualified"
  | "sent"
  | "negotiating"
  | "won"
  | "lost";

const ALLOWED_LEAD_STAGES: LeadStage[] = [
  "new",
  "screening",
  "qualified",
  "sent",
  "negotiating",
  "won",
  "lost",
];

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function isLeadStage(value: string): value is LeadStage {
  return ALLOWED_LEAD_STAGES.includes(value as LeadStage);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { leadId } = await context.params;

    if (!leadId) {
      return jsonError("leadId가 필요합니다.");
    }

    const body = await req.json();

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (existingError || !existing) {
      return jsonError("리드를 찾을 수 없습니다.", 404);
    }

    const nextLeadStage = n(body.lead_stage);
    const nextAdminMemo =
      body.admin_memo !== undefined ? n(body.admin_memo) : undefined;
    const nextTranslatedMessage =
      body.translated_message !== undefined
        ? n(body.translated_message)
        : undefined;

    const nextLastContactedAt =
      body.last_contacted_at !== undefined ? n(body.last_contacted_at) : undefined;

    const nextVendorNotifiedAt =
      body.vendor_notified_at !== undefined ? n(body.vendor_notified_at) : undefined;

    const nextVendorNotificationStatus =
      body.vendor_notification_status !== undefined
        ? n(body.vendor_notification_status)
        : undefined;

    const nextVendorNotificationError =
      body.vendor_notification_error !== undefined
        ? n(body.vendor_notification_error)
        : undefined;

    const nextQuoteStatus =
      body.quote_status !== undefined ? n(body.quote_status) : undefined;

    const nextContractStatus =
      body.contract_status !== undefined ? n(body.contract_status) : undefined;

    if (nextLeadStage && !isLeadStage(nextLeadStage)) {
      return jsonError("유효하지 않은 lead_stage 입니다.");
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nextLeadStage) {
      updatePayload.lead_stage = nextLeadStage;

      if (nextLeadStage === "won" && !existing.closed_at) {
        updatePayload.closed_at = new Date().toISOString();
      }

      if (nextLeadStage === "lost" && !existing.closed_at) {
        updatePayload.closed_at = new Date().toISOString();
      }
    }

    if (nextAdminMemo !== undefined) {
      updatePayload.admin_memo = nextAdminMemo || null;
    }

    if (nextTranslatedMessage !== undefined) {
      updatePayload.translated_message = nextTranslatedMessage || null;
    }

    if (nextLastContactedAt !== undefined) {
      const contactTime = nextLastContactedAt || new Date().toISOString();

      updatePayload.last_contacted_at = contactTime;

      if (!existing.first_contacted_at) {
        updatePayload.first_contacted_at = contactTime;
      }
    }

    if (nextVendorNotifiedAt !== undefined) {
      updatePayload.vendor_notified_at = nextVendorNotifiedAt || null;
    }

    if (nextVendorNotificationStatus !== undefined) {
      updatePayload.vendor_notification_status =
        nextVendorNotificationStatus || "pending";
    }

    if (nextVendorNotificationError !== undefined) {
      updatePayload.vendor_notification_error =
        nextVendorNotificationError || null;
    }

    if (nextQuoteStatus !== undefined) {
      updatePayload.quote_status = nextQuoteStatus || "not_started";

      if (nextQuoteStatus === "sent" && !existing.quote_sent_at) {
        updatePayload.quote_sent_at = new Date().toISOString();
      }
    }

    if (nextContractStatus !== undefined) {
      updatePayload.contract_status = nextContractStatus || "none";

      if (
        nextContractStatus === "contracted" &&
        !existing.contracted_at
      ) {
        updatePayload.contracted_at = new Date().toISOString();
      }

      if (nextContractStatus === "paid" && !existing.paid_at) {
        updatePayload.paid_at = new Date().toISOString();
      }

      if (nextContractStatus === "closed" && !existing.closed_at) {
        updatePayload.closed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("deal_leads")
      .update(updatePayload)
      .eq("id", leadId)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "리드 업데이트 실패", 500);
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      500
    );
  }
}