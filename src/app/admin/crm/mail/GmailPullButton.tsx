// src/app/admin/crm/mail/GmailPullButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CSSProperties } from "react";

export default function GmailPullButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function pullGmail() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/admin/gmail-pull?max=10");
      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.error || "Gmail 수집 실패");
        return;
      }

      setMessage(
        `저장 ${data.saved_count || 0}건 / 제외 ${data.skipped_count || 0}건`
      );

      router.refresh();
    } catch {
      setMessage("Gmail 수집 중 네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.wrap}>
      <button
        type="button"
        onClick={pullGmail}
        disabled={loading}
        style={{
          ...S.button,
          opacity: loading ? 0.65 : 1,
        }}
      >
        {loading ? "Gmail 수집 중..." : "Gmail 수집"}
      </button>

      {message ? <span style={S.message}>{message}</span> : null}
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    minHeight: 42,
    borderRadius: 12,
    border: "none",
    background: "#047857",
    color: "#ffffff",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  message: {
    fontSize: 13,
    fontWeight: 950,
    color: "#047857",
    whiteSpace: "nowrap",
  },
};