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

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const transporter = getTransporter();

  const fromName = getEnv("GMAIL_FROM_NAME");
  const fromEmail = getEnv("GMAIL_FROM_EMAIL");

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });

  return {
    messageId: info.messageId || "",
    accepted: info.accepted || [],
    rejected: info.rejected || [],
  };
}

function buildVendorNotificationMail(params: {
  vendorName: string;
  leadId: string;
  companyName: string;
  contactName: string;
  country: string;
  inquiryLanguage: string;
  quantity: string;
  sourceType: string;
  message: string;
  translatedMessage: string;
  adminMemo: string;
}) {
  const vendorName = params.vendorName || "Vendor";
  const leadId = params.leadId || "-";
  const companyName = params.companyName || "-";
  const contactName = params.contactName || "-";
  const country = params.country || "-";
  const inquiryLanguage = params.inquiryLanguage || "-";
  const quantity = params.quantity || "-";
  const sourceType = params.sourceType || "-";
  const message = params.message || "-";
  const translatedMessage = params.translatedMessage || "-";
  const adminMemo = params.adminMemo || "-";

  const subject = `[K-Agri Expo] 신규 리드 검토 요청 - ${companyName}`;

  const text = [
    `Hello ${vendorName},`,
    ``,
    `관리자가 검토한 신규 리드가 있습니다.`,
    ``,
    `Lead ID: ${leadId}`,
    `Company: ${companyName}`,
    `Contact: ${contactName}`,
    `Country: ${country}`,
    `Language: ${inquiryLanguage}`,
    `Quantity: ${quantity}`,
    `Source: ${sourceType}`,
    ``,
    `Original Inquiry:`,
    `${message}`,
    ``,
    `Translated Inquiry:`,
    `${translatedMessage}`,
    ``,
    `Admin Memo:`,
    `${adminMemo}`,
    ``,
    `Please review and coordinate through K-Agri Expo.`,
    ``,
    `Best regards,`,
    `K-Agri Expo`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111;">
      <p>Hello ${escapeHtml(vendorName)},</p>
      <p>관리자가 검토한 신규 리드가 있습니다.</p>

      <table style="border-collapse:collapse;width:100%;max-width:760px;margin:16px 0;">
        <tbody>
          ${row("Lead ID", leadId)}
          ${row("Company", companyName)}
          ${row("Contact", contactName)}
          ${row("Country", country)}
          ${row("Language", inquiryLanguage)}
          ${row("Quantity", quantity)}
          ${row("Source", sourceType)}
        </tbody>
      </table>

      <p><b>Original Inquiry</b></p>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:10px;background:#fafafa;">
        ${escapeHtml(message)}
      </div>

      <p style="margin-top:16px;"><b>Translated Inquiry</b></p>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:10px;background:#fafafa;">
        ${escapeHtml(translatedMessage)}
      </div>

      <p style="margin-top:16px;"><b>Admin Memo</b></p>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:10px;background:#fafafa;">
        ${escapeHtml(adminMemo)}
      </div>

      <p style="margin-top:18px;">
        Please review and coordinate through <b>K-Agri Expo</b>.
      </p>

      <p>
        Best regards,<br />
        <b>K-Agri Expo</b>
      </p>
    </div>
  `;

  return { subject, html, text };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { leadId } = await context.params;
    const body = await req.json().catch(() => ({}));

    if (!leadId) {
      return jsonError("leadId가 필요합니다.");
    }

    const adminMemoInput = n(body.admin_memo);

    const { data: lead, error: leadError } = await supabase
      .from("deal_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return jsonError("리드를 찾을 수 없습니다.", 404);
    }

    const vendorId = n(lead.vendor_id);
    if (!vendorId) {
      return jsonError("vendor_id가 없습니다. 먼저 리드에 벤더를 지정하세요.");
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor) {
      return jsonError("벤더를 찾을 수 없습니다.", 404);
    }

    const vendorEmail =
      n(vendor.contact_email) ||
      n(vendor.email);

    if (!vendorEmail) {
      return jsonError("벤더 이메일이 없습니다.");
    }

    const vendorName =
      n(vendor.company_name) ||
      "Vendor";

    const companyName = n(lead.company_name);
    const contactName = n(lead.contact_name);
    const country = n(lead.country);
    const inquiryLanguage = n(lead.inquiry_language || lead.language);
    const quantity = n(lead.quantity);
    const sourceType = n(lead.source_type);
    const message = n(lead.message);
    const translatedMessage = n(lead.translated_message || lead.message);
    const adminMemo = adminMemoInput || n(lead.admin_memo);

    const mail = buildVendorNotificationMail({
      vendorName,
      leadId: String(lead.id),
      companyName,
      contactName,
      country,
      inquiryLanguage,
      quantity,
      sourceType,
      message,
      translatedMessage,
      adminMemo,
    });

    try {
      const sendResult = await sendEmail(
        vendorEmail,
        mail.subject,
        mail.html,
        mail.text
      );

      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("deal_leads")
        .update({
          vendor_notified_at: nowIso,
          vendor_notification_status: "sent",
          vendor_notification_error: null,
          lead_stage: lead.lead_stage === "qualified" ? "sent" : lead.lead_stage,
          admin_memo: adminMemo || lead.admin_memo || null,
          updated_at: nowIso,
        })
        .eq("id", lead.id);

      if (updateError) {
        return jsonError(`리드 업데이트 실패: ${updateError.message}`, 500);
      }

      return NextResponse.json({
        ok: true,
        message: "벤더 알림 이메일 발송이 완료되었습니다.",
        sent_to: vendorEmail,
        vendor_id: vendor.id,
        lead_id: lead.id,
        provider: "gmail-smtp",
        provider_message_id: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
      });
    } catch (mailError) {
      const errorMessage =
        mailError instanceof Error ? mailError.message : "메일 발송 실패";

      await supabase
        .from("deal_leads")
        .update({
          vendor_notification_status: "failed",
          vendor_notification_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      return jsonError(`벤더 알림 발송 실패: ${errorMessage}`, 500);
    }
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      500
    );
  }
}