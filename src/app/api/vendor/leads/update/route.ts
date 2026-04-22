// src/app/api/vendor/leads/update/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calcLeadScore, calcPriorityRank } from "@/lib/leadScore";

export const dynamic = "force-dynamic";

type Body = {
  id?: string;
  status?: string;
  memo?: string;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function isAllowedStatus(status: string) {
  return ["new", "contacted", "closed"].includes(status);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const id = clean(body.id);
    const status = clean(body.status);
    const memoRaw = body.memo;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required." },
        { status: 400 }
      );
    }

    if (!status && memoRaw === undefined) {
      return NextResponse.json(
        { ok: false, error: "status or memo is required." },
        { status: 400 }
      );
    }

    if (status && !isAllowedStatus(status)) {
      return NextResponse.json(
        { ok: false, error: "invalid status. allowed: new, contacted, closed" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: current, error: currentError } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError || !current) {
      return NextResponse.json(
        { ok: false, error: currentError?.message || "lead not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const nextStatus = status || current.status || "new";
    const nextMemo =
      memoRaw !== undefined ? clean(memoRaw) || null : current.memo ?? null;

    const nextContactedAt =
      nextStatus === "contacted"
        ? current.contacted_at || now
        : nextStatus === "new"
        ? null
        : current.contacted_at || now;

    const nextClosedAt =
      nextStatus === "closed"
        ? now
        : nextStatus === "new"
        ? null
        : current.closed_at ?? null;

    const score = calcLeadScore({
      source: current.source,
      landing_type: current.landing_type,
      message: current.message,
      phone: current.phone,
      email: current.email,
      region: current.region,
      crop: current.crop,
      product_id: current.product_id,
      product_name: current.product_name,
      status: nextStatus,
      created_at: current.created_at,
      memo: nextMemo,
      call_count: current.call_count,
      last_called_at: current.last_called_at,
    });

    const priorityRank = calcPriorityRank(score, nextStatus);

    const updateData: Record<string, any> = {
      updated_at: now,
      lead_score: score,
      priority_rank: priorityRank,
      memo: nextMemo,
      status: nextStatus,
      contacted_at: nextContactedAt,
      closed_at: nextClosedAt,
    };

    const { data, error } = await supabase
      .from("deal_leads")
      .update(updateData)
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

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "update failed" },
      { status: 500 }
    );
  }
}