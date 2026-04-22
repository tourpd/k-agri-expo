import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadBody = {
  booth_id?: string | null;
  product_id?: string | null;
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

  region?: string | null;
  crop?: string | null;
  company_name?: string | null;
  lead_type?: string | null;
};

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function jsonSuccess(data: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      ...data,
    },
    {
      headers: noStoreHeaders(),
    }
  );
}

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullable(v: unknown) {
  const s = clean(v);
  return s || null;
}

function normalizePhone(v: unknown) {
  const raw = clean(v);
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  return digits || null;
}

function hasMeaningfulLeadInfo(input: {
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  region: string | null;
  crop: string | null;
  company_name: string | null;
}) {
  return !!(
    input.name ||
    input.phone ||
    input.email ||
    input.message ||
    input.region ||
    input.crop ||
    input.company_name
  );
}

function normalizeLeadType(v: unknown) {
  const s = clean(v).toLowerCase();
  if (s === "buyer") return "buyer";
  if (s === "vendor") return "vendor";
  return "farmer";
}

function buildDedupKey(input: {
  booth_id: string | null;
  product_id: string | null;
  deal_id: string | null;
  session_id: string | null;
  phone: string | null;
  email: string | null;
}) {
  return [
    input.booth_id || "-",
    input.product_id || input.deal_id || "-",
    input.session_id || "-",
    input.phone || "-",
    input.email || "-",
  ].join("::");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as LeadBody;

    const booth_id = cleanNullable(body.booth_id);
    const product_id = cleanNullable(body.product_id ?? body.deal_id);
    const deal_id = cleanNullable(body.deal_id);

    const name = cleanNullable(body.name);
    const phone = normalizePhone(body.phone);
    const email = cleanNullable(body.email);
    const message = cleanNullable(body.message);

    const source = clean(body.source) || "expo";
    const campaign = cleanNullable(body.campaign);
    const video_code = cleanNullable(body.video_code);
    const landing_type = clean(body.landing_type) || "booth";
    const session_id = cleanNullable(body.session_id);

    const region = cleanNullable(body.region);
    const crop = cleanNullable(body.crop);
    const company_name = cleanNullable(body.company_name);
    const lead_type = normalizeLeadType(body.lead_type);

    if (!booth_id && !product_id) {
      return jsonError("booth_id 또는 product_id(deal_id 포함) 중 하나는 필요합니다.", 400);
    }

    const meaningfulLead = hasMeaningfulLeadInfo({
      name,
      phone,
      email,
      message,
      region,
      crop,
      company_name,
    });

    if (!meaningfulLead) {
      return jsonSuccess({
        mode: "skipped",
        reason: "no_meaningful_lead_info",
      });
    }

    const admin = createSupabaseAdminClient();

    const dedup_key = buildDedupKey({
      booth_id,
      product_id,
      deal_id,
      session_id,
      phone,
      email,
    });

    // 최근 동일 문의 중복 방지
    let existingId: string | null = null;

    if (session_id || phone || email) {
      let query = admin
        .from("expo_leads")
        .select("id, created_at")
        .eq("booth_id", booth_id)
        .eq("source", source)
        .eq("landing_type", landing_type)
        .order("created_at", { ascending: false })
        .limit(5);

      if (product_id) {
        query = query.eq("product_id", product_id);
      }

      const { data: recentRows, error: recentError } = await query;

      if (recentError) {
        console.error("[api/expo/lead] recent lookup error:", recentError);
      } else if (Array.isArray(recentRows) && recentRows.length > 0) {
        existingId = String(recentRows[0]?.id ?? "");
      }
    }

    const payload = {
      lead_type,
      status: "new",
      booth_id,
      product_id,
      name,
      phone,
      email,
      region,
      crop,
      company_name,
      inquiry_text: message || "",
      source,
      source_detail: JSON.stringify({
        campaign,
        video_code,
        landing_type,
        session_id,
        deal_id,
        dedup_key,
      }),
      priority_score: 0,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      const { data: updated, error: updateError } = await admin
        .from("expo_leads")
        .update(payload)
        .eq("id", existingId)
        .select("*")
        .single();

      if (updateError) {
        console.error("[api/expo/lead] update error:", updateError);
        return jsonError(updateError.message || "문의 업데이트에 실패했습니다.", 500);
      }

      return jsonSuccess({
        mode: "updated",
        item: updated,
      });
    }

    const insertPayload = {
      ...payload,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await admin
      .from("expo_leads")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError) {
      console.error("[api/expo/lead] insert error:", insertError);
      return jsonError(insertError.message || "문의 저장에 실패했습니다.", 500);
    }

    return jsonSuccess({
      mode: "inserted",
      item: inserted,
    });
  } catch (e) {
    console.error("[api/expo/lead] exception:", e);

    return jsonError(
      e instanceof Error ? e.message : "lead capture failed",
      500
    );
  }
}