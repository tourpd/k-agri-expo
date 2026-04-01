"use client";

import React, { useState } from "react";

type ProductsManagerClientProps = {
  boothId: string;
  products: any[];
};

export default function ProductsManagerClient({
  boothId,
  products: initialProducts,
}: ProductsManagerClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    buy_url: "",
    price_number: "",
    image_url: "",
  });

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (!form.name.trim()) throw new Error("제품명을 입력해 주세요.");

      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boothId,
          ...form,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "제품 등록에 실패했습니다.");
      }

      setProducts((prev) => [json.product, ...prev]);
      setForm({
        name: "",
        description: "",
        buy_url: "",
        price_number: "",
        image_url: "",
      });
      setMsg("제품이 등록되었습니다.");
    } catch (error: any) {
      setMsg(error?.message || "제품 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(productId: string) {
    if (!confirm("이 제품을 삭제하시겠습니까?")) return;

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/vendor/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "제품 삭제에 실패했습니다.");
      }

      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      setMsg("제품이 삭제되었습니다.");
    } catch (error: any) {
      setMsg(error?.message || "제품 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.kicker}>PRODUCTS</div>
        <h1 style={S.title}>제품 관리</h1>
        <p style={S.desc}>부스에 노출될 제품을 등록하고 관리합니다.</p>

        <form onSubmit={createProduct} style={S.formCard}>
          <div style={S.grid}>
            <label style={S.labelWrap}>
              <div style={S.label}>제품명</div>
              <input name="name" value={form.name} onChange={onChange} style={S.input} />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>구매 링크</div>
              <input name="buy_url" value={form.buy_url} onChange={onChange} style={S.input} />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>가격 숫자</div>
              <input
                name="price_number"
                value={form.price_number}
                onChange={onChange}
                style={S.input}
                placeholder="예: 35000"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>이미지 링크</div>
              <input
                name="image_url"
                value={form.image_url}
                onChange={onChange}
                style={S.input}
              />
            </label>
          </div>

          <label style={S.labelWrap}>
            <div style={S.label}>제품 설명</div>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              style={S.textarea}
            />
          </label>

          {msg ? <div style={S.msg}>{msg}</div> : null}

          <div style={S.actionRow}>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? "등록 중..." : "제품 등록"}
            </button>
          </div>
        </form>

        <div style={S.listWrap}>
          <h2 style={S.listTitle}>등록 제품</h2>

          {products.length === 0 ? (
            <div style={S.empty}>등록된 제품이 없습니다.</div>
          ) : (
            <div style={S.listGrid}>
              {products.map((item) => (
                <div key={item.product_id} style={S.card}>
                  <div style={S.cardTitle}>{item.name || "제품명 없음"}</div>
                  <div style={S.cardDesc}>{item.description || "설명 없음"}</div>
                  <div style={S.cardMeta}>상태: {item.status || "-"}</div>

                  {item.buy_url ? (
                    <a href={item.buy_url} target="_blank" style={S.linkBtn}>
                      구매 링크 보기
                    </a>
                  ) : null}

                  <button
                    type="button"
                    style={S.deleteBtn}
                    onClick={() => deleteProduct(item.product_id)}
                    disabled={loading}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
  },
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.8,
  },
  formCard: {
    marginTop: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 12px 24px rgba(15,23,42,0.04)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  labelWrap: {
    display: "block",
    marginTop: 14,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: "0 14px",
    boxSizing: "border-box",
    fontSize: 15,
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: 14,
    boxSizing: "border-box",
    fontSize: 15,
    resize: "vertical",
    background: "#fff",
    lineHeight: 1.7,
  },
  msg: {
    marginTop: 16,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 14,
    color: "#334155",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  actionRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-end",
  },
  submitBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  listWrap: {
    marginTop: 24,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 950,
    color: "#0f172a",
  },
  empty: {
    marginTop: 14,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    color: "#64748b",
  },
  listGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 20px rgba(15,23,42,0.04)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  },
  cardDesc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#64748b",
  },
  cardMeta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 800,
    color: "#334155",
  },
  linkBtn: {
    display: "inline-block",
    marginTop: 12,
    textDecoration: "none",
    color: "#1d4ed8",
    fontWeight: 900,
  },
  deleteBtn: {
    marginTop: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    borderRadius: 10,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
};