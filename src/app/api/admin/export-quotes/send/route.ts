import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="border:1px solid #ddd;padding:8px 10px;background:#f8fafc;font-weight:700;width:180px;">
        ${escapeHtml(label)}
      </td>
      <td style="border:1px solid #ddd;padding:8px 10px;">
        ${escapeHtml(value || "-")}
      </td>
    </tr>
  `;
}

function buildQuoteMail(params: {
  buyerName: string;
  companyName: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  incoterm: string;
  paymentTerms: string;
  deliveryTime: string;
  origin: string;
  packaging: string;
  pdfUrl: string;
  quoteMemo?: string | null;
}) {
  const buyerName = params.buyerName || "Customer";
  const companyName = params.companyName || "Customer";
  const productName = params.productName || "Product";
  const quantity = params.quantity || "-";
  const unitPrice = params.unitPrice || "-";
  const incoterm = params.incoterm || "-";
  const paymentTerms = params.paymentTerms || "-";
  const deliveryTime = params.deliveryTime || "-";
  const origin = params.origin || "-";
  const packaging = params.packaging || "-";
  const pdfUrl = params.pdfUrl || "";
  const quoteMemo = params.quoteMemo || "";

  const subject = `[K-Agri Expo] Export Quotation - ${productName}`;

  const text = [
    `Dear ${buyerName},`,
    ``,
    `Thank you for your inquiry to K-Agri Expo.`,
    `Please find the quotation summary below.`,
    ``,
    `Company: ${companyName}`,
    `Product: ${productName}`,
    `Quantity: ${quantity}`,
    `Unit Price: ${unitPrice}`,
    `Incoterm: ${incoterm}`,
    `Payment Terms: ${paymentTerms}`,
    `Delivery Time: ${deliveryTime}`,
    `Origin: ${origin}`,
    `Packaging: ${packaging}`,
    ``,
    quoteMemo ? `Note: ${quoteMemo}` : "",
    pdfUrl ? `Quotation PDF: ${pdfUrl}` : "",
    ``,
    `If you would like to proceed, please reply to this email.`,
    ``,
    `Best regards,`,
    `K-Agri Expo`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111;">
      <p>Dear ${escapeHtml(buyerName)},</p>
      <p>
        Thank you for your inquiry to <b>K-Agri Expo</b>.<br />
        Please find the quotation summary below.
      </p>

      <table style="border-collapse:collapse;width:100%;max-width:720px;margin:16px 0;">
        <tbody>
          ${row("Company", companyName)}
          ${row("Product", productName)}
          ${row("Quantity", quantity)}
          ${row("Unit Price", unitPrice)}
          ${row("Incoterm", incoterm)}
          ${row("Payment Terms", paymentTerms)}
          ${row("Delivery Time", deliveryTime)}
          ${row("Origin", origin)}
          ${row("Packaging", packaging)}
        </tbody>
      </table>

      ${
        quoteMemo
          ? `<p><b>Note:</b> ${escapeHtml(quoteMemo)}</p>`
          : ""
      }

      ${
        pdfUrl
          ? `<p><a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noreferrer">Download Quotation PDF</a></p>`
          : ""
      }

      <p>If you would like to proceed, please reply to this email.</p>

      <p>
        Best regards,<br />
        <b>K-Agri Expo</b>
      </p>
    </div>
  `;

  return { subject, text, html };
}

let transporterCache: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporterCache) return transporterCache;

  const host = getEnv("GMAIL_SMTP_HOST");
  const port = Number(getEnv("GMAIL_SMTP_PORT"));
  const secure = getEnv("GMAIL_SMTP_SECURE") === "true";
  const user = getEnv("GMAIL_SMTP_USER");
  const pass = getEnv("GMAIL_SMTP_PASS");

  transporterCache = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporterCache;
}

async function sendEmailViaGmail(payload: MailPayload) {
  const transporter = getTransporter();

  const fromName = getEnv("GMAIL_FROM_NAME");
  const fromEmail = getEnv("GMAIL_FROM_EMAIL");

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return {
    ok: true,
    provider: "gmail-smtp",
    messageId: info.messageId || "",
    accepted: info.accepted || [],
    rejected: info.rejected || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json();

    const quoteId = n(body.quote_id);

    if (!quoteId) {
      return jsonError("quote_id가 필요합니다.");
    }

    const { data: quote, error: quoteError } = await supabase
      .from("export_quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return jsonError("견적서를 찾을 수 없습니다.", 404);
    }

    const { data: lead, error: leadError } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("id", quote.lead_id)
      .single();

    if (leadError || !lead) {
      return jsonError("리드를 찾을 수 없습니다.", 404);
    }

    const recipientEmail = n(lead.email);
    if (!recipientEmail) {
      return jsonError("바이어 이메일이 없습니다.");
    }

    const productName = n(quote.product_name);
    const quantity = n(quote.quantity || lead.quantity);
    const unitPrice = n(quote.unit_price);
    const incoterm = n(quote.incoterm);
    const paymentTerms = n(quote.payment_terms);
    const deliveryTime = n(quote.delivery_time);
    const origin = n(quote.origin);
    const packaging = n(quote.packaging);
    const quoteMemo = n(quote.quote_memo);
    const pdfUrl = n(quote.pdf_url);

    const buyerName = n(lead.contact_name) || "Customer";
    const companyName = n(lead.company_name) || "Customer";

    const mail = buildQuoteMail({
      buyerName,
      companyName,
      productName,
      quantity,
      unitPrice,
      incoterm,
      paymentTerms,
      deliveryTime,
      origin,
      packaging,
      pdfUrl,
      quoteMemo,
    });

    const sendResult = await sendEmailViaGmail({
      to: recipientEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    if (!sendResult.ok) {
      return jsonError("이메일 발송에 실패했습니다.", 500);
    }

    const nowIso = new Date().toISOString();

    const { error: quoteUpdateError } = await supabase
      .from("export_quotes")
      .update({
        status: "sent",
        updated_at: nowIso,
      })
      .eq("id", quote.id);

    if (quoteUpdateError) {
      return jsonError(
        `견적 상태 업데이트 실패: ${quoteUpdateError.message}`,
        500
      );
    }

    const { error: leadUpdateError } = await supabase
      .from("deal_leads")
      .update({
        quote_status: "sent",
        quote_sent_at: nowIso,
      })
      .eq("id", lead.id);

    if (leadUpdateError) {
      return jsonError(
        `리드 상태 업데이트 실패: ${leadUpdateError.message}`,
        500
      );
    }

    return NextResponse.json({
      ok: true,
      message: "견적서 이메일 발송이 완료되었습니다.",
      sent_to: recipientEmail,
      quote_id: quote.id,
      lead_id: lead.id,
      provider: sendResult.provider,
      provider_message_id: sendResult.messageId,
      accepted: sendResult.accepted,
      rejected: sendResult.rejected,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      500
    );
  }
}