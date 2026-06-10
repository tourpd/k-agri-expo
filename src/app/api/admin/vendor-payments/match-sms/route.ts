import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function normalize(v: unknown) {
  return safe(v)
    .replace(/\s+/g, "")
    .replace(/[()㈜]/g, "")
    .replace(/주식회사/g, "")
    .replace(/티브이/g, "tv")
    .replace(/텔레비전/g, "tv")
    .toLowerCase();
}

function extractAmount(text: string) {
  const nums = text
    .match(/[\d,]+(?=\s*원)/g)
    ?.map((x) => Number(x.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);

  return nums?.length ? Math.max(...nums) : 0;
}

function cleanDepositorName(v: string) {
  return safe(v)
    .replace(/입금|출금|잔액|원|KRW|기업은행|농협|국민|신한|우리|하나|카카오|토스/g, "")
    .replace(/계좌|알림|거래|전자금융|스마트뱅킹|인터넷뱅킹/g, "")
    .replace(/[\[\]{}<>]/g, "")
    .replace(/\d{1,2}[:/.-]\d{1,2}.*/g, "")
    .replace(/\d+/g, "")
    .trim();
}

function extractDepositor(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();

  const patterns = [
    /입금자[:\s]+([가-힣a-zA-Z0-9()㈜주식회사\s]{2,40})/,
    /보낸분[:\s]+([가-힣a-zA-Z0-9()㈜주식회사\s]{2,40})/,
    /입금\s*([가-힣a-zA-Z0-9()㈜주식회사\s]{2,40})\s*[\d,]+\s*원/,
    /([가-힣a-zA-Z0-9()㈜주식회사\s]{2,40})\s*[\d,]+\s*원\s*입금/,
    /([가-힣a-zA-Z0-9()㈜주식회사\s]{2,40})\s*입금\s*[\d,]+\s*원/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      const name = cleanDepositorName(match[1]);
      if (name.length >= 2) return name;
    }
  }

  return "";
}

function splitSmsBlocks(text: string) {
  return text
    .replace(/\r/g, "\n")
    .trim()
    .split(/\n{2,}|(?=\[[^\]]*(입금|IBK|기업|농협|신한|국민|우리|하나)[^\]]*\])/g)
    .map((x) => x.trim())
    .filter(
      (x) =>
        x.length > 0 &&
        !/^(입금|IBK|기업|농협|신한|국민|우리|하나)$/.test(x)
    );
}

function buildNamePool(app: any) {
  return [
    app.company_name,
    app.representative_name,
    app.ceo_name,
    app.contact_name,
  ]
    .map(normalize)
    .filter(Boolean);
}

function scoreApplication(app: any, amount: number, depositor: string) {
  const appAmount = Number(app.amount_krw || 0);
  const d = normalize(depositor);
  const names = buildNamePool(app);

  let score = 0;
  const reasons: string[] = [];

  if (amount > 0 && appAmount === amount) {
    score += 70;
    reasons.push("금액일치");
  } else if (amount > 0 && appAmount > 0) {
    const diff = Math.abs(appAmount - amount);
    const rate = diff / Math.max(appAmount, amount);

    if (rate <= 0.1) {
      score += 35;
      reasons.push("금액근접");
    } else {
      reasons.push(`금액불일치(${appAmount.toLocaleString()}원)`);
    }
  }

  if (d && names.some((name) => name.includes(d) || d.includes(name))) {
    score += 50;
    reasons.push("입금자명일치");
  } else if (d && names.some((name) => name.includes(d.slice(0, 2)) || d.includes(name.slice(0, 2)))) {
    score += 20;
    reasons.push("입금자명일부유사");
  }

  if (!reasons.length) reasons.push("추천근거 약함");

  return {
    score,
    reason: reasons.join(", "),
  };
}

function toCandidate(row: any, score: number, reason: string) {
  return {
    application_id: row.application_id,
    application_code: row.application_code,
    company_name: row.company_name,
    contact_name: row.contact_name || row.representative_name || row.ceo_name || "",
    contact_phone: row.contact_phone || row.phone || "",
    amount_krw: Number(row.amount_krw || 0),
    payment_status: row.payment_status,
    application_status: row.application_status,
    created_at: row.created_at,
    score,
    reason,
  };
}

async function findApplicationCandidates(
  supabase: any,
  amount: number,
  depositor: string
) {
  const { data, error } = await supabase
    .from("vendor_applications_v2")
    .select(
      `
      application_id,
      application_code,
      company_name,
      representative_name,
      ceo_name,
      contact_name,
      contact_phone,
      phone,
      business_number,
      amount_krw,
      payment_status,
      application_status,
      created_at
      `
    )
    .neq("application_status", "rejected")
    .in("payment_status", ["waiting", "not_required"])
    .limit(500);

  if (error) throw new Error(error.message);

  return (data || [])
    .map((app: any) => {
      const scored = scoreApplication(app, amount, depositor);
      return {
        app,
        score: scored.score,
        reason: scored.reason,
      };
    })
    .filter((x: any) => x.score > 0)
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(b.app.created_at || "").localeCompare(
        String(a.app.created_at || "")
      );
    });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const smsText = safe(body.sms_text || body.smsText);

    if (!smsText) {
      return NextResponse.json(
        { ok: false, success: false, error: "sms_text가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const blocks = splitSmsBlocks(smsText);

    const results: any[] = [];

    for (const block of blocks) {
      const amount = extractAmount(block);
      const depositor = extractDepositor(block);

      if (!amount) {
        results.push({
          matched: false,
          needs_manual_confirm: true,
          deposit_amount: 0,
          depositor_name: depositor,
          reason: "입금 금액을 찾지 못했습니다.",
          raw_text: block,
          candidates: [],
        });
        continue;
      }

      const candidates = await findApplicationCandidates(
        supabase,
        amount,
        depositor
      );

      results.push({
        matched: false,
        needs_manual_confirm: true,
        deposit_amount: amount,
        depositor_name: depositor,
        reason:
          candidates.length > 0
            ? "추천 후보 중 맞는 신청 건을 선택해 입금확정하십시오."
            : "추천 후보가 없습니다. 신청 목록에서 직접 확인이 필요합니다.",
        raw_text: block,
        candidates: candidates
          .slice(0, 20)
          .map((x: any) => toCandidate(x.app, x.score, x.reason)),
      });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      confirmed_count: 0,
      need_review_count: results.length,
      items: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "입금 문자 매칭 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}