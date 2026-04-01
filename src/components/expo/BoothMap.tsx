"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function BoothMap({ slots }: { slots: any[] }) {
  const [zoom, setZoom] = useState(1);

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setZoom((z) => z + 0.2)}>확대</button>
        <button onClick={() => setZoom((z) => Math.max(1, z - 0.2))}>
          축소
        </button>
      </div>

      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          position: "relative",
          width: 1200,
          height: 800,
        }}
      >
        {slots.map((s) => (
          <Link
            key={s.slot_id}
            href={`/expo/booth/${s.booth_id}`}
            style={{
              position: "absolute",
              left: s.x * 100,
              top: s.y * 100,
              width: s.w * 90,
              height: s.h * 90,
              background: s.booth_id ? "#111" : "#ddd",
              color: "white",
              borderRadius: 12,
              padding: 6,
              textDecoration: "none",
            }}
          >
            {s.slot_id}
          </Link>
        ))}
      </div>
    </div>
  );
}