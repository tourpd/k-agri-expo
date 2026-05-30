"use client";

import { useState } from "react";

type Props = {
  eventId: string;
  prizeId?: string | null;
};

export default function AdminDrawButton({ eventId, prizeId }: Props) {
  const [loading, setLoading] = useState(false);

  async function draw() {
    if (loading) return;

    const ok = window.confirm("정말 지금 추첨하시겠습니까?");
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch("/api/live/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          prize_id: prizeId || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "추첨 실패");
        return;
      }

      alert(
        `추첨 완료!\n\n당첨자: ${json.winner?.name || "이름없음"}\n전화번호: ${
          json.winner?.phone || "-"
        }`
      );

      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "추첨 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={draw}
      disabled={loading}
      style={{
        width: "100%",
        minHeight: 76,
        border: "none",
        borderRadius: 20,
        background: loading ? "#9ca3af" : "#16a34a",
        color: "#ffffff",
        fontSize: 24,
        fontWeight: 950,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "추첨 중..." : "🎲 무작위 추첨하기"}
    </button>
  );
}