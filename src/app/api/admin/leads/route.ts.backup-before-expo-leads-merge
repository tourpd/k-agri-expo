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

function normalizePhotoDoctorSource(value: unknown) {
  const v = normalizeString(value);

  if (v === "photo_doctor") return "photodoctor";
  if (v === "photo_doctor_product") return "photodoctor_product";

  return v || "photodoctor";
}

function scoreForSort(item: any) {
  let score = 0;

  if (item.source_type === "photodoctor_product") score += 100;
  if (item.source_type === "photodoctor") score += 50;
  if (item.hot_lead) score += 40;

  score += Number(item.priority_rank || 0);

  return score;
}

function getLeadId(row: any) {
  return row?.id || row?.lead_id || row?.source_ref_id || "";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const q = normalizeString(searchParams.get("q"));
    const sourceType = normalizeString(searchParams.get("source_type"));
    const leadStage = normalizeString(searchParams.get("lead_stage"));
    const isForeignRaw = normalizeString(searchParams.get("is_foreign"));
    const isForeign = parseBooleanFilter(isForeignRaw);

    let dealQuery = supabase
      .from("deal_leads")
      .select("*")
      .order("priority_rank", { ascending: false })
      .order("created_at", { ascending: false });

    if (sourceType) {
      dealQuery = dealQuery.eq("source_type", sourceType);
    }

    if (leadStage) {
      dealQuery = dealQuery.eq("lead_stage", leadStage);
    }

    if (isForeign !== null) {
      dealQuery = dealQuery.eq("is_foreign", isForeign);
    }

    if (q) {
      const pattern = buildIlikePattern(q);
      dealQuery = dealQuery.or(
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

    const { data: dealRows, error: dealError } = await dealQuery;

    if (dealError) {
      return NextResponse.json(
        {
          ok: false,
          error: dealError.message || "deal_leads 조회 실패",
        },
        { status: 500 }
      );
    }

    let boothLeadQuery = supabase
      .from("booth_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (sourceType) {
      if (
        sourceType === "photodoctor" ||
        sourceType === "photodoctor_product" ||
        sourceType === "photo_doctor" ||
        sourceType === "photo_doctor_product"
      ) {
        boothLeadQuery = boothLeadQuery.in("source_type", [
          sourceType,
          sourceType === "photodoctor" ? "photo_doctor" : "photodoctor",
          sourceType === "photodoctor_product"
            ? "photo_doctor_product"
            : "photodoctor_product",
        ]);
      } else {
        boothLeadQuery = boothLeadQuery.eq("source_type", "__no_match__");
      }
    }

    if (leadStage) {
      boothLeadQuery = boothLeadQuery.eq("status", leadStage);
    }

    if (q) {
      const pattern = buildIlikePattern(q);
      boothLeadQuery = boothLeadQuery.or(
        [
          `farmer_name.ilike.${pattern}`,
          `farmer_phone.ilike.${pattern}`,
          `product_name.ilike.${pattern}`,
          `crop_name.ilike.${pattern}`,
          `issue_type.ilike.${pattern}`,
          `message.ilike.${pattern}`,
          `area_text.ilike.${pattern}`,
        ].join(",")
      );
    }

    const { data: boothLeadRows, error: boothLeadError } = await boothLeadQuery;

    if (boothLeadError) {
      console.error("[api/admin/leads] booth_leads error:", boothLeadError);
    }

    const rows = dealRows || [];
    const boothRows = boothLeadRows || [];

    const boothIds = Array.from(
      new Set(
        [...rows, ...boothRows]
          .map((x: any) => x.booth_id)
          .filter(Boolean)
          .map(String)
      )
    );

    const vendorIds = Array.from(
      new Set(
        [...rows, ...boothRows]
          .map((x: any) => x.vendor_id)
          .filter(Boolean)
          .map(String)
      )
    );

    const leadIds = Array.from(
      new Set(rows.map((x: any) => getLeadId(x)).filter(Boolean))
    );

    const boothMap = new Map<string, string>();
    const vendorMap = new Map<string, string>();
    const latestQuoteMap = new Map<
      string,
      { id: string; status: string | null; pdf_url: string | null }
    >();

    if (boothIds.length > 0) {
      const { data: booths, error: boothError } = await supabase
        .from("booths")
        .select("*");

      if (boothError) {
        console.error("[api/admin/leads] booths error:", boothError);
      }

      (booths || []).forEach((booth: any) => {
        const label =
          booth.company_name ||
          booth.title ||
          booth.name ||
          booth.booth_id ||
          booth.id;

        if (booth.id) boothMap.set(String(booth.id), label);
        if (booth.booth_id) boothMap.set(String(booth.booth_id), label);
      });
    }

    if (vendorIds.length > 0) {
      const { data: vendors, error: vendorError } = await supabase
        .from("vendors")
        .select("*");

      if (vendorError) {
        console.error("[api/admin/leads] vendors error:", vendorError);
      }

      (vendors || []).forEach((vendor: any) => {
        const label = vendor.company_name || vendor.vendor_id || vendor.id;

        if (vendor.id) vendorMap.set(String(vendor.id), label);
        if (vendor.vendor_id) vendorMap.set(String(vendor.vendor_id), label);
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

    const dealItems = rows.map((row: any) => {
      const rowId = getLeadId(row);
      const latestQuote = latestQuoteMap.get(rowId);

      return {
        id: rowId,

        booth_id: row.booth_id || null,
        vendor_id: row.vendor_id || null,
        deal_id: row.deal_id || null,
        buyer_user_id: row.buyer_user_id || null,

        company_name: row.company_name || null,
        contact_name: row.contact_name || null,
        phone: row.phone || null,
        email: row.email || null,

        farmer_name: row.farmer_name || null,
        farmer_phone: row.farmer_phone || null,
        product_name: row.product_name || null,
        crop_name: row.crop_name || null,
        issue_type: row.issue_type || null,
        source_ref_id: row.source_ref_id || null,

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

        booth_name: row.booth_id
          ? boothMap.get(String(row.booth_id)) || null
          : null,
        vendor_name: row.vendor_id
          ? vendorMap.get(String(row.vendor_id)) || null
          : null,

        latest_quote_id: latestQuote?.id ?? null,
        latest_quote_status: latestQuote?.status ?? null,
        latest_quote_pdf_url: latestQuote?.pdf_url ?? null,

        quote_pdf_url: row.quote_pdf_url ?? null,

        deal_amount_krw: row.deal_amount_krw ?? null,
        commission_rate: row.commission_rate ?? null,
        commission_amount_krw: row.commission_amount_krw ?? null,
        net_revenue_krw: row.net_revenue_krw ?? null,
        contract_status: row.contract_status ?? null,
        contract_memo: row.contract_memo ?? null,
        contracted_at: row.contracted_at ?? null,
        paid_at: row.paid_at ?? null,

        negotiation_status: row.negotiation_status ?? null,
        next_action_at: row.next_action_at ?? null,
        assigned_vendor_name: row.assigned_vendor_name ?? null,
        assigned_booth_name: row.assigned_booth_name ?? null,
        vendor_last_called_at: row.vendor_last_called_at ?? null,
        buyer_last_called_at: row.buyer_last_called_at ?? null,
        buyer_level: row.buyer_level ?? null,
        buyer_verification_status: row.buyer_verification_status ?? null,

        hot_lead: row.hot_lead ?? false,
        quantity_detected: row.quantity_detected ?? false,
        price_detected: row.price_detected ?? false,
        detection_summary: row.detection_summary ?? null,
        admin_alert_sent_at: row.admin_alert_sent_at ?? null,
      };
    });

    const boothLeadItems = boothRows.map((row: any) => {
      const rowId = getLeadId(row);
      const source = normalizePhotoDoctorSource(row.source_type);

      return {
        id: rowId,

        booth_id: row.booth_id || null,
        vendor_id: row.vendor_id || null,
        deal_id: null,
        buyer_user_id: null,

        company_name:
          row.company_name ||
          (row.booth_id ? boothMap.get(String(row.booth_id)) : null) ||
          null,
        contact_name: row.farmer_name || row.contact_name || null,
        phone: row.farmer_phone || row.phone || null,
        email: row.farmer_email || row.email || null,

        farmer_name: row.farmer_name || null,
        farmer_phone: row.farmer_phone || null,
        product_name: row.product_name || null,
        crop_name: row.crop_name || null,
        issue_type: row.issue_type || null,
        source_ref_id: row.source_ref_id || null,

        message: row.message || null,
        translated_message: null,

        source_type: source,
        trade_type: "domestic",
        inquiry_language: "ko",
        country: "KR",
        quantity: row.area_text || null,
        is_foreign: false,

        lead_score: source === "photodoctor_product" ? 90 : 60,
        priority_rank:
          source === "photodoctor_product"
            ? 100
            : row.priority === "high"
            ? 80
            : row.priority === "medium"
            ? 50
            : 20,

        lead_stage:
          row.status === "new" ||
          row.status === "screening" ||
          row.status === "qualified" ||
          row.status === "sent" ||
          row.status === "negotiating" ||
          row.status === "won" ||
          row.status === "lost"
            ? row.status
            : "new",

        status: row.status || "new",
        quote_status: "not_started",

        admin_memo: row.admin_memo || null,
        first_contacted_at: row.first_contacted_at || null,
        last_contacted_at: row.last_contacted_at || null,
        closed_at: row.closed_at || null,

        vendor_notified_at: null,
        vendor_notification_status: null,
        vendor_notification_error: null,

        created_at: row.created_at || null,

        booth_name: row.booth_id
          ? boothMap.get(String(row.booth_id)) || null
          : null,
        vendor_name: row.vendor_id
          ? vendorMap.get(String(row.vendor_id)) || null
          : null,

        latest_quote_id: null,
        latest_quote_status: null,
        latest_quote_pdf_url: null,
        quote_pdf_url: null,

        deal_amount_krw: row.final_amount_krw ?? row.estimated_amount_krw ?? null,
        commission_rate: row.commission_rate ?? null,
        commission_amount_krw: row.commission_amount_krw ?? null,
        net_revenue_krw: row.commission_amount_krw ?? null,
        contract_status: null,
        contract_memo: null,
        contracted_at: null,
        paid_at: null,

        negotiation_status: null,
        next_action_at: null,
        assigned_vendor_name: null,
        assigned_booth_name: null,
        vendor_last_called_at: null,
        buyer_last_called_at: null,
        buyer_level: null,
        buyer_verification_status: null,

        hot_lead: source === "photodoctor_product" || row.priority === "high",
        quantity_detected: Boolean(row.area_text),
        price_detected: false,
        detection_summary:
          row.issue_type || row.product_name || row.crop_name
            ? `${row.crop_name || "작물"} / ${row.issue_type || "증상"} / ${
                row.product_name || "추천제품"
              }`
            : null,
        admin_alert_sent_at: null,
      };
    });

    const items = [...dealItems, ...boothLeadItems].sort((a, b) => {
      const scoreDiff = scoreForSort(b) - scoreForSort(a);
      if (scoreDiff !== 0) return scoreDiff;

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
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