import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function safeFileName(v: string) {
  return v.replace(/[^a-zA-Z0-9-_]/g, "_");
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function formatField(value: unknown, fallback = "-") {
  const s = n(value);
  return s || fallback;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json();

    const leadId = n(body.lead_id);
    const productName = n(body.product_name);
    const quantity = n(body.quantity);
    const unitPrice = n(body.unit_price);
    const incoterm = n(body.incoterm) || "FOB";
    const paymentTerms = n(body.payment_terms) || "T/T";
    const deliveryTime = n(body.delivery_time) || "To be discussed";
    const origin = n(body.origin) || "Korea";
    const packaging = n(body.packaging) || "Standard export packaging";
    const quoteMemo = n(body.quote_memo);
    const quoteLanguage = n(body.quote_language) || "en";

    if (!leadId) {
      return jsonError("lead_id가 필요합니다.");
    }

    const { data: lead, error: leadError } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return jsonError("리드를 찾을 수 없습니다.", 404);
    }

    const nowIso = new Date().toISOString();

    const finalProductName = productName || formatField(lead.product_name, "Product TBD");
    const finalQuantity = quantity || formatField(lead.quantity, "-");
    const finalUnitPrice = unitPrice || "To be discussed";

    const { data: quote, error: quoteError } = await supabase
      .from("export_quotes")
      .insert({
        lead_id: lead.id,
        vendor_id: lead.vendor_id || null,
        booth_id: lead.booth_id || null,
        buyer_user_id: lead.buyer_user_id || null,
        product_name: finalProductName,
        quantity: finalQuantity,
        unit_price: finalUnitPrice,
        incoterm,
        payment_terms: paymentTerms,
        delivery_time: deliveryTime,
        origin,
        packaging,
        quote_memo: quoteMemo || null,
        quote_language: quoteLanguage,
        status: "draft",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .single();

    if (quoteError || !quote) {
      return jsonError(quoteError?.message || "견적 저장 실패", 500);
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    function drawRow(label: string, value: string, size = 11) {
      page.drawText(label, {
        x: 50,
        y,
        size,
        font: bold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(value || "-", {
        x: 190,
        y,
        size,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      y -= 24;
    }

    page.drawText("EXPORT QUOTATION", {
      x: 50,
      y,
      size: 22,
      font: bold,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    drawRow("Quote ID", formatField(quote.id));
    drawRow("Buyer Company", formatField(lead.company_name));
    drawRow("Contact Name", formatField(lead.contact_name));
    drawRow("Email", formatField(lead.email));
    drawRow("Country", formatField(lead.country));
    drawRow("Product", formatField(finalProductName));
    drawRow("Quantity", formatField(finalQuantity));
    drawRow("Unit Price", formatField(finalUnitPrice));
    drawRow("Incoterm", formatField(incoterm));
    drawRow("Payment Terms", formatField(paymentTerms));
    drawRow("Delivery Time", formatField(deliveryTime));
    drawRow("Origin", formatField(origin));
    drawRow("Packaging", formatField(packaging));

    if (quoteMemo) {
      drawRow("Quote Memo", quoteMemo.slice(0, 120));
    }

    y -= 10;

    page.drawText("Inquiry Message", {
      x: 50,
      y,
      size: 12,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 20;

    const messageText = (
      n(lead.translated_message) ||
      n(lead.message) ||
      "-"
    ).slice(0, 1200);

    page.drawText(messageText, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: 500,
      lineHeight: 14,
    });

    const pdfBytes = await pdfDoc.save();

    const outDir = path.join(process.cwd(), "public", "generated-quotes");
    await fs.mkdir(outDir, { recursive: true });

    const fileName = `${safeFileName(String(quote.id))}.pdf`;
    const absPath = path.join(outDir, fileName);
    await fs.writeFile(absPath, pdfBytes);

    const publicUrl = `/generated-quotes/${fileName}`;

    const { error: quoteUpdateError } = await supabase
      .from("export_quotes")
      .update({
        pdf_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    if (quoteUpdateError) {
      return jsonError(
        quoteUpdateError.message || "견적 PDF URL 업데이트 실패",
        500
      );
    }

    const { error: leadUpdateError } = await supabase
      .from("deal_leads")
      .update({
        quote_status: "drafting",
        quote_pdf_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (leadUpdateError) {
      return jsonError(
        leadUpdateError.message || "리드 견적 상태 업데이트 실패",
        500
      );
    }

    return NextResponse.json({
      ok: true,
      item: {
        ...quote,
        pdf_url: publicUrl,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "견적 생성 실패",
      500
    );
  }
}