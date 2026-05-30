"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

function formatPhone(value: string) {
  const only = value.replace(/\D/g, "").slice(0, 11);
  if (only.length < 4) return only;
  if (only.length < 8) return `${only.slice(0, 3)}-${only.slice(3)}`;
  return `${only.slice(0, 3)}-${only.slice(3, 7)}-${only.slice(7)}`;
}

function pad(n?: number | null) {
  return String(n || 0).padStart(4, "0");
}

export default function MyNumberPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawNumber, setDrawNumber] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [message, setMessage] = useState("");

  async function search() {
    if (!phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    setDrawNumber(null);

    try {
      const res = await fetch("/api/live/my-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "참여번호를 찾지 못했습니다.");
      }

      setDrawNumber(data.draw_number);
      setEventTitle(data.event?.title || "K-Agri LIVE");
      setMessage("참여번호를 찾았습니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={badge}>🔎 K-Agri LIVE EVENT</div>

        <h1 style={title}>내 참여번호 찾기</h1>

        <p style={desc}>
          라이브 방송 중 내 번호가 기억나지 않으면 전화번호를 입력해 확인하세요.
        </p>

        <input
          value={phone}
          placeholder="예: 010-2828-2929"
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          style={input}
        />

        <button type="button" onClick={search} disabled={loading} style={button}>
          {loading ? "조회 중..." : "참여번호 확인하기"}
        </button>

        {message ? <div style={messageBox}>{message}</div> : null}

        {drawNumber ? (
          <div style={numberBox}>
            <div style={eventText}>{eventTitle}</div>
            <div style={numberLabel}>나의 참여번호</div>
            <div style={numberText}>{pad(drawNumber)}</div>
            <p style={guide}>방송 화면에 이 번호가 나오면 당첨입니다.</p>
          </div>
        ) : null}

        <a href="/expo/live" style={backButton}>
          라이브 이벤트 페이지로 돌아가기
        </a>
      </section>
    </main>
  );
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "white",
  borderRadius: 26,
  padding: 28,
  boxShadow: "0 22px 55px rgba(0,0,0,0.12)",
  textAlign: "center",
};

const badge: CSSProperties = {
  display: "inline-block",
  padding: "9px 16px",
  borderRadius: 999,
  background: "#ecfdf5",
  color: "#15803d",
  fontSize: 15,
  fontWeight: 950,
};

const title: CSSProperties = {
  margin: "20px 0 0",
  fontSize: 34,
  fontWeight: 950,
  color: "#111827",
};

const desc: CSSProperties = {
  marginTop: 12,
  fontSize: 17,
  lineHeight: 1.65,
  color: "#374151",
  fontWeight: 800,
};

const input: CSSProperties = {
  marginTop: 20,

  width: "100%",

  height: 58,

  padding: "0 16px",

  borderRadius: 14,

  border: "1px solid #d1d5db",

  fontSize: 18,

  fontWeight: 900,

  boxSizing: "border-box",

  color: "#111827",

  background: "#ffffff",

  caretColor: "#111827",

  outline: "none",
};

const button: CSSProperties = {
  marginTop: 14,
  width: "100%",
  minHeight: 62,
  border: 0,
  borderRadius: 15,
  background: "#16a34a",
  color: "white",
  fontSize: 20,
  fontWeight: 950,
  cursor: "pointer",
};

const messageBox: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 14,
  background: "#eef2ff",
  color: "#1e3a8a",
  fontWeight: 900,
};

const numberBox: CSSProperties = {
  marginTop: 18,
  padding: 22,
  borderRadius: 20,
  background: "#fef3c7",
};

const eventText: CSSProperties = {
  fontSize: 15,
  color: "#92400e",
  fontWeight: 900,
};

const numberLabel: CSSProperties = {
  marginTop: 8,
  fontSize: 17,
  color: "#92400e",
  fontWeight: 950,
};

const numberText: CSSProperties = {
  marginTop: 6,
  fontSize: 58,
  fontWeight: 950,
  color: "#dc2626",
};

const guide: CSSProperties = {
  margin: "8px 0 0",
  color: "#374151",
  fontWeight: 800,
};

const backButton: CSSProperties = {
  display: "block",
  marginTop: 24,
  padding: 16,
  borderRadius: 15,
  background: "#111827",
  color: "white",
  fontWeight: 950,
  textDecoration: "none",
};