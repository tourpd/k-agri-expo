"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);

  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function LiveVerifyPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      alert("라이브 암호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/live/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "인증 실패");
      }

      alert("🔥 인증 완료! 라이브 방송으로 이동합니다.");

      window.location.href =
        typeof json.live_url === "string" && json.live_url.trim()
          ? json.live_url
          : "/expo/live";
    } catch (error) {
      alert(error instanceof Error ? error.message : "인증 실패");
      setLoading(false);
    }
  }

  return (
    <main style={wrap}>
      <section style={card}>
        <div style={badge}>🔥 LIVE 인증</div>

        <h1 style={title}>라이브 암호 입력</h1>

        <p style={desc}>
          방송 중 공개된 암호를 입력해야
          <br />
          최종 추첨 대상이 됩니다.
        </p>

        <div style={guideBox}>
          <div style={guideTitle}>참여 방법</div>
          <div style={guideText}>① 사전 참여한 전화번호 입력</div>
          <div style={guideText}>② 방송 중 공개된 암호 입력</div>
          <div style={guideText}>③ 인증 완료 후 라이브 방송으로 이동</div>
          <div style={guideText}>④ 추첨 대상 등록 완료</div>
        </div>

        <div style={formBox}>
          <Input
            label="전화번호"
            value={phone}
            placeholder="010-1234-5678"
            onChange={(v) => setPhone(formatPhone(v))}
          />

          <Input
            label="라이브 암호"
            value={password}
            placeholder="방송 중 공개된 암호 입력"
            onChange={setPassword}
          />

          <button type="button" onClick={submit} disabled={loading} style={btn}>
            {loading ? "인증 후 이동 중..." : "🔥 인증하고 라이브로 이동"}
          </button>
        </div>

        <div style={notice}>
          ✔ 사전 참여한 전화번호와 일치해야 합니다.
          <br />
          ✔ 암호가 맞으면 추첨 대상자로 등록됩니다.
          <br />
          ✔ 인증 후 자동으로 라이브 방송으로 이동합니다.
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={inputWrap}>
      <label style={labelStyle}>{label}</label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#f3f4f6 0%,#ffffff 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  color: "#111827",
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: 460,
  background: "#fff",
  padding: 28,
  borderRadius: 24,
  textAlign: "center",
  boxShadow: "0 22px 55px rgba(0,0,0,0.12)",
};

const badge: CSSProperties = {
  display: "inline-block",
  padding: "8px 15px",
  borderRadius: 999,
  background: "#ecfdf5",
  color: "#15803d",
  fontWeight: 950,
};

const title: CSSProperties = {
  fontSize: 31,
  lineHeight: 1.2,
  fontWeight: 950,
  marginTop: 16,
  color: "#111827",
};

const desc: CSSProperties = {
  marginTop: 12,
  fontSize: 17,
  lineHeight: 1.65,
  color: "#374151",
  fontWeight: 800,
};

const guideBox: CSSProperties = {
  marginTop: 22,
  padding: 16,
  borderRadius: 16,
  background: "#f9fafb",
  textAlign: "left",
};

const guideTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  color: "#111827",
  marginBottom: 8,
};

const guideText: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  fontWeight: 800,
  color: "#4b5563",
};

const formBox: CSSProperties = {
  marginTop: 20,
};

const inputWrap: CSSProperties = {
  marginTop: 15,
  textAlign: "left",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 15,
  fontWeight: 950,
  color: "#111827",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 56,
  padding: "0 15px",
  borderRadius: 13,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
  outline: "none",
  boxSizing: "border-box",
};

const btn: CSSProperties = {
  marginTop: 22,
  width: "100%",
  minHeight: 60,
  padding: "17px 16px",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 950,
  borderRadius: 15,
  fontSize: 19,
  border: "none",
  cursor: "pointer",
};

const notice: CSSProperties = {
  marginTop: 20,
  padding: 15,
  borderRadius: 14,
  background: "#f3f4f6",
  color: "#374151",
  fontSize: 13,
  lineHeight: 1.75,
  fontWeight: 800,
  textAlign: "left",
};