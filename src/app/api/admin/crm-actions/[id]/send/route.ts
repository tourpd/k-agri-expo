import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const supabase = createSupabaseAdminClient();

    const { data: action, error: actionError } = await supabase
      .from("crm_recommended_actions")
      .select("*")
      .eq("id", id)
      .single();

    if (actionError || !action) {
      throw new Error(actionError?.message || "추천 액션을 찾을 수 없습니다.");
    }

    const { data: customer } = await supabase
      .from("farmer_assets")
      .select("*")
      .eq("id", action.customer_id)
      .single();

    await supabase
      .from("crm_recommended_actions")
      .update({
        is_completed: true,
        sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    await supabase.from("customer_activity_logs").insert({
      customer_id: action.customer_id,
      customer_name: customer?.name || null,
      phone: customer?.phone || null,
      activity_type: "sms_send",
      activity_title: action.title || "CRM 추천 문자 발송",
      activity_value: action.action_message || "문자발송",
      source_channel: "K-Agri CRM",
      source_page: "/admin/crm",
      memo: `${action.title || ""} 발송 처리`,
    });

    return NextResponse.json({
      ok: true,
      message: "발송 처리 완료",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "발송 처리 실패",
      },
      { status: 500 }
    );
  }
}
