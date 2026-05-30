import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const supabase = createSupabaseAdminClient();

    const payload: Record<string, unknown> = {};

    if (typeof body.sale_status === "string") payload.sale_status = body.sale_status;
    if (typeof body.status === "string") payload.status = body.status;
    if (typeof body.vendor_target === "string") payload.vendor_target = body.vendor_target;
    if (typeof body.priority === "string") payload.priority = body.priority;
    if (typeof body.commission_rate === "number") payload.commission_rate = body.commission_rate;
    if (typeof body.admin_memo === "string") payload.admin_memo = body.admin_memo;

    if (body.mark_contacted) {
      payload.last_contacted_at = new Date().toISOString();
      payload.sale_status = "contacted";
    }

    if (body.assign_dof) {
      payload.vendor_target = "dof";
      payload.sale_status = "sent";
      payload.status = "sent";
      payload.commission_rate = Number(body.commission_rate || 0.3);
    }

    const { data, error } = await supabase
      .from("booth_leads")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "수정 실패" },
      { status: 500 }
    );
  }
}