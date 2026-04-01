// src/app/expo/[dealId]/DealUrgencyClient.tsx
"use client";

import React from "react";
import LeadFormClient from "./LeadFormClient";

type DealRow = {
  deal_id: string;
  end_at: string | null;
  stock: number | null;
  consulting_count: number | null;
};

function safeDateStr(s: string | null) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("ko-KR");
}

function msToDHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${d}일 ${h}시간 ${m}분 ${ss}초`;
}

export default function DealUrgencyClient(props: {
  deal: DealRow;
  code?: string;
}) {
  const { deal } = props;

  const endAt = deal.end_at ? new Date(deal.end_at) : null;
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [consulting, setConsulting] = React.useState<number>(
    () => deal.consulting_count ?? 0
  );

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = endAt ? endAt.getTime() - now.getTime() : 0;
  const stock = deal.stock ?? 0;
  const soldOut = stock <= 0;

  return (
    <>
      <div style={urgentBox}>
        <div style={urgentRow}>
          <div style={urgentItem}>
            <div style={urgentLabel}>잔여 수량</div>
            <div style={urgentValue}>
              {stock}대{" "}
              {soldOut ? (
                <span style={badgeSoldOut}>품절</span>
              ) : (
                <span style={badgeOn}>진행중</span>
              )}
            </div>
          </div>

          <div style={urgentItem}>
            <div style={urgentLabel}>행사 마감</div>
            <div style={urgentValue}>
              {endAt ? msToDHMS(remainingMs) : "-"}
            </div>
            <div style={urgentSub}>
              {safeDateStr(deal.end_at) ? `(${safeDateStr(deal.end_at)})` : ""}
            </div>
          </div>

          <div style={urgentItem}>
            <div style={urgentLabel}>지금 상담</div>
            <div style={urgentValue}>{consulting}건 진행 중</div>
            <div style={urgentSub}>상담 신청이 누적되면 자동 증가</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950 }}>
          무료 상담 신청
        </h2>
        <div
          style={{ marginTop: 8, fontSize: 15, color: "#666", lineHeight: 1.5 }}
        >
          연락처를 남기면 업체에서 순차적으로 연락드립니다.
        </div>

        <LeadFormClient
          deal_id={deal.deal_id}
          membership_used={false}
          onSuccess={() => setConsulting((v) => v + 1)}
        />
      </div>
    </>
  );
}

/* ===== styles ===== */
const urgentBox: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 18,
  border: "1px solid #fecaca",
  background: "#fff7ed",
};

const urgentRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 12,
};

const urgentItem: React.CSSProperties = {
  border: "1px solid #fde68a",
  background: "#ffffff",
  borderRadius: 16,
  padding: 14,
};

const urgentLabel: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  opacity: 0.75,
};

const urgentValue: React.CSSProperties = {
  marginTop: 8,
  fontSize: 20,
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const urgentSub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: "#6b7280",
  fontWeight: 700,
};

const badgeOn: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const badgeSoldOut: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#f3f4f6",
  color: "#9ca3af",
  fontWeight: 950,
  fontSize: 13,
  whiteSpace: "nowrap",
};