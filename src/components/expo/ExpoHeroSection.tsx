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
      대표 이미지/영상이 아직 등록되지 않았습니다.
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
  const heroMediaVideoUrl = cmsHeroVideoUrl || hero?.video_url || null;

  return (
    <>
      <section style={S.heroSingleWrap} className="expo-hero-wrap expo-section">
        <div style={S.heroLeftSingle} className="expo-hero-card">
          <div style={S.heroSmall}>K-Agri 365 EXPO</div>

          <div style={S.heroHighlight}>{heroSubtitle}</div>

          <h1 style={S.heroTitle}>{heroTitle}</h1>

          <p style={S.heroDesc}>{heroDescription}</p>

          <div style={S.heroButtons} className="expo-hero-buttons">
            <Link href="/expo/deals" style={S.heroBtnPrimary}>
              EXPO 현장가 특가 →
            </Link>

            <Link href="/expo#consult" style={S.heroBtnGhost}>
              농사 상담 시작 →
            </Link>
          </div>

          <div style={S.heroHelperRow}>
            <Link href="/expo#hot-issues" style={S.helperLink}>
              이달의 핫 이슈 →
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
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },

  heroSingleWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "18px 24px 0",
  },

  heroLeftSingle: {
    borderRadius: 36,
    padding: 38,
    background:
      "linear-gradient(135deg, #0f172a 0%, #172554 42%, #166534 100%)",
    color: "#fff",
  },

  heroSmall: {
    fontSize: 15,
    color: "rgba(255,255,255,0.88)",
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  heroHighlight: {
    marginTop: 14,
    fontSize: "clamp(22px, 3vw, 34px)",
    lineHeight: 1.25,
    fontWeight: 950,
    color: "#bef264",
    letterSpacing: -0.5,
    whiteSpace: "pre-line",
  },

  heroTitle: {
    margin: "14px 0 0",
    fontSize: "clamp(42px, 8vw, 76px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: -1.6,
    whiteSpace: "pre-line",
  },

  heroDesc: {
    marginTop: 20,
    fontSize: 20,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.92)",
    maxWidth: 860,
    whiteSpace: "pre-line",
  },

  heroButtons: {
    marginTop: 28,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  heroBtnPrimary: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "15px 18px",
    borderRadius: 16,
    fontWeight: 950,
  },

  heroBtnGhost: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "15px 18px",
    borderRadius: 16,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.14)",
  },

  heroHelperRow: {
    marginTop: 18,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },

  helperLink: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    fontWeight: 800,
  },

  heroMediaSingle: {
    minHeight: 380,
    borderRadius: 36,
    overflow: "hidden",
    background: "#e2e8f0",
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  heroVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  heroIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
    aspectRatio: "16 / 9",
  },

  heroEmpty: {
    width: "100%",
    height: "100%",
    minHeight: 380,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    background: "#e2e8f0",
    fontSize: 18,
    textAlign: "center",
    padding: 20,
  },
};