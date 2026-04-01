"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type HotIssueItem = {
  id?: string | number;
  title?: string | null;
  summary?: string | null;
  badge?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_link?: string | null;
  media_type?: "image" | "video" | "youtube" | string | null;
  media_url?: string | null;
  overlay?: boolean | null;
};

function safeText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function toYouTubeEmbed(url?: string | null) {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0` : null;
    }

    const v = u.searchParams.get("v");
    if (v) {
      return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&loop=1&playlist=${v}&controls=0&showinfo=0&rel=0`;
    }

    if (u.pathname.includes("/embed/")) {
      return `${url}${url.includes("?") ? "&" : "?"}autoplay=1&mute=1&loop=1&controls=0&rel=0`;
    }
  } catch {}

  return null;
}

export default function ExpoHotIssuesSection({
  items,
}: {
  items: HotIssueItem[];
}) {
  const normalized = useMemo(() => {
    return (items ?? [])
      .map((item, index) => ({
        id: String(item?.id ?? `hot-${index + 1}`),
        title: safeText(item?.title, "이번 달 꼭 확인해야 할 이슈"),
        summary: safeText(
          item?.summary,
          "지금 시기에 꼭 확인해야 할 핵심 정보와 추천 연결을 확인해보세요."
        ),
        badge: safeText(item?.badge, "이달의 추천"),
        cta_label: safeText(item?.cta_label, "자세히 보기"),
        cta_link: safeText(item?.cta_link, "/expo"),
        secondary_cta_label: safeText(item?.secondary_cta_label, "상담 시작"),
        secondary_cta_link: safeText(item?.secondary_cta_link, "/expo"),
        media_type: safeText(item?.media_type, "image"),
        media_url: safeText(item?.media_url, ""),
        overlay: item?.overlay ?? true,
      }))
      .filter((item) => !!item.title);
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (normalized.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % normalized.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [normalized.length]);

  if (!normalized.length) return null;

  const active = normalized[activeIndex];
  const isYoutube =
    active.media_type.toLowerCase() === "youtube" ||
    (active.media_url.includes("youtube.com") || active.media_url.includes("youtu.be"));
  const youtubeEmbed = isYoutube ? toYouTubeEmbed(active.media_url) : null;
  const isVideo = active.media_type.toLowerCase() === "video";

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + normalized.length) % normalized.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % normalized.length);
  };

  return (
    <section style={S.section} className="expo-section">
      <div style={S.head}>
        <div>
          <div style={S.kicker}>HOT ISSUES</div>
          <h2 style={S.title}>이달의 핫 이슈</h2>
          <div style={S.desc}>
            이번 달 꼭 봐야 할 특강, 병해충 이슈, 협찬 아이템, 특가를 한곳에 모았습니다.
          </div>
        </div>
      </div>

      <div style={S.sliderWrap}>
        <button
          type="button"
          onClick={goPrev}
          style={{ ...S.arrowBtn, left: -20 }}
          aria-label="이전 이슈"
        >
          ‹
        </button>

        <div style={S.slideCard}>
          {/* 배경 미디어 */}
          <div style={S.mediaLayer}>
            {youtubeEmbed ? (
              <iframe
                title={active.title}
                src={youtubeEmbed}
                style={S.iframe}
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            ) : isVideo && active.media_url ? (
              <video
                src={active.media_url}
                autoPlay
                muted
                loop
                playsInline
                style={S.video}
              />
            ) : active.media_url ? (
              <div
                style={{
                  ...S.imageBg,
                  backgroundImage: `url("${active.media_url}")`,
                }}
              />
            ) : (
              <div style={S.fallbackBg} />
            )}

            <div style={S.dim} />
          </div>

          {/* 내용 */}
          <div style={S.content}>
            <div style={S.badge}>{active.badge}</div>

            <h3 style={S.cardTitle}>{active.title}</h3>

            <div style={S.cardDesc}>{active.summary}</div>

            <div style={S.actions}>
              <Link href={active.cta_link} style={S.primaryBtn}>
                {active.cta_label} →
              </Link>

              <Link href={active.secondary_cta_link} style={S.secondaryBtn}>
                {active.secondary_cta_label} →
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          style={{ ...S.arrowBtn, right: -20 }}
          aria-label="다음 이슈"
        >
          ›
        </button>
      </div>

      <div style={S.dots}>
        {normalized.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${index + 1}번 이슈 보기`}
            style={{
              ...S.dot,
              ...(index === activeIndex ? S.dotActive : null),
            }}
          />
        ))}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  head: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(34px, 6vw, 52px)",
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.8,
  },
  sliderWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  slideCard: {
    position: "relative",
    width: "100%",
    minHeight: 460,
    borderRadius: 36,
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
    background: "#0f172a",
  },
  mediaLayer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
  },
  imageBg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.02)",
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  iframe: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: 0,
    pointerEvents: "none",
  },
  fallbackBg: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, #0f172a 0%, #14532d 45%, #0ea5e9 100%)",
  },
  dim: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.38) 42%, rgba(15,23,42,0.14) 100%)",
  },
  content: {
    position: "relative",
    zIndex: 2,
    padding: "34px 40px 40px",
    maxWidth: 760,
    minHeight: 460,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  badge: {
    alignSelf: "flex-start",
    marginBottom: 18,
    borderRadius: 999,
    padding: "10px 16px",
    background: "rgba(255,255,255,0.92)",
    color: "#111827",
    fontSize: 14,
    fontWeight: 950,
  },
  cardTitle: {
    margin: 0,
    fontSize: "clamp(34px, 7vw, 78px)",
    lineHeight: 1,
    fontWeight: 950,
    color: "#ffffff",
    letterSpacing: -1.6,
    textShadow: "0 6px 20px rgba(0,0,0,0.18)",
  },
  cardDesc: {
    marginTop: 18,
    maxWidth: 620,
    fontSize: 18,
    lineHeight: 1.7,
    fontWeight: 700,
    color: "rgba(255,255,255,0.92)",
  },
  actions: {
    marginTop: 26,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 16,
    padding: "15px 22px",
    fontWeight: 950,
    fontSize: 18,
    display: "inline-block",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },
  secondaryBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.14)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: 16,
    padding: "15px 22px",
    fontWeight: 950,
    fontSize: 18,
    display: "inline-block",
    backdropFilter: "blur(8px)",
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    width: 58,
    height: 58,
    borderRadius: 999,
    border: "none",
    background: "rgba(71,85,105,0.82)",
    color: "#fff",
    fontSize: 42,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
  },
  dots: {
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },
  dot: {
    width: 12,
    height: 34,
    borderRadius: 999,
    border: "none",
    background: "#cbd5e1",
    cursor: "pointer",
  },
  dotActive: {
    background: "#16a34a",
    height: 42,
  },
};