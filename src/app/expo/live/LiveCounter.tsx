"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

type CountData = {
  total: number;
  eligible: number;
};

export default function LiveCounter() {
  const [data, setData] = useState<CountData>({
    total: 0,
    eligible: 0,
  });

  async function loadCount() {
    try {
      const res = await fetch("/api/live/count", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setData({ total: 0, eligible: 0 });
        return;
      }

      setData({
        total: Number(json.total ?? json.count ?? 0),
        eligible: Number(json.eligible ?? json.count ?? 0),
      });
    } catch {
      setData({ total: 0, eligible: 0 });
    }
  }

  useEffect(() => {
    loadCount();
    const timer = window.setInterval(loadCount, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const total = Number(data.total || 0);
  const eligible = Number(data.eligible || 0);

  return (
    <div style={wrap}>
      <div style={item}>
        <div style={label}>👨‍🌾 참여 농가</div>
        <div style={num}>{total.toLocaleString("ko-KR")}</div>
      </div>

      <div style={item}>
        <div style={label}>🔥 추첨 대상</div>
        <div style={num}>{eligible.toLocaleString("ko-KR")}</div>
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const item: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "#111827",
  color: "#ffffff",
  textAlign: "center",
};

const label: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
};

const num: CSSProperties = {
  marginTop: 6,
  color: "#facc15",
  fontSize: 22,
  fontWeight: 950,
};