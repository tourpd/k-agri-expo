import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const supabase = createSupabaseAdminClient();
    const { leadId } = await context.params;

    const { data, error } = await supabase
      .from("lead_activity_logs")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "활동 로그 조회 실패",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabase = createSupabaseAdminClient();
    const { leadId } = await context.params;
    const body = await req.json();

    const activityType = n(body.activity_type) || "note";
    const counterpartyType = n(body.counterparty_type) || null;
    const counterpartyName = n(body.counterparty_name) || null;
    const counterpartyPhone = n(body.counterparty_phone) || null;
    const counterpartyEmail = n(body.counterparty_email) || null;
    const summary = n(body.summary);
    const detail = n(body.detail) || null;
    const nextActionAt = n(body.next_action_at) || null;

    if (!summary) {
      return NextResponse.json(
        { ok: false, error: "summary는 필수입니다." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("lead_activity_logs")
      .insert({
        lead_id: leadId,
        activity_type: activityType,
        counterparty_type: counterpartyType,
        counterparty_name: counterpartyName,
        counterparty_phone: counterpartyPhone,
        counterparty_email: counterpartyEmail,
        summary,
        detail,
        next_action_at: nextActionAt || null,
        created_by: "admin",
        created_at: nowIso,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message || "활동 로그 저장 실패" },
        { status: 500 }
      );
    }

    const leadUpdate: Record<string, unknown> = {
      updated_at: nowIso,
    };

    if (nextActionAt) {
      leadUpdate.next_action_at = nextActionAt;
    }

    if (counterpartyType === "vendor" && activityType === "call") {
      leadUpdate.vendor_last_called_at = nowIso;
      leadUpdate.negotiation_status = "vendor_contacted";
    }

    if (counterpartyType === "buyer" && activityType === "call") {
      leadUpdate.buyer_last_called_at = nowIso;
    }

    await supabase
      .from("deal_leads")
      .update(leadUpdate)
      .eq("id", leadId);

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "활동 로그 저장 실패",
      },
      { status: 500 }
    );
  }
}