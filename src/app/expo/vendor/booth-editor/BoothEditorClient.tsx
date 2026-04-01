"use client";

import React, { useMemo, useState } from "react";

type Vendor = {
  vendor_id: string;
  user_id: string;
  company_name?: string | null;
};

type Booth = {
  booth_id: string;
  vendor_id: string;
  name?: string | null;
  region?: string | null;
  category_primary?: string | null;
  intro?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  hall_id?: string | null;
};

type Product = {
  product_id: string;
  booth_id: string;
  name?: string | null;
  description?: string | null;
  price_text?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

export default function BoothEditorClient({
  vendor,
  booth,
  initialProducts,
}: {
  vendor: Vendor;
  booth: Booth;
  initialProducts: Product[];
}) {
  const [savingBooth, setSavingBooth] = useState(false);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [boothForm, setBoothForm] = useState({
    name: booth.name ?? "",
    region: booth.region ?? "",
    category_primary: booth.category_primary ?? "",
    intro: booth.intro ?? "",
    description: booth.description ?? "",
    phone: booth.phone ?? "",
    email: booth.email ?? "",
    hall_id: booth.hall_id ?? "",
  });

  const [products, setProducts] = useState<Product[]>(
    initialProducts.length > 0
      ? initialProducts
      : [
          {
            product_id: "new-1",
            booth_id: booth.booth_id,
            name: "",
            description: "",
            price_text: "",
            sort_order: 1,
            is_active: true,
          },
        ]
  );

  const activeCount = useMemo(
    () => products.filter((p) => p.is_active !== false).length,
    [products]
  );

  function updateBoothField(key: keyof typeof boothForm, value: string) {
    setBoothForm((prev) => ({ ...prev, [key]: value }));
  }

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      {
        product_id: `new-${Date.now()}`,
        booth_id: booth.booth_id,
        name: "",
        description: "",
        price_text: "",
        sort_order: prev.length + 1,
        is_active: true,
      },
    ]);
  }

  function updateProduct(idx: number, patch: Partial<Product>) {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  async function saveBooth() {
    setMessage("");
    setSavingBooth(true);

    try {
      const res = await fetch("/api/expo/vendor/my-booth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(boothForm),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "부스 저장 실패");
      }

      setMessage("부스 정보가 저장되었습니다.");
    } catch (e: any) {
      setMessage(e?.message || "부스 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingBooth(false);
    }
  }

  async function saveProduct(product: Product, idx: number) {
    setMessage("");
    setSavingProduct(product.product_id);

    try {
      const res = await fetch("/api/expo/vendor/my-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.product_id.startsWith("new-") ? null : product.product_id,
          name: product.name ?? "",
          description: product.description ?? "",
          price_text: product.price_text ?? "",
          sort_order: product.sort_order ?? idx + 1,
          is_active: product.is_active !== false,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "제품 저장 실패");
      }

      setProducts((prev) => {
        const next = [...prev];
        next[idx] = data.product;
        return next;
      });

      setMessage("제품이 저장되었습니다.");
    } catch (e: any) {
      setMessage(e?.message || "제품 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingProduct(null);
    }
  }

  async function deleteProduct(productId: string) {
    if (!productId || productId.startsWith("new-")) {
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      return;
    }

    setMessage("");
    setDeletingProduct(productId);

    try {
      const res = await fetch("/api/expo/vendor/my-products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "제품 삭제 실패");
      }

      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      setMessage("제품이 삭제되었습니다.");
    } catch (e: any) {
      setMessage(e?.message || "제품 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingProduct(null);
    }
  }

  return (
    <main style={pageWrap}>
      <header style={header}>
        <div>
          <div style={eyebrow}>VENDOR BOOTH EDITOR</div>
          <h1 style={title}>내 부스 편집</h1>
          <div style={meta}>
            업체: <b>{vendor.company_name ?? vendor.vendor_id}</b> · 부스: <b>{booth.booth_id}</b> · 활성 제품 {activeCount}개
          </div>
        </div>
      </header>

      {message ? <div style={messageBox}>{message}</div> : null}

      <section style={section}>
        <div style={sectionTitle}>부스 기본 정보</div>

        <div style={grid2}>
          <Field label="부스명">
            <input
              value={boothForm.name}
              onChange={(e) => updateBoothField("name", e.target.value)}
              style={input}
              placeholder="예: 도프"
            />
          </Field>

          <Field label="지역">
            <input
              value={boothForm.region}
              onChange={(e) => updateBoothField("region", e.target.value)}
              style={input}
              placeholder="예: 경기"
            />
          </Field>

          <Field label="카테고리">
            <input
              value={boothForm.category_primary}
              onChange={(e) => updateBoothField("category_primary", e.target.value)}
              style={input}
              placeholder="예: 비료 / 농기계 / 종자"
            />
          </Field>

          <Field label="전시장 ID">
            <input
              value={boothForm.hall_id}
              onChange={(e) => updateBoothField("hall_id", e.target.value)}
              style={input}
              placeholder="예: agri-inputs / machines"
            />
          </Field>

          <Field label="전화번호">
            <input
              value={boothForm.phone}
              onChange={(e) => updateBoothField("phone", e.target.value)}
              style={input}
              placeholder="예: 1522-5284"
            />
          </Field>

          <Field label="이메일">
            <input
              value={boothForm.email}
              onChange={(e) => updateBoothField("email", e.target.value)}
              style={input}
              placeholder="예: sales@company.com"
            />
          </Field>
        </div>

        <Field label="한 줄 소개">
          <textarea
            value={boothForm.intro}
            onChange={(e) => updateBoothField("intro", e.target.value)}
            style={textareaShort}
            placeholder="예: 해조추출물·비료·농민 특가 전문"
          />
        </Field>

        <Field label="부스 설명">
          <textarea
            value={boothForm.description}
            onChange={(e) => updateBoothField("description", e.target.value)}
            style={textarea}
            placeholder="부스 소개, 장점, 상담 유도 문구를 넣으십시오."
          />
        </Field>

        <div style={actions}>
          <button onClick={saveBooth} style={primaryBtn} disabled={savingBooth}>
            {savingBooth ? "저장 중..." : "부스 저장"}
          </button>
        </div>
      </section>

      <section style={{ ...section, marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={sectionTitle}>제품 관리</div>
          <button onClick={addProduct} style={ghostBtn}>
            + 제품 추가
          </button>
        </div>

        <div style={productList}>
          {products.map((p, idx) => (
            <div key={p.product_id} style={productCard}>
              <div style={productHeader}>
                <div style={{ fontWeight: 900 }}>제품 #{idx + 1}</div>
                <label style={checkboxWrap}>
                  <input
                    type="checkbox"
                    checked={p.is_active !== false}
                    onChange={(e) => updateProduct(idx, { is_active: e.target.checked })}
                  />
                  사용
                </label>
              </div>

              <div style={grid2}>
                <Field label="제품명">
                  <input
                    value={p.name ?? ""}
                    onChange={(e) => updateProduct(idx, { name: e.target.value })}
                    style={input}
                    placeholder="예: 켈팍 25L"
                  />
                </Field>

                <Field label="가격 문구">
                  <input
                    value={p.price_text ?? ""}
                    onChange={(e) => updateProduct(idx, { price_text: e.target.value })}
                    style={input}
                    placeholder="예: 행사 특가 / 정가 문의 / 25만원"
                  />
                </Field>

                <Field label="정렬 순서">
                  <input
                    type="number"
                    value={p.sort_order ?? idx + 1}
                    onChange={(e) =>
                      updateProduct(idx, { sort_order: Number(e.target.value || idx + 1) })
                    }
                    style={input}
                  />
                </Field>
              </div>

              <Field label="제품 설명">
                <textarea
                  value={p.description ?? ""}
                  onChange={(e) => updateProduct(idx, { description: e.target.value })}
                  style={textarea}
                  placeholder="제품 설명, 특징, 사용 포인트를 넣으십시오."
                />
              </Field>

              <div style={actions}>
                <button
                  onClick={() => saveProduct(p, idx)}
                  style={primaryBtn}
                  disabled={savingProduct === p.product_id}
                >
                  {savingProduct === p.product_id ? "저장 중..." : "제품 저장"}
                </button>

                <button
                  onClick={() => deleteProduct(p.product_id)}
                  style={dangerBtn}
                  disabled={deletingProduct === p.product_id}
                >
                  {deletingProduct === p.product_id ? "삭제 중..." : "제품 삭제"}
                </button>
              </div>
            </div>
          ))}
        </div>
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
    <label style={fieldWrap}>
      <div style={labelStyle}>{label}</div>
      {children}
    </label>
  );
}

const pageWrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "28px 16px 60px",
  background: "#fff",
  minHeight: "100vh",
  color: "#111",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#16a34a",
};

const title: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 950,
  margin: "6px 0 0",
};

const meta: React.CSSProperties = {
  marginTop: 8,
  color: "#666",
  fontSize: 13,
};

const messageBox: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#111",
  fontWeight: 700,
};

const section: React.CSSProperties = {
  marginTop: 22,
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 18,
  background: "#fafafa",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 950,
  marginBottom: 14,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const fieldWrap: React.CSSProperties = {
  display: "block",
  marginTop: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 8,
  color: "#111",
};

const input: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: "0 14px",
  background: "#fff",
  color: "#111",
  fontSize: 15,
  boxSizing: "border-box",
};

const textareaShort: React.CSSProperties = {
  width: "100%",
  minHeight: 84,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 14,
  background: "#fff",
  color: "#111",
  fontSize: 15,
  resize: "vertical",
  boxSizing: "border-box",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 140,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 14,
  background: "#fff",
  color: "#111",
  fontSize: 15,
  resize: "vertical",
  boxSizing: "border-box",
};

const actions: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const primaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
  fontWeight: 950,
  cursor: "pointer",
};

const productList: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const productCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const productHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const checkboxWrap: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: 13,
  fontWeight: 800,
};