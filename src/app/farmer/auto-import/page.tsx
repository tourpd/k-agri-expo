"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FarmerProductCandidate = {
  temp_id: string;
  product_name: string;
  category?: string;
  origin_region?: string;
  unit_label?: string;
  price_krw?: number;
  short_description?: string;
  processing_type?: string;
  storage_method?: string;
  shipping_method?: string;
  selling_point?: string;
  legal_notice?: string;
};

export default function FarmerAutoImportPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<FarmerProductCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  const selectedProducts = useMemo(
    () => products.filter((item) => selectedIds[item.temp_id]),
    [products, selectedIds],
  );

  const allSelected = products.length > 0 && selectedProducts.length === products.length;

  async function handleImport() {
    if (!websiteUrl.trim()) {
      alert("홈페이지 주소를 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setProducts([]);
      setSelectedIds({});

      const res = await fetch("/api/farmer/auto-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          website_url: websiteUrl.trim(),
          import_mode: "farmer_homepage",
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "농민 상품 자동 추출 실패");
        return;
      }

      const list = (json.products || []) as FarmerProductCandidate[];

      setProducts(list);
      setSelectedIds(
        Object.fromEntries(list.map((item) => [item.temp_id, true])),
      );
      setMessage(json.message || "");
    } catch (error) {
      console.error(error);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds({});
      return;
    }

    setSelectedIds(Object.fromEntries(products.map((item) => [item.temp_id, true])));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  async function handleSaveProducts() {
    if (selectedProducts.length === 0) {
      alert("등록할 상품을 하나 이상 선택하세요.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/farmer/products/bulk-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url: websiteUrl.trim(),
          products: selectedProducts,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "상품 등록 실패");
        return;
      }

      alert(`${selectedProducts.length}개 상품을 등록했습니다.`);
      location.href = "/farmer/products";
    } catch (error) {
      console.error(error);
      alert("상품 등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.page}>
      <section style={S.wrap}>
        <Link href="/farmer/dashboard" style={S.backBtn}>
          ← 농민 운영센터로 돌아가기
        </Link>

        <section style={S.hero}>
          <div style={S.kicker}>K-Agri Expo 농민 자동등록</div>
          <h1 style={S.title}>AI 농민 상품 자동등록센터</h1>
          <p style={S.desc}>
            농장·영농조합·농업회사법인 홈페이지 주소를 입력하면 AI가 농산물,
            가공식품, 축산물, 막걸리, 선물세트, 체험상품 후보를 자동으로 찾아냅니다.
          </p>
        </section>

        <section style={S.card}>
          <h2 style={S.cardTitle}>홈페이지 주소 입력</h2>
          <p style={S.guide}>
            예: 홍성 한우 농장, 마늘 농가, 사과즙 가공업체, 막걸리 양조장,
            영농조합법인 홈페이지
          </p>

          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            type="text"
            placeholder="예: https://www.farm.co.kr"
            style={S.input}
          />

          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            style={{
              ...S.primaryBtn,
              opacity: loading ? 0.65 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "AI가 상품을 찾는 중..." : "AI 상품 자동 추출 시작"}
          </button>
        </section>

        {message ? (
          <section style={S.resultCard}>
            <div style={S.resultHeader}>
              <div>
                <h2 style={S.resultTitle}>{message}</h2>
                <div style={S.resultCount}>
                  발견 상품 수: {products.length}개 · 선택 상품 수:{" "}
                  {selectedProducts.length}개
                </div>
              </div>

              <button type="button" onClick={toggleAll} style={S.smallBtn}>
                {allSelected ? "전체 해제" : "전체 선택"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveProducts}
              disabled={saving || selectedProducts.length === 0}
              style={{
                ...S.saveBtn,
                opacity: saving || selectedProducts.length === 0 ? 0.6 : 1,
                cursor:
                  saving || selectedProducts.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "상품 등록 중..." : "선택 상품 등록하기"}
            </button>

            <div style={S.productList}>
              {products.map((item) => {
                const checked = !!selectedIds[item.temp_id];

                return (
                  <div
                    key={item.temp_id}
                    style={{
                      ...S.productCard,
                      borderColor: checked ? "#16a34a" : "#e5e7eb",
                      background: checked ? "#f0fdf4" : "#ffffff",
                    }}
                  >
                    <div style={S.productTop}>
                      <label style={S.checkLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(item.temp_id)}
                          style={S.checkbox}
                        />
                        <span>등록 선택</span>
                      </label>

                      <div style={S.badge}>후보</div>
                    </div>

                    <div style={S.productName}>{item.product_name}</div>
                    <div style={S.productCategory}>
                      {item.category || "AI 확인 필요"}
                    </div>

                    <p style={S.productDesc}>
                      {item.short_description || "상품 설명이 필요합니다."}
                    </p>

                    <div style={S.detailGrid}>
                      <Detail label="원산지" value={item.origin_region || "-"} />
                      <Detail label="단위" value={item.unit_label || "-"} />
                      <Detail
                        label="가격"
                        value={
                          typeof item.price_krw === "number"
                            ? `${item.price_krw.toLocaleString("ko-KR")}원`
                            : "-"
                        }
                      />
                      <Detail label="가공방식" value={item.processing_type || "-"} />
                      <Detail label="보관방법" value={item.storage_method || "-"} />
                      <Detail label="배송방식" value={item.shipping_method || "-"} />
                    </div>

                    {item.selling_point ? (
                      <div style={S.sellingBox}>
                        <b>소비자 소구점</b>
                        <p>{item.selling_point}</p>
                      </div>
                    ) : null}

                    {item.legal_notice ? (
                      <div style={S.noticeBox}>
                        <b>판매 전 확인사항</b>
                        <p>{item.legal_notice}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.detailItem}>
      <div style={S.detailLabel}>{label}</div>
      <div style={S.detailValue}>{value}</div>
    </div>
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
    maxWidth: 1120,
    margin: "0 auto",
  },
  backBtn: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "13px 17px",
    fontSize: 16,
    fontWeight: 900,
  },
  hero: {
    marginTop: 18,
    borderRadius: 30,
    background: "#14532d",
    padding: 34,
    color: "#ffffff",
  },
  kicker: {
    fontSize: 15,
    fontWeight: 950,
    color: "#bbf7d0",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 42,
    lineHeight: 1.15,
    fontWeight: 950,
    color: "#ffffff",
  },
  desc: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#ecfdf5",
  },
  card: {
    marginTop: 24,
    padding: 30,
    borderRadius: 26,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.25,
    fontWeight: 950,
    color: "#111827",
  },
  guide: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#4b5563",
  },
  input: {
    marginTop: 20,
    width: "100%",
    boxSizing: "border-box",
    padding: "20px 22px",
    borderRadius: 16,
    border: "2px solid #9ca3af",
    background: "#ffffff",
    color: "#111827",
    fontSize: 20,
    fontWeight: 900,
    outline: "none",
  },
  primaryBtn: {
    marginTop: 22,
    width: "100%",
    border: 0,
    borderRadius: 20,
    background: "#16a34a",
    color: "#ffffff",
    padding: "22px 30px",
    fontSize: 24,
    fontWeight: 950,
  },
  resultCard: {
    marginTop: 24,
    padding: 30,
    borderRadius: 26,
    background: "#ffffff",
    border: "1px solid #d1d5db",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  resultTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 950,
    color: "#111827",
  },
  resultCount: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: 950,
    color: "#16a34a",
  },
  smallBtn: {
    border: "1px solid #16a34a",
    background: "#ecfdf5",
    color: "#166534",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 16,
    fontWeight: 950,
  },
  saveBtn: {
    marginTop: 20,
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#111827",
    color: "#ffffff",
    padding: "20px 24px",
    fontSize: 22,
    fontWeight: 950,
  },
  productList: {
    marginTop: 22,
    display: "grid",
    gap: 18,
  },
  productCard: {
    border: "2px solid #e5e7eb",
    borderRadius: 22,
    padding: 22,
    background: "#ffffff",
  },
  productTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
  },
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: 17,
    fontWeight: 950,
    color: "#111827",
    cursor: "pointer",
  },
  checkbox: {
    width: 24,
    height: 24,
    accentColor: "#16a34a",
  },
  productName: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },
  productCategory: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 900,
    color: "#16a34a",
  },
  badge: {
    borderRadius: 999,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 950,
  },
  productDesc: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#4b5563",
  },
  detailGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
  },
  detailItem: {
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 14,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#6b7280",
  },
  detailValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: 950,
    color: "#111827",
  },
  sellingBox: {
    marginTop: 16,
    borderRadius: 16,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    padding: 16,
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#78350f",
  },
  noticeBox: {
    marginTop: 12,
    borderRadius: 16,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    padding: 16,
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#9f1239",
  },
};