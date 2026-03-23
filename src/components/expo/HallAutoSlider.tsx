"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type HallItem = {
  id: string;
  label: string;
  desc: string;
  href: string;
  tone: string;
};

export default function HallAutoSlider({ halls }: { halls: HallItem[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!scrollRef.current) return;

    const el = scrollRef.current;

    const timer = window.setInterval(() => {
      if (paused) return;

      const cardWidth = 296; // 카드폭 + gap 대략값
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft + cardWidth >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3500);

    return () => window.clearInterval(timer);
  }, [paused]);

  const scrollPrev = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -296, behavior: "smooth" });
  };

  const scrollNext = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 296, behavior: "smooth" });
  };

  return (
    <section style={S.wrap}>
      <div style={S.head}>
        <div>
          <div style={S.eyebrow}>EXHIBITION HALLS</div>
          <h2 style={S.title}>🚪 전시관 안내</h2>
          <p style={S.desc}>
            좌우로 넘겨 더 많은 전시관을 볼 수 있습니다. 자동으로도 넘어가며, 직접 이동도 가능합니다.
          </p>
        </div>

        <div style={S.controls}>
          <button type="button" style={S.ctrlBtn} onClick={scrollPrev}>
            ←
          </button>
          <button type="button" style={S.ctrlBtn} onClick={scrollNext}>
            →
          </button>
        </div>
      </div>

      <div style={S.sliderFrame}>
        <div
          ref={scrollRef}
          style={S.slider}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {halls.map((hall) => (
            <Link
              key={hall.id}
              href={hall.href}
              style={{ ...S.card, background: hall.tone }}
            >
              <div style={S.cardTitle}>{hall.label}</div>
              <div style={S.cardDesc}>{hall.desc}</div>
              <div style={S.cardBtn}>전시관 입장 →</div>
            </Link>
          ))}
        </div>

        <div style={S.fadeRight} />
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    width: "100%",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  controls: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  ctrlBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
  },

  sliderFrame: {
    position: "relative",
  },
  slider: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    scrollBehavior: "smooth",
    paddingBottom: 8,
  },
  fadeRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 72,
    height: "100%",
    background: "linear-gradient(to right, rgba(248,250,252,0), rgba(248,250,252,0.96))",
    pointerEvents: "none",
  },

  card: {
    width: 280,
    minWidth: 280,
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: 28,
    padding: 22,
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    minHeight: 210,
    display: "block",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  cardDesc: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.75,
  },
  cardBtn: {
    marginTop: 18,
    fontWeight: 950,
    fontSize: 14,
    color: "#166534",
  },
};