"use client";

import { useEffect, useState } from "react";

type RecommendItem = {
  product_name: string;
  button_link?: string | null;
  recommend_label?: string | null;
  recommend_reason?: string | null;
  usage_summary?: string | null;
};

type Props = {
  cropName?: string | null;
  issueType?: string | null;
  diagnosisId?: string | null;
};

function makeHref(
  item: RecommendItem,
  cropText: string,
  diagnosisText: string,
  diagnosisId?: string | null
) {
  const base =
    item.button_link ||
    `/photodoctor/buy?product=${encodeURIComponent(item.product_name)}`;

  if (base.startsWith("http")) return base;

  const url = new URL(base, window.location.origin);

  url.searchParams.set("source", "photodoctor");
  if (cropText) url.searchParams.set("crop", cropText);
  if (diagnosisText) url.searchParams.set("diagnosis", diagnosisText);
  if (diagnosisId) url.searchParams.set("diagnosis_id", diagnosisId);

  return `${url.pathname}${url.search}`;
}

export default function PhotoDoctorRecommendedBooths({
  cropName,
  issueType,
  diagnosisId,
}: Props) {
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);

  const diagnosisText = String(issueType || "").trim();
  const cropText = String(cropName || "").trim();

  useEffect(() => {
    async function load() {
      if (!diagnosisText) return;

      setLoading(true);
      setItems([]);

      try {
        const res = await fetch("/api/photodoctor/recommend-booths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop_name: cropText,
            issue_type: diagnosisText,
            diagnosis_text: diagnosisText,
            diagnosis_id: diagnosisId || "",
            limit: 3,
          }),
        });

        const json = await res.json();

        if (json?.success && Array.isArray(json.items)) {
          setItems(json.items.slice(0, 3));
        }
      } catch (error) {
        console.error("포토닥터 추천 자재 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cropText, diagnosisText, diagnosisId]);

  if (!diagnosisText) return null;
  if (!loading && items.length === 0) return null;

  return (
    <section style={S.wrap}>
      <div style={S.kicker}>포토닥터 진단 연계</div>

      <div style={S.title}>🌱 추천 대응 자재</div>

      <p style={S.desc}>
        위 진단 결과를 기준으로 현장에서 확인해볼 수 있는 대응 자재입니다.
        필요할 때만 눌러 확인하세요.
      </p>

      {loading ? (
        <div style={S.loading}>추천 대응 자재를 확인하는 중입니다...</div>
      ) : (
        <div style={S.buttonList}>
          {items.map((item, idx) => (
            <a
              key={`${item.product_name}-${idx}`}
              href={makeHref(item, cropText, diagnosisText, diagnosisId)}
              style={S.button}
            >
              <div>
                <div style={S.productName}>{item.product_name}</div>

                <div style={S.productSub}>
                  {item.recommend_label ||
                    item.usage_summary ||
                    "이 진단 결과와 연결된 대응 자재"}
                </div>
              </div>

              <span style={S.arrow}>›</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
  },

  kicker: {
    fontSize: 13,
    fontWeight: 900,
    color: "#15803d",
    marginBottom: 6,
  },

  title: {
    fontSize: 22,
    fontWeight: 950,
    color: "#166534",
  },

  desc: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.7,
    color: "#374151",
    fontWeight: 700,
  },

  loading: {
    marginTop: 16,
    borderRadius: 14,
    background: "#ffffff",
    padding: 14,
    color: "#4b5563",
    fontWeight: 800,
  },

  buttonList: {
    marginTop: 16,
    display: "grid",
    gap: 10,
  },

  button: {
    minHeight: 60,
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "#ffffff",
    color: "#14532d",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 16px",
  },

  productName: {
    fontSize: 18,
    fontWeight: 950,
    color: "#14532d",
  },

  productSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#4b5563",
    fontWeight: 800,
  },

  arrow: {
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 900,
    color: "#15803d",
  },
};