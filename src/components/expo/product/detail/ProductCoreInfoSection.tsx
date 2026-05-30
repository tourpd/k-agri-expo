import React from "react";

type Props = {
  usageCrops?: string | null;
  usageTiming?: string | null;
  usageSummary?: string | null;
  calcBaseWaterLiter?: number | null;
  calcBaseProductMl?: number | null;
};

export default function ProductCoreInfoSection({
  usageCrops,
  usageTiming,
  usageSummary,
  calcBaseWaterLiter,
  calcBaseProductMl,
}: Props) {
  return (
    <section style={S.infoCard}>
      <div style={S.infoTitle}>핵심 사용 기준</div>

      <div style={S.infoRow}>
        <b>적용 작물</b>
        <span>{usageCrops || "-"}</span>
      </div>

      <div style={S.infoRow}>
        <b>사용 시기</b>
        <span>{usageTiming || "-"}</span>
      </div>

      <div style={S.infoRow}>
        <b>사용 기준</b>
        <span>
          {usageSummary ||
            `물 ${calcBaseWaterLiter || "-"}L / 제품 ${calcBaseProductMl || "-"}ml`}
        </span>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  infoCard: {
    background: "#f8fafc",
    padding: 18,
    marginBottom: 20,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
  },

  infoTitle: {
    fontWeight: 900,
    fontSize: 18,
    marginBottom: 12,
    color: "#111827",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 10,
    paddingBottom: 10,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 15,
    lineHeight: 1.7,
  },
};