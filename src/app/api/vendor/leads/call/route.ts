// src/app/api/vendor/leads/call/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calcLeadScore, calcPriorityRank } from "@/lib/leadScore";

export const dynamic = "force-dynamic";

type Body = {
  id?: string;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const id = clean(body.id);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: lead, error } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { ok: false, error: error?.message || "lead not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const nextStatus = lead.status === "closed" ? "closed" : "contacted";
    const nextContactedAt =
      nextStatus === "contacted"
        ? lead.contacted_at || now
        : lead.contacted_at || null;

    const nextCallCount = Number(lead.call_count ?? 0) + 1;
    const nextLastCalledAt = now;
    const nextMemo = lead.memo ?? null;

    const score = calcLeadScore({
      source: lead.source,
      landing_type: lead.landing_type,
      message: lead.message,
      phone: lead.phone,
      email: lead.email,
      region: lead.region,
      crop: lead.crop,
      product_id: lead.product_id,
      product_name: lead.product_name,
      status: nextStatus,
      created_at: lead.created_at,
      memo: nextMemo,
      call_count: nextCallCount,
      last_called_at: nextLastCalledAt,
    });

    const priorityRank = calcPriorityRank(score, nextStatus);

    const updatePayload: Record<string, any> = {
      status: nextStatus,
      contacted_at: nextContactedAt,
      call_count: nextCallCount,
      last_called_at: nextLastCalledAt,
      lead_score: score,
      priority_rank: priorityRank,
      updated_at: now,
    };

    const { data: updated, error: updateError } = await supabase
      .from("deal_leads")
      .update(updatePayload)
      .eq("id", id)
      .select(
        `
        id,
        booth_id,
        deal_id,
        name,
        phone,
        email,
        message,
        source,
        campaign,
        video_code,
        landing_type,
        session_id,
        region,
        crop,
        product_id,
        product_name,
        memo,
        status,
        lead_score,
        priority_rank,
        call_count,
        last_called_at,
        contacted_at,
        closed_at,
        updated_at,
        created_at
        `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: updated,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "call failed" },
      { status: 500 }
    );
  }
}