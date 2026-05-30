"use client";

import { useState } from "react";

type Prize = {
  id: string;
  title: string;
  sponsor?: string | null;
  category?: string | null;
  description?: string | null;
  preview_note?: string | null;
  image_url?: string | null;
  product_price?: string | null;
  product_cta?: string | null;
};

export default function ProductLeadClient({ prize }: { prize: Prize }) {
  const [form, setForm] = useState({
    farmer_name: "",
    farmer_phone: "",
    region: "",
    crop: "",
    farm_size: "",
    request_type: "consult",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitLead() {
    setMessage("");

    if (!form.farmer_name.trim()) {
      setMessage("성함을 입력해주세요.");
      return;
    }

    if (!form.farmer_phone.trim()) {
      setMessage("연락처를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/expo/live/product-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prize_id: prize.id, ...form }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "신청 저장에 실패했습니다.");
      }

      setMessage("신청이 접수되었습니다. 방송 운영자가 확인 후 연락드릴 수 있습니다.");
      setForm({
        farmer_name: "",
        farmer_phone: "",
        region: "",
        crop: "",
        farm_size: "",
        request_type: "consult",
        message: "",
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.imageBox}>
          {prize.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={prize.image_url} alt={prize.title} style={styles.image} />
          ) : (
            <span style={styles.noImage}>이미지 없음</span>
          )}
        </div>

        <div style={styles.info}>
          <p style={styles.kicker}>K-Agri Expo LIVE PRODUCT</p>
          <h1 style={styles.title}>{prize.title}</h1>

          <p style={styles.meta}>업체: {prize.sponsor || "-"}</p>
          <p style={styles.meta}>카테고리: {prize.category || "기타"}</p>

          {prize.product_price ? (
            <p style={styles.price}>{prize.product_price}</p>
          ) : null}

          {prize.preview_note ? (
            <div style={styles.notice}>{prize.preview_note}</div>
          ) : null}

          <p style={styles.desc}>{prize.description || "상품 설명이 준비 중입니다."}</p>
        </div>
      </section>

      <section style={styles.formCard}>
        <h2 style={styles.formTitle}>
          {prize.product_cta || "상담/주문 문의"}
        </h2>
        <p style={styles.formDesc}>
          아래 정보를 남기시면 라이브 운영자가 확인 후 상담 또는 주문 안내를 진행합니다.
        </p>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.typeRow}>
          <button
            type="button"
            onClick={() => update("request_type", "consult")}
            style={{
              ...styles.typeButton,
              background: form.request_type === "consult" ? "#111827" : "#e5e7eb",
              color: form.request_type === "consult" ? "white" : "#111827",
            }}
          >
            상담 신청
          </button>
          <button
            type="button"
            onClick={() => update("request_type", "order")}
            style={{
              ...styles.typeButton,
              background: form.request_type === "order" ? "#16a34a" : "#e5e7eb",
              color: form.request_type === "order" ? "white" : "#111827",
            }}
          >
            주문 문의
          </button>
        </div>

        <label style={styles.label}>성함</label>
        <input
          style={styles.input}
          value={form.farmer_name}
          onChange={(e) => update("farmer_name", e.target.value)}
          placeholder="예: 홍길동"
        />

        <label style={styles.label}>연락처</label>
        <input
          style={styles.input}
          value={form.farmer_phone}
          onChange={(e) => update("farmer_phone", e.target.value)}
          placeholder="예: 010-1234-5678"
        />

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>지역</label>
            <input
              style={styles.input}
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="예: 충남 홍성"
            />
          </div>

          <div>
            <label style={styles.label}>주요 작물</label>
            <input
              style={styles.input}
              value={form.crop}
              onChange={(e) => update("crop", e.target.value)}
              placeholder="예: 마늘"
            />
          </div>

          <div>
            <label style={styles.label}>재배 규모</label>
            <input
              style={styles.input}
              value={form.farm_size}
              onChange={(e) => update("farm_size", e.target.value)}
              placeholder="예: 3,000평"
            />
          </div>
        </div>

        <label style={styles.label}>문의 내용</label>
        <textarea
          style={styles.textarea}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="예: 고추에 사용하려고 합니다. 사용량과 가격 상담 받고 싶습니다."
        />

        <button
          type="button"
          onClick={submitLead}
          disabled={loading}
          style={{
            ...styles.submitButton,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "접수 중..." : "상담/주문 신청하기"}
        </button>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "24px",
    color: "#111827",
  },
  card: {
    maxWidth: 980,
    margin: "0 auto 20px",
    background: "white",
    borderRadius: 28,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
  },
  imageBox: {
    width: "100%",
    minHeight: 320,
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontWeight: 900,
  },
  image: {
    width: "100%",
    maxHeight: 460,
    objectFit: "cover",
  },
  noImage: {
    fontSize: 22,
  },
  info: {
    padding: 26,
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  title: {
    margin: "10px 0",
    fontSize: 42,
    fontWeight: 950,
  },
  meta: {
    margin: "8px 0",
    fontSize: 18,
    fontWeight: 800,
    color: "#374151",
  },
  price: {
    margin: "14px 0",
    fontSize: 30,
    fontWeight: 950,
    color: "#dc2626",
  },
  notice: {
    margin: "16px 0",
    padding: 14,
    borderRadius: 16,
    background: "#ecfdf5",
    color: "#166534",
    fontWeight: 900,
  },
  desc: {
    margin: "14px 0 0",
    fontSize: 18,
    lineHeight: 1.6,
    color: "#4b5563",
  },
  formCard: {
    maxWidth: 980,
    margin: "0 auto",
    background: "white",
    borderRadius: 28,
    padding: 26,
    boxShadow: "0 20px 50px rgba(15,23,42,0.10)",
  },
  formTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 950,
  },
  formDesc: {
    color: "#6b7280",
    fontSize: 17,
  },
  message: {
    margin: "16px 0",
    padding: 14,
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 900,
  },
  typeRow: {
    display: "flex",
    gap: 10,
    margin: "18px 0",
  },
  typeButton: {
    border: 0,
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
  },
  label: {
    display: "block",
    margin: "14px 0 8px",
    fontWeight: 900,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "15px 14px",
    fontSize: 17,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 17,
    resize: "vertical",
  },
  submitButton: {
    width: "100%",
    marginTop: 20,
    border: 0,
    borderRadius: 18,
    padding: "18px",
    background: "#16a34a",
    color: "white",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },
};