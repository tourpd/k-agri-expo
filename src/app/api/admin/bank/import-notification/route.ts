import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔥 본인 핸드폰 인증 (간단 보안)
const TRUSTED_PHONE = "01082161253";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

// 🔥 금액 추출 (여러 케이스 대응)
function extractAmount(text: string) {
  const patterns = [
    /([0-9]{1,3}(?:,[0-9]{3})+)원/, // 1,000원
    /([0-9]+)원/, // 1000원
    /금액[:\s]*([0-9,]+)/,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      return Number(m[1].replace(/,/g, ""));
    }
  }

  return 0;
}

// 🔥 입금자 추출 (은행별 대응)
function extractDepositor(text: string) {
  const patterns = [
    /입금자[:\s]*([^\n\r,]+)/,
    /보낸분[:\s]*([^\n\r,]+)/,
    /송금인[:\s]*([^\n\r,]+)/,
    /([가-힣]{2,5})\s*[0-9,]+원/, // "홍길동 600,000원"
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      return m[1].trim();
    }
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const notificationText = String(body.notification_text || "").trim();
    const appName = String(body.app_name || "").trim();
    const receivedAt = body.received_at || new Date().toISOString();
    const phone = String(body.phone || "").replace(/-/g, "");

    // 🔥 1. 보안 체크
    if (phone !== TRUSTED_PHONE) {
      return jsonError("허용되지 않은 디바이스입니다.", 403);
    }

    if (!notificationText) {
      return jsonError("notification_text가 필요합니다.");
    }

    // 🔥 2. 파싱
    const amount = extractAmount(notificationText);
    const depositor = extractDepositor(notificationText);

    if (!amount) {
      return jsonError("금액 추출 실패", 400);
    }

    const supabase = createSupabaseAdminClient();

    // 🔥 3. 중복 방지 (금액 + 시간 기준)
    const { data: existing } = await supabase
      .from("bank_transactions")
      .select("tx_id")
      .eq("amount_krw", amount)
      .gte("created_at", new Date(Date.now() - 1000 * 60 * 3).toISOString()); // 최근 3분

    if (existing && existing.length > 0) {
      return Response.json({
        success: true,
        skipped: true,
        reason: "중복 가능성 있음",
      });
    }

    // 🔥 4. 저장
    const { data, error } = await supabase
      .from("bank_transactions")
      .insert({
        amount_krw: amount,
        depositor_name: depositor || null,
        deposited_at: receivedAt,
        matched: false,
        raw_data: {
          source: "phone_notification",
          app_name: appName,
          notification_text: notificationText,
          received_at: receivedAt,
        },
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "입금 로그 저장 실패", 500);
    }

    // 🔥 5. 자동 매칭 실행
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/bank/match`, {
        method: "POST",
      });
    } catch {
      // 실패해도 무시 (매칭은 나중에도 가능)
    }

    return Response.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "알림 처리 실패",
      500
    );
  }
}