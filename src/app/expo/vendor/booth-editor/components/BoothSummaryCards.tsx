"use client";

import React from "react";

type BoothSummaryCardsProps = {
  companyName: string;
  boothName: string;
  hallLabelText: string;
  slotCode: string;
  statusLabel: string;
  productCount: number;
};

export default function BoothSummaryCards({
  companyName,
  boothName,
  hallLabelText,
  slotCode,
  statusLabel,
  productCount,
}: BoothSummaryCardsProps) {
  return (
    <section style={S.summaryGrid} className="booth-editor-summary">
      <div style={S.summaryCard}>
        <div style={S.summaryLabel}>업체명</div>
        <div style={S.summaryValue}>{companyName}</div>
        <div style={S.summarySub}>현재 로그인한 업체 기준</div>
      </div>

      <div style={S.summaryCard}>
        <div style={S.summaryLabel}>부스명</div>
        <div style={S.summaryValue}>{boothName}</div>
        <div style={S.summarySub}>농민에게 보일 이름</div>
      </div>

      <div style={S.summaryCard}>
        <div style={S.summaryLabel}>전시장 위치</div>
        <div style={S.summaryValue}>{hallLabelText}</div>
        <div style={S.summarySub}>부스 위치 {slotCode}</div>
      </div>

      <div style={S.summaryCard}>
        <div style={S.summaryLabel}>현재 상태</div>
        <div style={S.summaryValue}>{statusLabel}</div>
        <div style={S.summarySub}>등록 제품 {productCount}개</div>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.25,
    wordBreak: "break-word",
  },
  summarySub: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 1.7,
    color: "#64748b",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
};