"use client";

import React, { useMemo } from "react";

type Props = {
  item: any;
};

function safe(v: any, fallback = "") {
  const s = String(v || "").trim();
  return s || fallback;
}

function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getDDay(v?: string | null) {
  if (!v) return "LIVE";
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return "LIVE";
  const diff = t - Date.now();
  if (diff <= 0) return "D-DAY";
  return `D-${Math.ceil(diff / (1000 * 60 * 60 * 24))}`;
}

function toYoutubeEmbed(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";

  let id = "";

  if (v.includes("youtu.be/")) {
    id = v.split("youtu.be/")[1]?.split("?")[0] || "";
  } else if (v.includes("watch?v=")) {
    id = v.split("watch?v=")[1]?.split("&")[0] || "";
  } else if (v.includes("/embed/")) {
    id = v.split("/embed/")[1]?.split("?")[0] || "";
  }

  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&rel=0`
    : "";
}

function getNumberFromText(v: any) {
  const n = Number(String(v || "").replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function ExpoLiveSection({ item }: Props) {
  const title = safe(item?.title, "라이브 이벤트");
  const subtitle = safe(item?.subtitle || item?.prize_text, "무료 추첨 이벤트");
  const prizeTitle = safe(
    item?.prize_text || item?.prize_title || item?.featured_title,
    "오늘의 대표 경품"
  );
  const prizeDesc = safe(
    item?.featured_desc || item?.description,
    "현재 방송 중인 대표 경품입니다."
  );
  const mainDescription = safe(
    item?.description,
    "사전 참여 후 방송 중 실시간 추첨을 통해 최종 당첨자를 선정합니다."
  );

  const imageUrl = safe(item?.image_url || item?.prize_image_url);
  const youtubeUrl = "https://youtu.be/K_88O0nVws4";
  const embedUrl = toYoutubeEmbed(youtubeUrl);

  const dateLabel = safe(
    item?.live_date_label || item?.date_text,
    "라이브 일정 준비중"
  );
  const dday = getDDay(item?.live_datetime || item?.date_text);

  const sponsorName = safe(
    item?.sponsor_name || item?.meta_1 || item?.sponsor,
    "영진로타리"
  );
  const partnerName = safe(item?.partner_name, "K-Agri Expo");

  const sponsorLogoUrl = safe(item?.sponsor_logo_url || item?.brand_logo_url);
  const partnerLogoUrl = safe(
    item?.partner_logo_url || item?.ppl_logo_url || item?.expo_logo_url
  );

  const sponsorLogoSize = num(item?.sponsor_logo_size, 64);
  const partnerLogoSize = num(item?.partner_logo_size, 42);
  const mainImageScale = num(item?.main_image_scale, 1.15);
  const ddayFontSize = num(item?.dday_font_size, 58);
  const participantFontSize = num(item?.participant_font_size, 36);
  const threshold = num(item?.participant_threshold, 50);

  const participantCount =
    Number(item?.participant_count_auto || 0) ||
    getNumberFromText(item?.participant_text);

  const showParticipantCount = participantCount >= threshold;

  const productPoints = useMemo(() => {
    return [item?.feature_1, item?.feature_2]
      .map((x) => safe(x))
      .filter(Boolean);
  }, [item]);

  const drawPoints = useMemo(() => {
    return [item?.feature_3, item?.feature_4]
      .map((x) => safe(x))
      .filter(Boolean);
  }, [item]);

  const ctaLabel = safe(item?.cta_label, "무료 추첨 참여하기");
  const ctaLink = safe(item?.cta_link, "/expo/live/join");

  const secondaryLabel = safe(item?.secondary_cta_label, "제품 영상 보기");
  const secondaryLink = safe(
    item?.secondary_cta_link || youtubeUrl,
    youtubeUrl || "/expo/live"
  );

  return (
    <section className="expo-live-wrap" style={wrap}>
      <style>{RESPONSIVE_CSS}</style>

      <div className="expo-live-card" style={card}>
        <div style={left}>
          <div style={topBrandRow}>
            <div style={brandStack}>
              <div style={partnerLine}>
                {partnerLogoUrl ? (
                  <img
                    src={partnerLogoUrl}
                    alt={partnerName}
                    style={{
                      height: partnerLogoSize,
                      maxWidth: 150,
                      objectFit: "contain",
                    }}
                  />
                ) : null}
                <span>{partnerName}</span>
              </div>

              <div style={sponsorLine}>
                {sponsorLogoUrl ? (
                  <img
                    src={sponsorLogoUrl}
                    alt={sponsorName}
                    style={{
                      height: sponsorLogoSize,
                      maxWidth: 210,
                      objectFit: "contain",
                    }}
                  />
                ) : null}
                <strong>{sponsorName}</strong>
              </div>
            </div>

            <div style={ddayBox}>
              <strong style={{ fontSize: ddayFontSize }}>{dday}</strong>
              <span>{dateLabel}</span>
            </div>
          </div>

          <h2 style={titleStyle}>{title}</h2>

          <div style={priceBanner}>🎁 {subtitle}</div>

          <div style={flowBox}>
            <b>참여 방법</b>
            <span>사전 참여 → 방송 시청 → 실시간 추첨 → 전화 확인 → 최종 당첨</span>
          </div>

          <div style={splitInfoGrid}>
            <div style={infoBoxProduct}>
              <strong>제품 핵심</strong>
              {(productPoints.length
                ? productPoints
                : ["제품 영상으로 실제 성능 확인", "현장 작업에 필요한 대표 장비"]
              ).map((p, i) => (
                <p key={i}>✓ {p}</p>
              ))}
            </div>

            <div style={infoBoxDraw}>
              <strong>추첨 방식</strong>
              {(drawPoints.length
                ? drawPoints
                : ["방송 중 실시간 당첨자 공개", "전화 확인 후 최종 당첨 확정"]
              ).map((p, i) => (
                <p key={i}>✓ {p}</p>
              ))}
            </div>
          </div>

          <a href={ctaLink} style={primaryButton}>
            🎁 {ctaLabel}
            <span style={buttonArrow}>›</span>
          </a>

          <p style={notice}>{mainDescription}</p>
        </div>

        <div style={right}>
          <div style={mediaCard}>
            <div style={livePulse} />

            <div style={mediaTop}>
              <div style={rightBrandBox}>
                <span style={pplBadge}>PPL 협찬사</span>
                <div style={rightLogoLine}>
                  {sponsorLogoUrl ? (
                    <img
                      src={sponsorLogoUrl}
                      alt={sponsorName}
                      style={{ height: 56, maxWidth: 180, objectFit: "contain" }}
                    />
                  ) : null}
                  <strong>{sponsorName}</strong>
                </div>
              </div>

              {showParticipantCount ? (
                <div style={countCard}>
                  <span>현재 참여 농가</span>
                  <strong style={{ fontSize: participantFontSize }}>
                    {participantCount.toLocaleString("ko-KR")}
                  </strong>
                  <b>명</b>
                </div>
              ) : (
                <div style={dateMiniCard}>
                  <span>LIVE 일정</span>
                  <strong>{dateLabel}</strong>
                </div>
              )}
            </div>

            <div style={mediaBox}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={prizeTitle}
                  style={video}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={prizeTitle}
                  style={{
                    ...image,
                    transform: `scale(${mainImageScale})`,
                  }}
                />
              ) : (
                <div style={noImage}>
                  LIVE
                  <br />
                  PRIZE
                </div>
              )}
            </div>

            <div style={prizeArea}>
              <div>
                <div style={prizeLabel}>오늘의 대표 경품</div>
                <h3 style={prizeTitleStyle}>{prizeTitle}</h3>
                <p style={prizeDescStyle}>{prizeDesc}</p>
              </div>

              {imageUrl ? (
                <img src={imageUrl} alt={prizeTitle} style={productImageSmall} />
              ) : null}
            </div>

            <div style={rightDateBox}>
              📅 <strong>{dateLabel}</strong>
            </div>

            {secondaryLink ? (
              <a
                href={secondaryLink}
                target={secondaryLink.startsWith("http") ? "_blank" : undefined}
                rel={secondaryLink.startsWith("http") ? "noopener noreferrer" : undefined}
                style={secondaryButton}
              >
                ▶ {secondaryLabel}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const RESPONSIVE_CSS = `
@keyframes livePulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
  70% { transform: scale(1.12); box-shadow: 0 0 0 18px rgba(239,68,68,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}

@media (max-width: 900px) {
  .expo-live-card {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 640px) {
  .expo-live-wrap {
    padding: 16px 10px 0 !important;
  }

  .expo-live-card {
    padding: 18px !important;
    border-radius: 24px !important;
  }
}
`;

const wrap: React.CSSProperties = { padding: "30px 20px 0" };

const card: React.CSSProperties = {
  maxWidth: 1220,
  margin: "0 auto",
  borderRadius: 36,
  padding: 28,
  display: "grid",
  gridTemplateColumns: "0.95fr 1.05fr",
  gap: 28,
  background:
    "radial-gradient(circle at 80% 10%, rgba(250,204,21,0.22), transparent 30%), linear-gradient(135deg, #050d1a 0%, #0c2746 45%, #064e3b 100%)",
  color: "#fff",
  boxShadow: "0 28px 80px rgba(15,23,42,0.28)",
  overflow: "hidden",
};

const left: React.CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: 16,
  minWidth: 0,
};

const right: React.CSSProperties = { minWidth: 0 };

const topBrandRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
};

const brandStack: React.CSSProperties = { display: "grid", gap: 10 };

const partnerLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#86efac",
  fontSize: 17,
  fontWeight: 950,
};

const sponsorLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontSize: 28,
  fontWeight: 950,
};

const ddayBox: React.CSSProperties = {
  width: 210,
  minHeight: 170,
  borderRadius: 26,
  background: "linear-gradient(180deg,#ef4444,#991b1b)",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  textAlign: "center",
  padding: 12,
  boxShadow: "0 18px 40px rgba(220,38,38,0.32)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(42px, 5vw, 76px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.075em",
  wordBreak: "keep-all",
};

const priceBanner: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 20,
  background: "linear-gradient(135deg, #fde047, #f97316)",
  color: "#111827",
  fontSize: "clamp(24px, 2.7vw, 38px)",
  lineHeight: 1.12,
  fontWeight: 950,
  textAlign: "center",
};

const flowBox: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(15,23,42,0.5)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 900,
};

const splitInfoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const infoBoxProduct: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(22,101,52,0.36)",
  border: "1px solid rgba(134,239,172,0.25)",
  fontWeight: 850,
};

const infoBoxDraw: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(30,64,175,0.36)",
  border: "1px solid rgba(147,197,253,0.25)",
  fontWeight: 850,
};

const primaryButton: React.CSSProperties = {
  minHeight: 76,
  borderRadius: 22,
  background: "linear-gradient(135deg,#facc15,#f59e0b)",
  color: "#111827",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  fontSize: 30,
  fontWeight: 950,
  boxShadow: "0 18px 38px rgba(250,204,21,0.3)",
};

const buttonArrow: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "#111827",
  color: "#fff",
  fontSize: 34,
};

const notice: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  fontSize: 14,
  lineHeight: 1.55,
  fontWeight: 750,
};

const mediaCard: React.CSSProperties = {
  position: "relative",
  height: "100%",
  minHeight: 585,
  borderRadius: 30,
  padding: 20,
  background: "#fff",
  color: "#111827",
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto auto",
  gap: 16,
  boxShadow: "0 22px 60px rgba(0,0,0,0.28)",
};

const livePulse: React.CSSProperties = {
  position: "absolute",
  top: 18,
  right: 18,
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "#ef4444",
  animation: "livePulse 1.6s infinite",
};

const mediaTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

const rightBrandBox: React.CSSProperties = { display: "grid", gap: 9 };

const pplBadge: React.CSSProperties = {
  width: "fit-content",
  padding: "7px 12px",
  borderRadius: 999,
  background: "#166534",
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
};

const rightLogoLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#166534",
  fontSize: 28,
  fontWeight: 950,
};

const countCard: React.CSSProperties = {
  minWidth: 180,
  minHeight: 105,
  borderRadius: 20,
  background: "#111827",
  color: "#fff",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  textAlign: "center",
  padding: 12,
};

const dateMiniCard: React.CSSProperties = {
  minWidth: 180,
  minHeight: 105,
  borderRadius: 20,
  background: "#dbeafe",
  color: "#1e3a8a",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  textAlign: "center",
  padding: 12,
  fontWeight: 950,
};

const mediaBox: React.CSSProperties = {
  width: "100%",
  height: 330,
  borderRadius: 24,
  overflow: "hidden",
  background: "#020617",
  display: "grid",
  placeItems: "center",
};

const video: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: 0,
  background: "#000",
};

const image: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  background: "#f8fafc",
};

const noImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg,#e0f2fe,#dcfce7)",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  fontSize: 38,
  lineHeight: 1,
  fontWeight: 950,
};

const prizeArea: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 210px",
  gap: 16,
  alignItems: "center",
};

const productImageSmall: React.CSSProperties = {
  width: "100%",
  height: 150,
  objectFit: "contain",
  borderRadius: 20,
  background: "#f8fafc",
};

const prizeLabel: React.CSSProperties = {
  color: "#166534",
  fontSize: 15,
  fontWeight: 950,
};

const prizeTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "clamp(32px, 3.3vw, 46px)",
  lineHeight: 1.06,
  fontWeight: 950,
  letterSpacing: "-0.06em",
};

const prizeDescStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#4b5563",
  fontSize: 15,
  lineHeight: 1.5,
  fontWeight: 800,
};

const rightDateBox: React.CSSProperties = {
  minHeight: 60,
  borderRadius: 16,
  background: "#111827",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontSize: 22,
  fontWeight: 950,
};

const secondaryButton: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 16,
  background: "#ecfdf5",
  color: "#166534",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17,
  fontWeight: 950,
};