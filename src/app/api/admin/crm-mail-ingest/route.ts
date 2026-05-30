// src/app/api/admin/crm-mail-ingest/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function lower(v: unknown) {
  return safe(v).toLowerCase();
}

function isSystemSender(email: string) {
  const e = lower(email);

  const blocked = [
    "noreply",
    "no-reply",
    "notification",
    "notifications",
    "digest",
    "newsletter",
    "updates",
    "producthunt.com",
    "ifttt.com",
    "make.com",
    "resend.com",
    "supabase.com",
    "vercel.com",
    "github.com",
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

  return blocked.some((x) => e.includes(x));
}

function looksLikeBusinessLead(subject: string, content: string) {
  const text = `${subject}\n${content}`.toLowerCase();

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
    "dealer",
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
    "deal",
    "contract",
    "수입",
    "수출",
    "바이어",
    "구매",
    "주문",
    "견적",
    "가격",
    "입점",
    "부스",
    "공동구매",
    "샘플",
    "제휴",
    "계약",
    "마늘",
    "비료",
    "농기계",
    "고소애",
    "곤충",
    "건강기능식품",
  ];

  return keywords.some((k) => text.includes(k.toLowerCase()));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const senderName = safe(body.sender_name);
    const senderEmail = safe(body.sender_email);
    const subject = safe(body.subject);
    const content = safe(body.content);
    const force = body.force === true || safe(body.force) === "1";

    if (!subject && !content) {
      return NextResponse.json(
        { success: false, error: "메일 제목 또는 본문이 필요합니다." },
        { status: 400 }
      );
    }

    if (!force && isSystemSender(senderEmail)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "시스템/뉴스레터 발신자 제외",
        sender_email: senderEmail,
        subject,
      });
    }

    if (!force && !looksLikeBusinessLead(subject, content)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "비즈니스 리드 키워드 없음",
        sender_email: senderEmail,
        subject,
      });
    }

    const origin = new URL(req.url).origin;

    const res = await fetch(`${origin}/api/admin/crm-inbox`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "email",

        contact_name: senderName,
        company_name: safe(body.company_name),
        phone: safe(body.phone),
        email: senderEmail,

        sender_name: senderName,
        sender_email: senderEmail,

        title: subject,
        content: [
          senderName ? `보낸사람: ${senderName}` : "",
          senderEmail ? `이메일: ${senderEmail}` : "",
          subject ? `제목: ${subject}` : "",
          content ? `본문:\n${content}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),

        raw_email: content,
        source_type: safe(body.source_type || "gmail"),
        source_message_id: safe(body.message_id || body.source_message_id),
        attachment_urls: Array.isArray(body.attachment_urls)
          ? body.attachment_urls
          : [],
        use_ai: true,
      }),
    });

    const data = await res.json();

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "CRM 메일 저장 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skipped: false,
      row: data.row,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "CRM 메일 수집 실패",
      },
      { status: 500 }
    );
  }
}