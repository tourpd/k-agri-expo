"use client";

import { useMemo, useState } from "react";

type HanmiProduct = {
  product_name: string;
  image_url?: string;
  detail_url?: string;
  farmer_category?: string;
  source_page?: number;
};

export default function HanmiImportPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<HanmiProduct[]>([]);
  const [message, setMessage] = useState("");
  const [pages, setPages] = useState(5);

  const grouped = useMemo(() => {
    const map: Record<string, HanmiProduct[]> = {};

    for (const item of products) {
      const key = item.farmer_category || "AI 확인 필요";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    return map;
  }, [products]);

  async function loadProducts() {
    try {
      setLoading(true);
      setMessage("한미양행 제품을 불러오는 중입니다...");
      setProducts([]);

      const res = await fetch(`/api/vendor/hanmi-products?pages=${pages}`);
      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "제품 수집 실패");
        return;
      }

      setProducts(json.products || []);
      setMessage(json.message || "");
    } catch (error) {
      console.error(error);
      alert("한미양행 제품 수집 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <section style={S.wrap}>
        <div style={S.kicker}>K-Agri Expo × 한미양행</div>

        <h1 style={S.title}>고객 건강 AI 분석센터</h1>

        <p style={S.desc}>
          한미양행 제품 DB를 불러와 고령 고객에게 필요한 건강 카테고리로
          자동 분류합니다.
        </p>

        <section style={S.controlCard}>
          <label style={S.label}>가져올 페이지 수</label>

          <select
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            style={S.select}
          >
            <option value={5}>테스트 5페이지</option>
            <option value={20}>20페이지</option>
            <option value={60}>60페이지</option>
            <option value={120}>전체 시도 120페이지</option>
          </select>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            style={{
              ...S.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "제품 수집 중..." : "한미양행 제품 불러오기"}
          </button>
        </section>

        {message ? <div style={S.message}>{message}</div> : null}

        {products.length > 0 ? (
          <>
            <section style={S.summaryGrid}>
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} style={S.summaryCard}>
                  <div style={S.summaryTitle}>{category}</div>
                  <div style={S.summaryCount}>{items.length}개</div>
                </div>
              ))}
            </section>

            <section style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>이미지</th>
                    <th style={S.th}>제품명</th>
                    <th style={S.th}>고객 건강 카테고리</th>
                    <th style={S.th}>페이지</th>
                    <th style={S.th}>상세</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((item, index) => (
                    <tr key={`${item.product_name}-${index}`} style={S.tr}>
                      <td style={S.td}>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            style={S.thumb}
                          />
                        ) : (
                          <div style={S.noImage}>없음</div>
                        )}
                      </td>

                      <td style={S.nameTd}>{item.product_name}</td>

                      <td style={S.td}>
                        <span style={S.badge}>
                          {item.farmer_category || "AI 확인 필요"}
                        </span>
                      </td>

                      <td style={S.td}>{item.source_page || "-"}</td>

                      <td style={S.td}>
                        {item.detail_url ? (
                          <a href={item.detail_url} target="_blank" style={S.link}>
                            보기
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f8f3",
    padding: 24,
    color: "#111827",
  },
  wrap: {
    maxWidth: 1320,
    margin: "0 auto",
  },
  kicker: {
    color: "#16a34a",
    fontSize: 15,
    fontWeight: 950,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 42,
    fontWeight: 950,
    letterSpacing: -1,
  },
  desc: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 1.7,
    color: "#4b5563",
    fontWeight: 800,
  },
  controlCard: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    alignItems: "end",
    flexWrap: "wrap",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 22,
    padding: 22,
  },
  label: {
    display: "block",
    fontSize: 15,
    fontWeight: 950,
    color: "#374151",
  },
  select: {
    minWidth: 220,
    marginTop: 8,
    borderRadius: 14,
    border: "2px solid #9ca3af",
    padding: "14px 16px",
    fontSize: 17,
    fontWeight: 900,
    background: "#fff",
  },
  button: {
    border: 0,
    borderRadius: 16,
    background: "#16a34a",
    color: "#fff",
    padding: "16px 24px",
    fontSize: 18,
    fontWeight: 950,
  },
  message: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: "#ecfdf5",
    color: "#166534",
    fontSize: 18,
    fontWeight: 950,
  },
  summaryGrid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#4b5563",
  },
  summaryCount: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: 950,
    color: "#111827",
  },
  tableWrap: {
    marginTop: 24,
    overflowX: "auto",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    background: "#fff",
  },
  table: {
    width: "100%",
    minWidth: 900,
    borderCollapse: "collapse",
  },
  th: {
    background: "#111827",
    color: "#fff",
    padding: 14,
    fontSize: 14,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: 14,
    fontSize: 15,
    fontWeight: 800,
    verticalAlign: "middle",
  },
  nameTd: {
    padding: 14,
    fontSize: 17,
    fontWeight: 950,
    verticalAlign: "middle",
  },
  thumb: {
    width: 70,
    height: 70,
    objectFit: "contain",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  noImage: {
    width: 70,
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    background: "#f8fafc",
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 900,
  },
  badge: {
    display: "inline-flex",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#166534",
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 950,
  },
  link: {
    color: "#16a34a",
    fontWeight: 950,
  },
};