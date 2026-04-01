import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadBody = {
  booth_id?: string | null;
  deal_id?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  campaign?: string | null;
  video_code?: string | null;
  landing_type?: string | null;
  session_id?: string | null;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadBody;

    const booth_id = clean(body.booth_id) || null;
    const deal_id = clean(body.deal_id) || null;
    const name = clean(body.name) || null;
    const phone = clean(body.phone) || null;
    const email = clean(body.email) || null;
    const message = clean(body.message) || null;
    const source = clean(body.source) || "direct";
    const campaign = clean(body.campaign) || null;
    const video_code = clean(body.video_code) || null;
    const landing_type = clean(body.landing_type) || "unknown";
    const session_id = clean(body.session_id) || null;

    if (!booth_id && !deal_id) {
      return NextResponse.json(
        { ok: false, error: "booth_id or deal_id is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 1) session_id가 있으면 기존 익명/반익명 리드 재사용 시도
    if (session_id) {
      let existingQuery = supabase
        .from("deal_leads")
        .select("id, booth_id, deal_id, name, phone, email, message, source, campaign, video_code, landing_type, session_id, status")
        .eq("session_id", session_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (booth_id) {
        existingQuery = existingQuery.eq("booth_id", booth_id);
      }

      if (deal_id) {
        existingQuery = existingQuery.eq("deal_id", deal_id);
      }

      const { data: existingRows, error: existingError } = await existingQuery;

      if (existingError) {
        return NextResponse.json(
          { ok: false, error: existingError.message },
          { status: 500 }
        );
      }

      const existing = existingRows?.[0];

      if (existing?.id) {
        const nextData = {
          booth_id: booth_id ?? existing.booth_id ?? null,
          deal_id: deal_id ?? existing.deal_id ?? null,
          name: name ?? existing.name ?? null,
          phone: phone ?? existing.phone ?? null,
          email: email ?? existing.email ?? null,
          message: message ?? existing.message ?? null,
          source: source ?? existing.source ?? "direct",
          campaign: campaign ?? existing.campaign ?? null,
          video_code: video_code ?? existing.video_code ?? null,
          landing_type: landing_type ?? existing.landing_type ?? "unknown",
          session_id,
        };

        const { data: updated, error: updateError } = await supabase
          .from("deal_leads")
          .update(nextData)
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateError) {
          return NextResponse.json(
            { ok: false, error: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          mode: "updated",
          item: updated,
        });
      }
    }

    // 2) 없으면 신규 생성
    const insertData = {
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
      status: "new",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("deal_leads")
      .insert(insertData)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "inserted",
      item: inserted,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "lead capture failed" },
      { status: 500 }
    );
  }
}