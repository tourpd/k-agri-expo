"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  order_code: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  product_name: string | null;
  quantity: number | null;
  total_amount?: number | null;
  total_amount_krw?: number | null;
  payment_status: string | null;
  order_status?: string | null;
  created_at: string | null;
};

type DepositMatch = {
  raw: string;
  depositor: string;
  amount: number;
  matchedOrder?: Order;
  reason?: string;
};

function won(v?: number | null) {
  return `${Number(v || 0).toLocaleString()}원`;
}

function normalizeName(v?: string | null) {
  return String(v || "").replace(/\s/g, "").trim();
}

function orderAmount(o: Order) {
  return Number(o.total_amount_krw || o.total_amount || 0);
}

function orderTime(o: Order) {
  const t = new Date(o.created_at || "").getTime();
  return Number.isFinite(t) ? t : 0;
}

function isWaitingOrder(o: Order) {
  if (o.payment_status === "paid") return false;
  if (o.order_status === "paid") return false;
  if (o.order_status === "waiting_tracking") return false;
  if (o.order_status === "shipped") return false;
  if (o.order_status === "done") return false;
  if (o.order_status === "completed") return false;
  return true;
}

function parseDepositLine(line: string) {
  const raw = String(line || "").trim();
  const cleaned = raw.replace(/\s+/g, " ");

  const amountMatches = Array.from(cleaned.matchAll(/([0-9][0-9,]*)\s*원?/g));

  let amount = 0;
  if (amountMatches.length > 0) {
    const last = amountMatches[amountMatches.length - 1]?.[1] || "0";
    amount = Number(last.replace(/,/g, ""));
  }

  const nameText = cleaned
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\([^\)]*\)/g, " ")
    .replace(/기업은행|IBK|입금|출금|잔액|원|KRW|알림|통장|계좌|승인|거래/g, " ")
    .replace(/[0-9,]/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = nameText
    .split(" ")
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => v.length >= 2);

  const depositor = tokens[tokens.length - 1] || nameText || "";

  return {
    raw,
    depositor,
    amount,
  };
}

export default function DepositMatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<DepositMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  async function loadOrders() {
    setLoading(true);

    const res = await fetch("/api/admin/photodoctor-orders", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!data?.success) {
      alert(data?.error || "주문 불러오기 실패");
      return;
    }

    const waitingOrders = (data.orders || []).filter((o: Order) =>
      isWaitingOrder(o)
    );

    setOrders(waitingOrders);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const matchedCount = useMemo(() => {
    return matches.filter((m) => m.matchedOrder).length;
  }, [matches]);

  function parseDeposits() {
    const lines = text
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert("입금 문자 또는 카톡 내용을 붙여넣어 주세요.");
      return;
    }

    const result: DepositMatch[] = lines.map((line) => {
      const parsed = parseDepositLine(line);

      if (!parsed.depositor || !parsed.amount) {
        return {
          raw: line,
          depositor: parsed.depositor || "-",
          amount: parsed.amount,
          reason: "입금자명 또는 금액을 읽지 못했습니다.",
        };
      }

      const nameKey = normalizeName(parsed.depositor);

      const candidates = orders
        .filter((o) => {
          const buyerKey = normalizeName(o.buyer_name);
          const sameAmount = orderAmount(o) === parsed.amount;
          const sameName = buyerKey === nameKey;

          return sameName && sameAmount;
        })
        .sort((a, b) => orderTime(b) - orderTime(a));

      if (candidates.length >= 1) {
        return {
          raw: line,
          depositor: parsed.depositor,
          amount: parsed.amount,
          matchedOrder: candidates[0],
          reason:
            candidates.length > 1
              ? `같은 이름과 금액 주문 ${candidates.length}건 중 가장 최근 주문을 선택했습니다.`
              : undefined,
        };
      }

      const amountOnly = orders.filter((o) => orderAmount(o) === parsed.amount);

      const nameOnly = orders.filter((o) => {
        const buyerKey = normalizeName(o.buyer_name);
        return buyerKey === nameKey;
      });

      let reason = "일치 주문 없음";
      if (amountOnly.length > 0 && nameOnly.length === 0) {
        reason = "금액은 같은 주문이 있으나 입금자명이 다릅니다.";
      }
      if (nameOnly.length > 0 && amountOnly.length === 0) {
        reason = "입금자명은 있으나 금액이 다릅니다.";
      }

      return {
        raw: line,
        depositor: parsed.depositor,
        amount: parsed.amount,
        reason,
      };
    });

    setMatches(result);
  }

  async function markPaid(ids: string[]) {
    if (ids.length === 0) {
      alert("처리할 주문이 없습니다.");
      return;
    }

    if (!confirm(`${ids.length}건을 입금확인 처리할까요?`)) return;

    setWorking(true);

    const res = await fetch("/api/admin/photodoctor-orders/batch", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids,
        action: "paid",
      }),
    });

    const data = await res.json().catch(() => null);
    setWorking(false);

    if (!data?.success) {
      alert(data?.error || "처리 실패");
      return;
    }

    alert(`${ids.length}건 입금확인 완료`);

    setText("");
    setMatches([]);
    await loadOrders();
  }

  async function confirmMatched() {
    const ids = Array.from(
      new Set(
        matches.filter((m) => m.matchedOrder).map((m) => m.matchedOrder!.id)
      )
    );

    await markPaid(ids);
  }

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <h1 style={S.title}>💰 입금내역 자동확인센터</h1>

          <p style={S.desc}>
            은행 문자 / 카카오톡 입금내역을 그대로 붙여넣으면{" "}
            <b>입금자명 + 금액</b> 기준으로 가장 최근 입금대기 주문을 찾아냅니다.
          </p>
        </div>

        <div style={S.statWrap}>
          <Stat label="입금대기" value={orders.length} color="#f59e0b" />
          <Stat label="자동매칭" value={matchedCount} color="#16a34a" />
        </div>
      </header>

      <section style={S.card}>
        <div style={S.sectionTitle}>📱 문자 / 카톡 그대로 붙여넣기</div>

        <div style={S.example}>
          예시:
          <br />
          [기업은행] 홍길동 32,000원 입금
          <br />
          김농부 61,000원 입금
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="은행 문자 또는 카카오톡 입금내역을 그대로 붙여넣으세요."
          style={S.textarea}
        />

        <div style={S.mobileBtns}>
          <button type="button" onClick={parseDeposits} style={S.blueBtn}>
            자동 매칭 분석
          </button>

          <button
            type="button"
            onClick={confirmMatched}
            disabled={working}
            style={S.greenBtn}
          >
            {working ? "처리 중..." : "자동매칭 주문 입금확인 처리"}
          </button>
        </div>
      </section>

      <section style={S.card}>
        <div style={S.sectionTitle}>🤖 자동 매칭 결과</div>

        <div style={S.matchList}>
          {matches.length === 0 ? (
            <div style={S.empty}>아직 분석된 입금내역이 없습니다.</div>
          ) : (
            matches.map((m, idx) => (
              <div
                key={`${m.raw}-${idx}`}
                style={{
                  ...S.matchCard,
                  border: m.matchedOrder
                    ? "3px solid #16a34a"
                    : "3px solid #ef4444",
                }}
              >
                <div style={S.raw}>{m.raw}</div>

                <div style={S.infoRow}>
                  <span>분석 입금자</span>
                  <strong>{m.depositor || "-"}</strong>
                </div>

                <div style={S.infoRow}>
                  <span>분석 금액</span>
                  <strong>{won(m.amount)}</strong>
                </div>

                {m.matchedOrder ? (
                  <div style={S.successBox}>
                    ✅ 주문 자동매칭 성공
                    <br />
                    {m.reason && (
                      <>
                        참고: {m.reason}
                        <br />
                      </>
                    )}
                    주문번호: {m.matchedOrder.order_code || "-"}
                    <br />
                    주문자: {m.matchedOrder.buyer_name || "-"}
                    <br />
                    상품: {m.matchedOrder.product_name || "-"}{" "}
                    {m.matchedOrder.quantity || 0}개
                    <br />
                    연락처: {m.matchedOrder.buyer_phone || "-"}
                    <br />
                    결제금액: {won(orderAmount(m.matchedOrder))}
                    <br />
                    접수일: {m.matchedOrder.created_at || "-"}
                  </div>
                ) : (
                  <div style={S.failBox}>❌ {m.reason || "일치 주문 없음"}</div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statLabel, color }}>{label}</div>
      <div style={{ ...S.statValue, color }}>{value}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 14,
    color: "#111827",
  },
  header: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: "clamp(26px, 5vw, 36px)",
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.6,
    color: "#4b5563",
  },
  statWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  stat: {
    minWidth: 100,
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 14,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 900,
  },
  statValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    border: "1px solid #e5e7eb",
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 950,
    marginBottom: 16,
    color: "#111827",
  },
  example: {
    background: "#f9fafb",
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    fontWeight: 850,
    lineHeight: 1.8,
    color: "#374151",
    marginBottom: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 260,
    borderRadius: 20,
    border: "3px solid #2563eb",
    padding: 18,
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.7,
    boxSizing: "border-box",
    resize: "vertical",
    background: "#ffffff",
    color: "#111827",
    caretColor: "#dc2626",
    outline: "none",
    position: "relative",
    zIndex: 10,
    pointerEvents: "auto",
  },
  mobileBtns: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 12,
  },
  blueBtn: {
    minHeight: 68,
    borderRadius: 18,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },
  greenBtn: {
    minHeight: 68,
    borderRadius: 18,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },
  matchList: {
    display: "grid",
    gap: 14,
  },
  matchCard: {
    borderRadius: 22,
    background: "#ffffff",
    padding: 18,
  },
  raw: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.6,
    marginBottom: 14,
    color: "#111827",
    wordBreak: "break-all",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 850,
  },
  successBox: {
    marginTop: 14,
    background: "#dcfce7",
    borderRadius: 16,
    padding: 16,
    color: "#166534",
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1.8,
  },
  failBox: {
    marginTop: 14,
    background: "#fee2e2",
    borderRadius: 16,
    padding: 16,
    color: "#991b1b",
    fontSize: 17,
    fontWeight: 950,
  },
  empty: {
    padding: 40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: 850,
    color: "#6b7280",
  },
};