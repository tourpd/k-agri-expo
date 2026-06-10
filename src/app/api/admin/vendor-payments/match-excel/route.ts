import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
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

    .replace(/nh농협은행/g, "")
    .replace(/농협은행/g, "")
    .replace(/지역농협/g, "")
    .replace(/농협/g, "")
    .replace(/축협/g, "")
    .replace(/수협/g, "")
    .replace(/새마을금고/g, "")
    .replace(/신협/g, "")
    .replace(/산림조합/g, "")
    .replace(/우체국/g, "")

    .replace(/기업은행/g, "")
    .replace(/ibk/g, "")
    .replace(/국민은행/g, "")
    .replace(/kb/g, "")
    .replace(/신한은행/g, "")
    .replace(/우리은행/g, "")
    .replace(/하나은행/g, "")
    .replace(/카카오뱅크/g, "")
    .replace(/토스뱅크/g, "")
    .replace(/케이뱅크/g, "")

    .replace(/티브이/g, "tv")
    .replace(/텔레비전/g, "tv")
    .toLowerCase();
}

function toNumber(v: unknown) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const text = safe(v).replace(/[^\d]/g, "");
  const n = Number(text);

  return Number.isFinite(n) ? n : 0;
}

function pickValue(row: Record<string, unknown>, keys: string[]) {
  const entries = Object.entries(row);

  for (const wanted of keys) {
    const found = entries.find(([key]) =>
      normalize(key).includes(normalize(wanted))
    );

    if (found) return found[1];
  }

  return "";
}

function readDepositRow(row: Record<string, unknown>) {
  const depositorRaw =
    pickValue(row, [
      "입금자명",
      "입금자",
      "보낸분",
      "예금주",
      "거래자",
      "성명",
      "업체명",
    ]) || "";

  const amountRaw =
    pickValue(row, [
      "입금액",
      "입금금액",
      "금액",
      "거래금액",
      "받은금액",
      "입금",
    ]) || "";

  const dateRaw =
    pickValue(row, [
      "입금일",
      "입금일시",
      "거래일",
      "거래일시",
      "일자",
      "날짜",
    ]) || "";

  const memoRaw =
    pickValue(row, [
      "메모",
      "내용",
      "적요",
      "거래내용",
      "은행",
      "통장메모",
      "비고",
    ]) || "";

  return {
    depositor_name: safe(depositorRaw),
    deposit_amount: toNumber(amountRaw),
    deposit_date: safe(dateRaw),
    memo: safe(memoRaw),
  };
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

function scoreApplication(
  app: any,
  depositAmount: number,
  depositorName: string
) {
  const appAmount = Number(app.amount_krw || 0);
  const d = normalize(depositorName);
  const names = buildNamePool(app);

  let score = 0;
  const reasons: string[] = [];

  if (depositAmount > 0 && appAmount === depositAmount) {
    score += 200;
    reasons.push("금액일치");
  } else if (depositAmount > 0 && appAmount > 0) {
    const diff = Math.abs(appAmount - depositAmount);
    const rate = diff / Math.max(appAmount, depositAmount);

    if (rate <= 0.1) {
      score += 60;
      reasons.push("금액근접");
    } else {
      reasons.push(`금액불일치(${appAmount.toLocaleString("ko-KR")}원)`);
    }
  }

  if (d && names.some((name) => name.includes(d) || d.includes(name))) {
    score += 100;
    reasons.push("입금자명일치");
  } else if (
    d &&
    names.some((name) => {
      const depositorPrefix = d.slice(0, 2);
      const namePrefix = name.slice(0, 2);

      return (
        depositorPrefix.length >= 2 &&
        namePrefix.length >= 2 &&
        (name.includes(depositorPrefix) || d.includes(namePrefix))
      );
    })
  ) {
    score += 30;
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
    contact_name:
      row.contact_name || row.representative_name || row.ceo_name || "",
    contact_phone: row.contact_phone || row.phone || "",
    amount_krw: Number(row.amount_krw || 0),
    payment_status: row.payment_status,
    application_status: row.application_status,
    created_at: row.created_at,
    score,
    reason,
  };
}

async function findCandidates(
  supabase: any,
  depositAmount: number,
  depositorName: string
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
      amount_krw,
      payment_status,
      application_status,
      created_at
      `
    )
    .neq("application_status", "rejected")
    .eq("payment_status", "waiting")
    .limit(500);

  if (error) throw new Error(error.message);

  const scored = (data || [])
    .map((app: any) => {
      const scored = scoreApplication(app, depositAmount, depositorName);

      return {
        app,
        score: scored.score,
        reason: scored.reason,
      };
    })
    .filter((x: any) => x.score >= 70)
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;

      const aAmount = Number(a.app.amount_krw || 0);
      const bAmount = Number(b.app.amount_krw || 0);

      const aAmountMatch = aAmount === depositAmount ? 1 : 0;
      const bAmountMatch = bAmount === depositAmount ? 1 : 0;

      if (bAmountMatch !== aAmountMatch) return bAmountMatch - aAmountMatch;

      return String(b.app.created_at || "").localeCompare(
        String(a.app.created_at || "")
      );
    });

  const topScore = scored[0]?.score || 0;

  return scored
    .filter((x: any) => x.score >= Math.max(70, topScore - 50))
    .slice(0, 5);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "엑셀 파일이 없습니다.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const supabase = createSupabaseAdminClient();

    const items = [];

    for (const row of rows) {
      const deposit = readDepositRow(row);

      if (!deposit.depositor_name && !deposit.deposit_amount) {
        continue;
      }

      const candidates = await findCandidates(
        supabase,
        deposit.deposit_amount,
        deposit.depositor_name
      );

      items.push({
        matched: false,
        needs_manual_confirm: true,
        depositor_name: deposit.depositor_name,
        deposit_amount: deposit.deposit_amount,
        deposit_date: deposit.deposit_date,
        memo: deposit.memo,
        raw_text: JSON.stringify(row),
        reason:
          candidates.length > 0
            ? "추천 후보 중 맞는 신청 건을 선택해 입금확정하십시오."
            : "추천 후보가 없습니다. 신청 목록에서 직접 확인이 필요합니다.",
        candidates: candidates.map((x: any) =>
          toCandidate(x.app, x.score, x.reason)
        ),
      });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      count: rows.length,
      matched_count: 0,
      need_review_count: items.length,
      rows,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "엑셀 처리 실패",
      },
      { status: 500 }
    );
  }
}