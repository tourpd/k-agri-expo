// src/app/api/admin/gmail-pull/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PullResult = {
  message_id: string;
  subject?: string;
  from?: string;
  sender_email?: string;
  success: boolean;
  skipped: boolean;
  reason?: string;
  row_id?: string | null;
  error?: string;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

async function getAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN이 필요합니다."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const text = await res.text();

  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error("Gmail token error:", data);

    throw new Error(
      data?.error_description ||
        data?.error ||
        JSON.stringify(data) ||
        "Gmail 토큰 발급 실패"
    );
  }

  if (!data.access_token) {
    throw new Error("Gmail access_token이 없습니다.");
  }

  return String(data.access_token);
}

function decodeBase64Url(v: string) {
  const normalized = v.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  return Buffer.from(padded, "base64").toString("utf8");
}

function findHeader(headers: any[], name: string) {
  return safe(
    headers?.find((h) => safe(h.name).toLowerCase() === name.toLowerCase())?.value
  );
}

function stripHtml(v: string) {
  return safe(v)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractBody(payload: any): string {
  if (!payload) return "";

  if (payload.body?.data) {
    const text = decodeBase64Url(payload.body.data);
    return payload.mimeType === "text/html" ? stripHtml(text) : safe(text);
  }

  const parts = payload.parts || [];

  const textPart = parts.find(
    (p: any) => p.mimeType === "text/plain" && p.body?.data
  );

  if (textPart?.body?.data) {
    return safe(decodeBase64Url(textPart.body.data));
  }

  const htmlPart = parts.find(
    (p: any) => p.mimeType === "text/html" && p.body?.data
  );

  if (htmlPart?.body?.data) {
    return stripHtml(decodeBase64Url(htmlPart.body.data));
  }

  for (const part of parts) {
    const nested = extractBody(part);
    if (nested) return nested;
  }

  return "";
}

function extractEmailAddress(from: string) {
  const m = from.match(/<([^>]+)>/);
  if (m?.[1]) return safe(m[1]);
  if (from.includes("@")) return safe(from);
  return "";
}

function extractSenderName(from: string) {
  return safe(from.replace(/<[^>]+>/g, "").replace(/"/g, ""));
}

function isBlockedSender(email: string) {
  const e = safe(email).toLowerCase();

  const blocked = [
    "producthunt.com",
    "ifttt.com",
    "make.com",
    "resend.com",
    "github.com",
    "vercel.com",
    "supabase.com",
    "noreply@supabase.com",
    "notifications@vercel.com",
    "notion.so",
    "figma.com",
    "youtube.com",
    "google.com",
    "googlemail.com",
    "linkedin.com",
    "facebookmail.com",
    "mailchimp",
    "sendgrid",
    "stripe.com",
    "openai.com",
    "anthropic.com",
    "apple.com",
    "naver.com",
    "kakao.com",
    "youversion.com",
  ];

  return blocked.some((domain) => e.includes(domain));
}

function looksLikeBusinessLead(subject: string, body: string) {
  const text = `${subject}\n${body}`.toLowerCase();

  const keywords = [
    "buyer",
    "buy",
    "purchase",
    "import",
    "export",
    "oem",
    "moq",
    "quotation",
    "quote",
    "price",
    "supply",
    "supplier",
    "distributor",
    "partnership",
    "expo",
    "vendor",
    "booth",
    "garlic",
    "fertilizer",
    "insect",
    "machinery",
    "sample",
    "order",
    "shipping",
    "certificate",
    "수입",
    "수출",
    "바이어",
    "구매",
    "견적",
    "입점",
    "부스",
    "공동구매",
    "OEM",
    "마늘",
    "비료",
    "농기계",
    "고소애",
  ];

  return keywords.some((k) => text.includes(k.toLowerCase()));
}

async function alreadySaved(messageId: string) {
  if (!messageId) return false;

  const { data, error } = await supabase
    .from("crm_inbox")
    .select("id")
    .eq("source_message_id", messageId)
    .maybeSingle();

  if (error) return false;

  return !!data?.id;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const query =
      safe(url.searchParams.get("q")) ||
      "newer_than:30d -category:promotions -category:social";

    const maxResults = Math.min(Number(url.searchParams.get("max") || 10), 20);
    const force = safe(url.searchParams.get("force")) === "1";

    const accessToken = await getAccessToken();

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const listText = await listRes.text();

    let listData: any = {};
    try {
      listData = JSON.parse(listText);
    } catch {
      listData = { raw: listText };
    }

    if (!listRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            listData?.error?.message ||
            listData?.error ||
            JSON.stringify(listData) ||
            "Gmail 목록 조회 실패",
        },
        { status: 500 }
      );
    }

    const messages = listData.messages || [];
    const origin = new URL(req.url).origin;
    const results: PullResult[] = [];

    for (const m of messages) {
      if (!force && (await alreadySaved(m.id))) {
        results.push({
          message_id: m.id,
          success: true,
          skipped: true,
          reason: "이미 CRM에 저장된 메일",
          row_id: null,
        });
        continue;
      }

      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const detailText = await detailRes.text();

      let detail: any = {};
      try {
        detail = JSON.parse(detailText);
      } catch {
        detail = { raw: detailText };
      }

      if (!detailRes.ok) {
        results.push({
          message_id: m.id,
          success: false,
          skipped: false,
          row_id: null,
          error:
            detail?.error?.message ||
            detail?.error ||
            JSON.stringify(detail) ||
            "메일 상세 조회 실패",
        });
        continue;
      }

      const headers = detail.payload?.headers || [];
      const from = findHeader(headers, "From");
      const subject = findHeader(headers, "Subject");
      const date = findHeader(headers, "Date");
      const body = extractBody(detail.payload);
      const senderEmail = extractEmailAddress(from);
      const senderName = extractSenderName(from);

      if (isBlockedSender(senderEmail)) {
        results.push({
          message_id: m.id,
          subject,
          from,
          sender_email: senderEmail,
          success: true,
          skipped: true,
          reason: "광고/시스템 발신자 제외",
          row_id: null,
        });
        continue;
      }

      if (!force && !looksLikeBusinessLead(subject, body || detail.snippet || "")) {
        results.push({
          message_id: m.id,
          subject,
          from,
          sender_email: senderEmail,
          success: true,
          skipped: true,
          reason: "비즈니스 리드 키워드 없음",
          row_id: null,
        });
        continue;
      }

      const ingestRes = await fetch(`${origin}/api/admin/crm-mail-ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_name: senderName,
          sender_email: senderEmail,
          subject,
          content: body || detail.snippet || "",
          message_id: m.id,
          gmail_date: date,
          source_type: "gmail",
          force,
        }),
      });

      const ingestText = await ingestRes.text();

      let ingestData: any = {};
      try {
        ingestData = JSON.parse(ingestText);
      } catch {
        ingestData = { raw: ingestText };
      }

      const rowId = ingestData?.row?.id || null;
      const skipped = !!ingestData?.skipped || !rowId;

      results.push({
        message_id: m.id,
        subject,
        from,
        sender_email: senderEmail,
        success: !!ingestData?.success,
        skipped,
        reason: ingestData?.reason || (skipped ? "CRM 저장 안 됨" : ""),
        row_id: rowId,
        error: ingestData?.error || "",
      });
    }

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      saved_count: results.filter((r) => r.success && !r.skipped && r.row_id).length,
      skipped_count: results.filter((r) => r.skipped).length,
      results,
    });
  } catch (e: any) {
    console.error("gmail-pull error:", e);

    return NextResponse.json(
      {
        success: false,
        error: e?.message || "Gmail 수집 실패",
      },
      { status: 500 }
    );
  }
}