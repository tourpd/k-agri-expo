import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildIlikePattern(keyword: string) {
  return `%${keyword.replace(/\s+/g, "%")}%`;
}

function parseBooleanFilter(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

type LatestQuoteLite = {
  id: string;
  lead_id: string;
  status: string | null;
  pdf_url: string | null;
  created_at?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const q = normalizeString(searchParams.get("q"));
    const sourceType = normalizeString(searchParams.get("source_type"));
    const leadStage = normalizeString(searchParams.get("lead_stage"));
    const isForeignRaw = normalizeString(searchParams.get("is_foreign"));
    const isForeign = parseBooleanFilter(isForeignRaw);

    let query = supabase
      .from("deal_leads")
      .select("*")
      .order("priority_rank", { ascending: false })
      .order("created_at", { ascending: false });

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    if (leadStage) {
      query = query.eq("lead_stage", leadStage);
    }

    if (isForeign !== null) {
      query = query.eq("is_foreign", isForeign);
    }

    if (q) {
      const pattern = buildIlikePattern(q);
      query = query.or(
        [
          `company_name.ilike.${pattern}`,
          `contact_name.ilike.${pattern}`,
          `phone.ilike.${pattern}`,
          `email.ilike.${pattern}`,
          `message.ilike.${pattern}`,
          `translated_message.ilike.${pattern}`,
          `country.ilike.${pattern}`,
          `quantity.ilike.${pattern}`,
          `admin_memo.ilike.${pattern}`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "리드 조회 실패",
        },
        { status: 500 }
      );
    }

    const rows = data || [];

    const boothIds = Array.from(
      new Set(rows.map((x) => x.booth_id).filter(Boolean))
    ) as string[];

    const vendorIds = Array.from(
      new Set(rows.map((x) => x.vendor_id).filter(Boolean))
    ) as string[];

    const leadIds = Array.from(
      new Set(rows.map((x) => x.id).filter(Boolean))
    ) as string[];

    const boothMap = new Map<string, string>();
    const vendorMap = new Map<string, string>();
    const latestQuoteMap = new Map<
      string,
      { id: string; status: string | null; pdf_url: string | null }
    >();

    if (boothIds.length > 0) {
      const { data: booths, error: boothError } = await supabase
        .from("booths")
        .select("id, title, name, company_name")
        .in("id", boothIds);

      if (boothError) {
        console.error("[api/admin/leads] booths error:", boothError);
      }

      (booths || []).forEach((booth: any) => {
        boothMap.set(
          booth.id,
          booth.company_name || booth.title || booth.name || booth.id
        );
      });
    }

    if (vendorIds.length > 0) {
      const { data: vendors, error: vendorError } = await supabase
        .from("vendors")
        .select("id, company_name")
        .in("id", vendorIds);

      if (vendorError) {
        console.error("[api/admin/leads] vendors error:", vendorError);
      }

      (vendors || []).forEach((vendor: any) => {
        vendorMap.set(vendor.id, vendor.company_name || vendor.id);
      });
    }

    if (leadIds.length > 0) {
      const { data: quotes, error: quoteError } = await supabase
        .from("export_quotes")
        .select("id, lead_id, status, pdf_url, created_at")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });

      if (quoteError) {
        console.error("[api/admin/leads] export_quotes error:", quoteError);
      }

      (quotes || []).forEach((quote: LatestQuoteLite) => {
        if (!latestQuoteMap.has(quote.lead_id)) {
          latestQuoteMap.set(quote.lead_id, {
            id: quote.id,
            status: quote.status ?? null,
            pdf_url: quote.pdf_url ?? null,
          });
        }
      });
    }

    const items = rows.map((row: any) => {
      const latestQuote = latestQuoteMap.get(row.id);

      return {
        id: row.id,

        booth_id: row.booth_id || null,
        vendor_id: row.vendor_id || null,
        deal_id: row.deal_id || null,
        buyer_user_id: row.buyer_user_id || null,

        company_name: row.company_name || null,
        contact_name: row.contact_name || null,
        phone: row.phone || null,
        email: row.email || null,

        message: row.message || null,
        translated_message: row.translated_message || null,

        source_type: row.source_type || null,
        trade_type: row.trade_type || null,
        inquiry_language: row.inquiry_language || null,
        country: row.country || null,
        quantity: row.quantity || null,
        is_foreign: row.is_foreign ?? false,

        lead_score: row.lead_score ?? 0,
        priority_rank: row.priority_rank ?? 0,

        lead_stage: row.lead_stage || "new",
        status: row.status || "active",
        quote_status: row.quote_status || "not_started",

        admin_memo: row.admin_memo || null,
        first_contacted_at: row.first_contacted_at || null,
        last_contacted_at: row.last_contacted_at || null,
        closed_at: row.closed_at || null,

        vendor_notified_at: row.vendor_notified_at || null,
        vendor_notification_status: row.vendor_notification_status || null,
        vendor_notification_error: row.vendor_notification_error || null,

        created_at: row.created_at || null,

        booth_name: row.booth_id ? boothMap.get(row.booth_id) || null : null,
        vendor_name: row.vendor_id ? vendorMap.get(row.vendor_id) || null : null,

        latest_quote_id: latestQuote?.id ?? null,
        latest_quote_status: latestQuote?.status ?? null,
        latest_quote_pdf_url: latestQuote?.pdf_url ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
      filters: {
        q: q || null,
        source_type: sourceType || null,
        lead_stage: leadStage || null,
        is_foreign: isForeign,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}