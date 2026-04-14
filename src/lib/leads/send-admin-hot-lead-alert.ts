import nodemailer from "nodemailer";

type AdminHotLeadAlertParams = {
  leadId: string;
  companyName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  message?: string | null;
  detectionSummary: string;
  score: number;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

let transporterCache: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporterCache) return transporterCache;

  transporterCache = nodemailer.createTransport({
    host: getEnv("GMAIL_SMTP_HOST"),
    port: Number(getEnv("GMAIL_SMTP_PORT")),
    secure: getEnv("GMAIL_SMTP_SECURE") === "true",
    auth: {
      user: getEnv("GMAIL_SMTP_USER"),
      pass: getEnv("GMAIL_SMTP_PASS"),
    },
  });

  return transporterCache;
}

export async function sendAdminHotLeadAlert(params: AdminHotLeadAlertParams) {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return { ok: false, error: "ADMIN_EMAILS가 비어 있습니다." };
  }

  const fromName = getEnv("GMAIL_FROM_NAME");
  const fromEmail = getEnv("GMAIL_FROM_EMAIL");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const subject = `[K-Agri Expo] HOT 바이어 문의 감지 (${params.score}점)`;

  const text = [
    `HOT 리드가 감지되었습니다.`,
    ``,
    `Lead ID: ${params.leadId}`,
    `회사명: ${params.companyName || "-"}`,
    `담당자명: ${params.contactName || "-"}`,
    `이메일: ${params.email || "-"}`,
    `연락처: ${params.phone || "-"}`,
    `국가: ${params.country || "-"}`,
    `감지 결과: ${params.detectionSummary}`,
    `문의 내용: ${params.message || "-"}`,
    ``,
    `CRM 바로가기: ${siteUrl}/admin/leads`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111;">
      <h2>HOT 리드가 감지되었습니다.</h2>
      <p><b>Lead ID:</b> ${params.leadId}</p>
      <p><b>회사명:</b> ${params.companyName || "-"}</p>
      <p><b>담당자명:</b> ${params.contactName || "-"}</p>
      <p><b>이메일:</b> ${params.email || "-"}</p>
      <p><b>연락처:</b> ${params.phone || "-"}</p>
      <p><b>국가:</b> ${params.country || "-"}</p>
      <p><b>감지 결과:</b> ${params.detectionSummary}</p>
      <p><b>문의 내용:</b><br/>${(params.message || "-").replace(/\n/g, "<br/>")}</p>
      <p>
        <a href="${siteUrl}/admin/leads" target="_blank" rel="noreferrer">
          CRM 바로가기
        </a>
      </p>
    </div>
  `;

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmails.join(","),
    subject,
    text,
    html,
  });

  return {
    ok: true,
    messageId: info.messageId || "",
    accepted: info.accepted || [],
    rejected: info.rejected || [],
  };
}