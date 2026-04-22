import React from "react";
import Link from "next/link";
import type { CmsSettings, HomeSlot } from "@/types/expo-home";

function safeText(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function toEmbedUrl(url?: string | null) {
  const value = safeText(url, "");
  if (!value) return "";

  if (value.includes("/embed/")) return value;

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return "";
}

function HeroMedia({
  imageUrl,
  videoUrl,
  title,
}: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  title: string;
}) {
  const embedUrl = toEmbedUrl(videoUrl);
  const image = safeText(imageUrl, "");

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        style={S.heroIframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  const video = safeText(videoUrl, "");
  if (video) {
    return (
      <video
        src={video}
        autoPlay
        muted
        loop
        playsInline
        poster={image || undefined}
        style={S.heroVideo}
      />
    );
  }

  if (image) {
    return <img src={image} alt={title} style={S.heroImage} />;
  }

  return (
    <div style={S.heroEmpty}>
      대표 이미지 또는 영상이 아직 등록되지 않았습니다.
    </div>
  );
}

export default function ExpoHeroSection({
  hero,
  cms,
  heroTitle,
  heroSubtitle,
  heroDescription,
}: {
  hero: HomeSlot | null;
  cms: CmsSettings | null;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
}) {
  const cmsHeroVideoUrl = safeText((cms as any)?.hero_video_url, "");
  const heroMediaImageUrl = hero?.image_url ?? null;
  const heroMediaVideoUrl = cmsHeroVideoUrl || (hero as any)?.video_url || null;

  return (
    <>
      <section style={S.heroSingleWrap} className="expo-hero-wrap expo-section">
        <div style={S.heroCard} className="expo-hero-card">
          <div style={S.heroSmall}>K-Agri 365 EXPO</div>

          <div style={S.heroHighlight}>{heroSubtitle}</div>

          <h1 style={S.heroTitle}>{heroTitle}</h1>

          <p style={S.heroDesc}>{heroDescription}</p>

          <div style={S.heroButtons} className="expo-hero-buttons">
            <Link href="/expo/deals" style={S.heroBtnPrimary}>
              EXPO 특가 보기
            </Link>

            <Link href="/expo#consult" style={S.heroBtnGhost}>
              농사 상담 시작
            </Link>
          </div>

          <div style={S.heroHelperRow}>
            <Link href="/expo#hot-issues" style={S.helperLink}>
              이달의 핫이슈 →
            </Link>
            <Link href="/expo/event" style={S.helperLink}>
              경품 이벤트 →
            </Link>
            <Link href="/expo/live" style={S.helperLink}>
              월간 라이브쇼 →
            </Link>
          </div>
        </div>
      </section>

      <section style={S.sectionWrap} className="expo-section">
        <div style={S.heroMediaSingle} className="expo-hero-media">
          {heroMediaImageUrl || heroMediaVideoUrl ? (
            <HeroMedia
              imageUrl={heroMediaImageUrl}
              videoUrl={heroMediaVideoUrl}
              title={heroTitle}
            />
          ) : (
            <img
              src="/images/expo-hero.png"
              alt="K-Agri 365 EXPO"
              style={S.heroImage}
            />
          )}
        </div>
      </section>
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  sectionWrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "12px 12px 0",
  },

  heroSingleWrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "12px 12px 0",
  },

  heroCard: {
    borderRadius: 24,
    padding: "22px 18px",
    background:
      "linear-gradient(135deg, #0f172a 0%, #172554 44%, #166534 100%)",
    color: "#fff",
    boxShadow: "0 16px 36px rgba(15,23,42,0.12)",
  },

  heroSmall: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    fontWeight: 900,
    letterSpacing: 0.4,
  },

  heroHighlight: {
    marginTop: 10,
    fontSize: "clamp(18px, 5vw, 28px)",
    lineHeight: 1.25,
    fontWeight: 950,
    color: "#bef264",
    letterSpacing: -0.4,
    whiteSpace: "pre-line",
    wordBreak: "keep-all",
  },

  heroTitle: {
    margin: "10px 0 0",
    fontSize: "clamp(30px, 9vw, 56px)",
    lineHeight: 1.04,
    fontWeight: 950,
    letterSpacing: -1.2,
    whiteSpace: "pre-line",
    wordBreak: "keep-all",
  },

  heroDesc: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 1.75,
    color: "rgba(255,255,255,0.92)",
    maxWidth: 760,
    whiteSpace: "pre-line",
    wordBreak: "keep-all",
  },

  heroButtons: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    width: "100%",
  },

  heroBtnPrimary: {
    textDecoration: "none",
    background: "#ffffff",
    color: "#0f172a",
    minHeight: 46,
    padding: "12px 12px",
    borderRadius: 14,
    fontWeight: 950,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxSizing: "border-box",
  },

  heroBtnGhost: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    minHeight: 46,
    padding: "12px 12px",
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxSizing: "border-box",
  },

  heroHelperRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  helperLink: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  heroMediaSingle: {
    minHeight: 220,
    borderRadius: 22,
    overflow: "hidden",
    background: "#e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.08)",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    minHeight: 220,
    objectFit: "cover",
    display: "block",
  },

  heroVideo: {
    width: "100%",
    height: "100%",
    minHeight: 220,
    objectFit: "cover",
    display: "block",
  },

  heroIframe: {
    width: "100%",
    height: "100%",
    minHeight: 220,
    border: "none",
    display: "block",
    aspectRatio: "16 / 9",
  },

  heroEmpty: {
    width: "100%",
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    background: "#e2e8f0",
    fontSize: 14,
    textAlign: "center",
    padding: 18,
    lineHeight: 1.7,
  },
};