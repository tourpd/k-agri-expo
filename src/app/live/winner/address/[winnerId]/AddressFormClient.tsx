"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    daum?: any;
  }
}

type Props = {
  winnerId: string;
};

export default function AddressFormClient({ winnerId }: Props) {
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_zipcode: "",
    shipping_address1: "",
    shipping_address2: "",
    shipping_memo: "",
    privacy_agreed: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openPostcode() {
    if (!window.daum?.Postcode) {
      alert("주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        update("shipping_zipcode", data.zonecode || "");
        update("shipping_address1", data.roadAddress || data.jibunAddress || "");
      },
    }).open();
  }

  async function submit() {
    setMessage("");

    if (!form.shipping_name.trim()) {
      setMessage("받는 사람 이름을 입력해주세요.");
      return;
    }

    if (!form.shipping_phone.trim()) {
      setMessage("연락처를 입력해주세요.");
      return;
    }

    if (!form.shipping_address1.trim()) {
      setMessage("주소를 입력해주세요.");
      return;
    }

    if (!form.shipping_address2.trim()) {
      setMessage("상세주소를 입력해주세요.");
      return;
    }

    if (!form.privacy_agreed) {
      setMessage("개인정보 제공 동의가 필요합니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/live/winner/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_id: winnerId, ...form }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "배송정보 저장에 실패했습니다.");
      }

      setMessage("배송정보가 정상적으로 저장되었습니다. 감사합니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />

      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.kicker}>K-Agri Expo LIVE EVENT</p>
          <h1 style={styles.title}>경품 배송정보 입력</h1>
          <p style={styles.desc}>
            라이브 이벤트 경품 발송을 위해 받으실 분의 정보를 입력해주세요.
          </p>

          {message && <div style={styles.message}>{message}</div>}

          <label style={styles.label}>받는 사람</label>
          <input
            style={styles.input}
            value={form.shipping_name}
            onChange={(e) => update("shipping_name", e.target.value)}
            placeholder="예: 이지연"
          />

          <label style={styles.label}>연락처</label>
          <input
            style={styles.input}
            value={form.shipping_phone}
            onChange={(e) => update("shipping_phone", e.target.value)}
            placeholder="예: 010-1234-5678"
          />

          <label style={styles.label}>주소</label>
          <div style={styles.addressRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              value={form.shipping_zipcode}
              onChange={(e) => update("shipping_zipcode", e.target.value)}
              placeholder="우편번호"
            />
            <button type="button" onClick={openPostcode} style={styles.searchButton}>
              주소 찾기
            </button>
          </div>

          <input
            style={styles.input}
            value={form.shipping_address1}
            onChange={(e) => update("shipping_address1", e.target.value)}
            placeholder="기본주소"
          />

          <input
            style={styles.input}
            value={form.shipping_address2}
            onChange={(e) => update("shipping_address2", e.target.value)}
            placeholder="상세주소"
          />

          <label style={styles.label}>배송메모</label>
          <textarea
            style={styles.textarea}
            value={form.shipping_memo}
            onChange={(e) => update("shipping_memo", e.target.value)}
            placeholder="예: 부재 시 문 앞에 놓아주세요."
          />

          <label style={styles.agreeBox}>
            <input
              type="checkbox"
              checked={form.privacy_agreed}
              onChange={(e) => update("privacy_agreed", e.target.checked)}
            />
            <span>
              경품 배송을 위해 이름, 연락처, 주소 정보를 수집하고 배송업체 또는 협찬사에
              제공하는 것에 동의합니다.
            </span>
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "저장 중..." : "배송정보 저장"}
          </button>
        </section>
      </main>
    </>
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
    maxWidth: 680,
    margin: "0 auto",
    background: "white",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.06em",
  },
  title: {
    margin: "10px 0",
    fontSize: 34,
    fontWeight: 950,
  },
  desc: {
    margin: "0 0 20px",
    color: "#4b5563",
    lineHeight: 1.6,
  },
  message: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 800,
  },
  label: {
    display: "block",
    margin: "16px 0 8px",
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
  addressRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  searchButton: {
    border: 0,
    borderRadius: 14,
    background: "#111827",
    color: "white",
    padding: "15px 18px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  textarea: {
    width: "100%",
    minHeight: 96,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 17,
    resize: "vertical",
  },
  agreeBox: {
    display: "flex",
    gap: 10,
    marginTop: 18,
    lineHeight: 1.5,
    color: "#374151",
    fontSize: 15,
  },
  submitButton: {
    width: "100%",
    marginTop: 22,
    border: 0,
    borderRadius: 18,
    padding: "18px",
    background: "#16a34a",
    color: "white",
    fontSize: 21,
    fontWeight: 950,
    cursor: "pointer",
  },
};