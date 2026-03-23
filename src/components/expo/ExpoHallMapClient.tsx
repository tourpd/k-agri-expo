"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ExpoHallMapClient({
  slots,
}: {
  slots: any[];
}) {
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<any>(null);

  return (
    <div style={{ position: "relative" }}>
      
      {/* 확대 축소 버튼 */}

      <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
        <button onClick={() => setZoom((z) => z + 0.2)}>확대</button>
        <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}>
          축소
        </button>
      </div>

      {/* 지도 */}

      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          width: 1200,
          height: 800,
          position: "relative",
          border: "1px solid #ddd",
          background: "#fafafa",
        }}
      >
        {slots.map((slot) => (
          <Link
            key={slot.slot_id}
            href={slot.booth_id ? `/expo/booths/${slot.booth_id}` : "#"}
            style={{
              position: "absolute",
              left: slot.x * 100,
              top: slot.y * 100,
              width: slot.w * 90,
              height: slot.h * 90,
              background: slot.booth_id ? "#111" : "#ddd",
              color: "#fff",
              borderRadius: 10,
              padding: 6,
              textDecoration: "none",
              fontSize: 12,
            }}
            onMouseEnter={() => setHover(slot)}
            onMouseLeave={() => setHover(null)}
          >
            {slot.label ?? slot.slot_id}
          </Link>
        ))}
      </div>

      {/* Hover 카드 */}

      {hover && hover.booth_name && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 240,
            padding: 12,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontWeight: 900 }}>{hover.booth_name}</div>
          <div style={{ fontSize: 13, marginTop: 6, color: "#555" }}>
            {hover.category ?? "카테고리"}
          </div>

          <Link
            href={`/expo/booths/${hover.booth_id}`}
            style={{
              display: "inline-block",
              marginTop: 10,
              fontSize: 12,
              color: "#111",
              fontWeight: 900,
            }}
          >
            부스 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}