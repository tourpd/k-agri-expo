"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type Product = {
  product_id: string;
  name: string;
  slug: string | null;
  company_name: string | null;
  vendor_target: string | null;
  price_krw: number | null;
  shipping_fee_krw: number | null;
  unit_label: string | null;
  volume_text: string | null;
  coverage_per_unit: number | null;
  usage_text: string | null;
  caution_text: string | null;
  image_url: string | null;
  product_type: string | null;
  active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function won(v?: number | null) {
  return `${Number(v || 0).toLocaleString()}원`;
}

function safe(v?: string | null) {
  return v && v.trim() ? v.trim() : "";
}

export default function AdminPhotoDoctorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => {
    return products.find((p) => p.product_id === selectedId) || products[0] || null;
  }, [products, selectedId]);

  async function loadProducts() {
    setLoading(true);

    const res = await fetch("/api/admin/photodoctor-products", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    setLoading(false);

    if (!data?.success) {
      alert(data?.error || "포토닥터 상품을 불러오지 못했습니다.");
      return;
    }

    const list = (data.products || []) as Product[];
    setProducts(list);

    if (!selectedId && list[0]?.product_id) {
      setSelectedId(list[0].product_id);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField<K extends keyof Product>(key: K, value: Product[K]) {
    if (!selected) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === selected.product_id
          ? {
              ...p,
              [key]: value,
            }
          : p
      )
    );
  }

  async function saveProduct() {
    if (!selected) return;

    if (!safe(selected.name)) {
      alert("상품명을 입력해 주세요.");
      return;
    }

    if (!safe(selected.slug)) {
      alert("slug를 입력해 주세요. 예: melgyuni");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/admin/photodoctor-products", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selected),
    });

    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!data?.success) {
      alert(data?.error || "저장에 실패했습니다.");
      return;
    }

    alert("저장되었습니다.");
    loadProducts();
  }

  const activeCount = products.filter((p) => p.active).length;

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <h1 style={S.title}>포토닥터 상품 관리</h1>
          <p style={S.desc}>
            멸규니·싹쓰리충·총나와·달아웃의 가격, 배송비, 평수 기준, 사용법을 관리합니다.
          </p>
        </div>

        <div style={S.headerRight}>
          <div style={S.countBox}>
            <div style={S.countLabel}>전체 상품</div>
            <div style={S.countValue}>{products.length}</div>
          </div>

          <div style={S.countBoxGreen}>
            <div style={S.countLabel}>노출중</div>
            <div style={S.countValue}>{activeCount}</div>
          </div>

          <button type="button" onClick={saveProduct} disabled={!selected || saving} style={S.saveBtn}>
            {saving ? "저장 중..." : "상품 정보 저장"}
          </button>
        </div>
      </header>

      <section style={S.body}>
        <aside style={S.left}>
          <div style={S.leftTop}>
            <div style={S.leftTitle}>상품 목록</div>
            <button type="button" onClick={loadProducts} style={S.reloadBtn}>
              새로고침
            </button>
          </div>

          {loading ? (
            <div style={S.empty}>불러오는 중...</div>
          ) : products.length === 0 ? (
            <div style={S.empty}>등록된 상품이 없습니다.</div>
          ) : (
            <div style={S.productList}>
              {products.map((p) => (
                <button
                  key={p.product_id}
                  type="button"
                  onClick={() => setSelectedId(p.product_id)}
                  style={{
                    ...S.productCard,
                    border:
                      selected?.product_id === p.product_id
                        ? "2px solid #16a34a"
                        : "1px solid #e5e7eb",
                  }}
                >
                  <div style={S.productCardTop}>
                    <div style={S.productName}>{p.name}</div>
                    <span style={p.active ? S.badgeOn : S.badgeOff}>
                      {p.active ? "노출" : "숨김"}
                    </span>
                  </div>

                  <div style={S.productMeta}>
                    {won(p.price_krw)} / {p.volume_text || "-"}
                  </div>

                  <div style={S.productMeta}>
                    1{p.unit_label || "개"}당 {Number(p.coverage_per_unit || 0).toLocaleString()}평
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section style={S.right}>
          {!selected ? (
            <div style={S.bigEmpty}>상품을 선택하세요.</div>
          ) : (
            <>
              <section style={S.card}>
                <div style={S.cardHead}>
                  <div>
                    <div style={S.kicker}>포토닥터 추천/주문 상품</div>
                    <h2 style={S.cardTitle}>{selected.name}</h2>
                  </div>

                  <div style={selected.active ? S.statusOn : S.statusOff}>
                    {selected.active ? "현재 노출중" : "현재 숨김"}
                  </div>
                </div>

                <div style={S.grid}>
                  <Field label="상품명">
                    <input
                      value={selected.name || ""}
                      onChange={(e) => updateField("name", e.target.value)}
                      style={S.input}
                    />
                  </Field>

                  <Field label="slug">
                    <input
                      value={selected.slug || ""}
                      onChange={(e) => updateField("slug", e.target.value)}
                      style={S.input}
                    />
                  </Field>

                  <Field label="업체명">
                    <input
                      value={selected.company_name || ""}
                      onChange={(e) => updateField("company_name", e.target.value)}
                      style={S.input}
                    />
                  </Field>

                  <Field label="업체 코드">
                    <input
                      value={selected.vendor_target || ""}
                      onChange={(e) => updateField("vendor_target", e.target.value)}
                      style={S.input}
                    />
                  </Field>

                  <Field label="판매가">
                    <input
                      type="number"
                      value={selected.price_krw || 0}
                      onChange={(e) => updateField("price_krw", Number(e.target.value))}
                      style={S.input}
                    />
                  </Field>

                  <Field label="배송비">
                    <input
                      type="number"
                      value={selected.shipping_fee_krw || 0}
                      onChange={(e) => updateField("shipping_fee_krw", Number(e.target.value))}
                      style={S.input}
                    />
                  </Field>

                  <Field label="단위">
                    <input
                      value={selected.unit_label || ""}
                      onChange={(e) => updateField("unit_label", e.target.value)}
                      style={S.input}
                      placeholder="예: 병, 봉, 세트"
                    />
                  </Field>

                  <Field label="용량">
                    <input
                      value={selected.volume_text || ""}
                      onChange={(e) => updateField("volume_text", e.target.value)}
                      style={S.input}
                      placeholder="예: 500ml"
                    />
                  </Field>

                  <Field label="1개당 처리 평수">
                    <input
                      type="number"
                      value={selected.coverage_per_unit || 0}
                      onChange={(e) => updateField("coverage_per_unit", Number(e.target.value))}
                      style={S.input}
                    />
                  </Field>

                  <Field label="상품 유형">
                    <input
                      value={selected.product_type || ""}
                      onChange={(e) => updateField("product_type", e.target.value)}
                      style={S.input}
                      placeholder="fungal / insect / trap / slug"
                    />
                  </Field>

                  <Field label="노출 여부">
                    <select
                      value={selected.active ? "true" : "false"}
                      onChange={(e) => updateField("active", e.target.value === "true")}
                      style={S.input}
                    >
                      <option value="true">노출</option>
                      <option value="false">숨김</option>
                    </select>
                  </Field>

                  <Field label="이미지 URL">
                    <input
                      value={selected.image_url || ""}
                      onChange={(e) => updateField("image_url", e.target.value)}
                      style={S.input}
                    />
                  </Field>
                </div>
              </section>

              <section style={S.card}>
                <h3 style={S.sectionTitle}>평수 계산 기준</h3>

                <div style={S.calcBox}>
                  <div>
                    <div style={S.calcLabel}>현재 기준</div>
                    <div style={S.calcValue}>
                      {selected.volume_text || "-"} 1{selected.unit_label || "개"}당{" "}
                      {Number(selected.coverage_per_unit || 0).toLocaleString()}평
                    </div>
                  </div>

                  <div>
                    <div style={S.calcLabel}>예시</div>
                    <div style={S.calcValue}>
                      600평 입력 시{" "}
                      {Math.max(
                        1,
                        Math.ceil(600 / Number(selected.coverage_per_unit || 300))
                      )}
                      {selected.unit_label || "개"} 추천
                    </div>
                  </div>
                </div>
              </section>

              <section style={S.card}>
                <h3 style={S.sectionTitle}>사용 안내 문구</h3>

                <Field label="사용법">
                  <textarea
                    value={selected.usage_text || ""}
                    onChange={(e) => updateField("usage_text", e.target.value)}
                    style={S.textarea}
                  />
                </Field>

                <Field label="주의사항">
                  <textarea
                    value={selected.caution_text || ""}
                    onChange={(e) => updateField("caution_text", e.target.value)}
                    style={S.textarea}
                  />
                </Field>
              </section>

              <section style={S.card}>
                <h3 style={S.sectionTitle}>주문 페이지 미리보기 값</h3>

                <div style={S.preview}>
                  <div style={S.previewName}>{selected.name}</div>
                  <div style={S.previewPrice}>{won(selected.price_krw)}</div>
                  <div style={S.previewText}>
                    {selected.volume_text || "-"} / 배송비 {won(selected.shipping_fee_krw)}
                  </div>
                  <div style={S.previewText}>
                    1{selected.unit_label || "개"}당 약{" "}
                    {Number(selected.coverage_per_unit || 0).toLocaleString()}평
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={S.field}>
      <div style={S.label}>{label}</div>
      {children}
    </label>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    color: "#111827",
    padding: 24,
  },
  header: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 38,
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },
  desc: {
    marginTop: 8,
    color: "#4b5563",
    fontSize: 16,
    fontWeight: 800,
  },
  headerRight: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  countBox: {
    minWidth: 100,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "12px 16px",
    textAlign: "center",
  },
  countBoxGreen: {
    minWidth: 100,
    borderRadius: 18,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    padding: "12px 16px",
    textAlign: "center",
  },
  countLabel: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: 900,
  },
  countValue: {
    marginTop: 4,
    color: "#111827",
    fontSize: 28,
    fontWeight: 950,
  },
  saveBtn: {
    minHeight: 62,
    border: "none",
    borderRadius: 18,
    background: "#16a34a",
    color: "#ffffff",
    padding: "0 28px",
    fontSize: 20,
    fontWeight: 950,
    cursor: "pointer",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 20,
    alignItems: "start",
  },
  left: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 18,
    position: "sticky",
    top: 20,
  },
  leftTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  leftTitle: {
    fontSize: 26,
    fontWeight: 950,
  },
  reloadBtn: {
    minHeight: 40,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#ffffff",
    color: "#111827",
    padding: "0 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  productList: {
    display: "grid",
    gap: 12,
  },
  productCard: {
    width: "100%",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    textAlign: "left",
    cursor: "pointer",
  },
  productCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  productName: {
    color: "#111827",
    fontSize: 23,
    fontWeight: 950,
  },
  productMeta: {
    marginTop: 8,
    color: "#374151",
    fontSize: 15,
    fontWeight: 800,
  },
  badgeOn: {
    flex: "0 0 auto",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 950,
  },
  badgeOff: {
    flex: "0 0 auto",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 950,
  },
  right: {
    display: "grid",
    gap: 18,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 20,
  },
  kicker: {
    color: "#166534",
    fontSize: 14,
    fontWeight: 950,
  },
  cardTitle: {
    margin: "6px 0 0",
    color: "#111827",
    fontSize: 36,
    fontWeight: 950,
  },
  statusOn: {
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    padding: "10px 14px",
    fontWeight: 950,
  },
  statusOff: {
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 14px",
    fontWeight: 950,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
  },
  field: {
    display: "grid",
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: "#374151",
    fontSize: 15,
    fontWeight: 900,
  },
  input: {
    minHeight: 56,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    background: "#ffffff",
    color: "#111827",
    padding: "0 14px",
    fontSize: 17,
    fontWeight: 800,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    background: "#ffffff",
    color: "#111827",
    padding: 14,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#111827",
    fontSize: 26,
    fontWeight: 950,
  },
  calcBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 14,
  },
  calcLabel: {
    color: "#6b7280",
    fontWeight: 900,
  },
  calcValue: {
    marginTop: 8,
    borderRadius: 18,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: 18,
    color: "#111827",
    fontSize: 22,
    fontWeight: 950,
  },
  preview: {
    borderRadius: 22,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: 20,
  },
  previewName: {
    color: "#111827",
    fontSize: 32,
    fontWeight: 950,
  },
  previewPrice: {
    marginTop: 10,
    color: "#dc2626",
    fontSize: 34,
    fontWeight: 950,
  },
  previewText: {
    marginTop: 8,
    color: "#374151",
    fontSize: 17,
    fontWeight: 800,
  },
  empty: {
    borderRadius: 18,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: 20,
    color: "#374151",
    fontWeight: 900,
    textAlign: "center",
  },
  bigEmpty: {
    borderRadius: 24,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: 50,
    color: "#111827",
    fontSize: 24,
    fontWeight: 950,
    textAlign: "center",
  },
};