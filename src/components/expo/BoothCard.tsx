"use client";

import React, { useEffect, useState } from "react";

export default function BoothCard({ deal }: { deal: any }) {
  const [remain, setRemain] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(deal.end_at).getTime() - Date.now();

      if (diff <= 0) {
        setRemain("종료");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      setRemain(`${h}시간 ${m}분`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deal.end_at]);

  return (
    <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 12 }}>
      <div style={{ fontWeight: 900 }}>{deal.title}</div>
      <div style={{ color: "red", marginTop: 6 }}>
        EXPO 특가 {deal.expo_price}원
      </div>
      <div style={{ fontSize: 12, marginTop: 6 }}>
        종료까지 {remain}
      </div>
    </div>
  );
}