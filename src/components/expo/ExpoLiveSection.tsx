"use client";

import React from "react";
import Link from "next/link";

type LivePrize = {
  title?: string | null;
  summary?: string | null;
  link?: string | null;
};

type UpcomingLive = {
  title?: string | null;
  date_text?: string | null;
  summary?: string | null;
  link?: string | null;
};

type LiveItem = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;

  cta_label?: string | null;
  cta_link?: string | null;

  secondary_cta_label?: string | null;
  secondary_cta_link?: string | null;

  featured_title?: string | null;
  featured_desc?: string | null;
  featured_video_url?: string | null;
  featured_link?: string | null;

  prizes?: LivePrize[] | null;
  upcoming?: UpcomingLive[] | null;

  date_text?: string | null;
  participant_text?: string | null;
};

function safeText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function toYoutubeEmbed(url?: string | null) {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;

    if (u.pathname.includes("/embed/")) return url;
  } catch {}

  return null;
}

export default function ExpoLiveSection({
  item,
}: {
  item?: LiveItem | null;
}) {
  const title = safeText(item?.title, "K-Agri 월간 라이브 쇼");
  const subtitle = safeText(
    item?.subtitle,
    "신제품 발표 · 농민 퀴즈쇼 · 즉석 선물 · 대형 추첨"
  );
  const description = safeText(
    item?.description,
    "농민 참여와 기업 홍보를 동시에 살리는 라이브 프로그램입니다. 대표 장비 영상, 경품, 참여 방법을 한 번에 확인하세요."
  );

  const ctaLabel = safeText(item?.cta_label, "라이브쇼 상세 보기");
  const ctaLink = safeText(item?.cta_link, "/expo/live");

  const secondaryCtaLabel = safeText(item?.secondary_cta_label, "이벤트 참여하기");
  const secondaryCtaLink = safeText(item?.secondary_cta_link, "/expo/event");

  const featuredTitle = safeText(
    item?.featured_title,
    "영진로타리 산악형 돌 분쇄기"
  );
  const featuredDesc = safeText(
    item?.featured_desc,
    "이번 라이브쇼의 대표 장비입니다. 영상을 먼저 확인하고, 상세 페이지에서 경품과 참여 방법까지 함께 확인하실 수 있습니다."
  );
  const featuredLink = safeText(item?.featured_link, "/expo/live");

  const dateText = safeText(item?.date_text, "일정 준비중");
  const participantText = safeText(item?.participant_text, "참여 인원 집계중");

  const featuredVideoEmbed = toYoutubeEmbed(item?.featured_video_url);

  const prizes =
    item?.prizes && item.prizes.length > 0
      ? item.prizes
      : [
          {
            title: "영진로타리 산악형 돌 분쇄기",
            summary: "대표 장비 영상과 상세 내용을 확인할 수 있습니다.",
            link: "/expo/live",
          },
          {
            title: "싹쓰리충 골드",
            summary: "라이브 경품과 협찬 품목 안내 페이지로 연결됩니다.",
            link: "/expo/event",
          },
          {
            title: "멸규니",
            summary: "이번 회차 경품 및 상담 연결 품목으로 소개됩니다.",
            link: "/expo/event",
          },
          {
            title: "즉석 선물 / 참여 방법",
            summary: "참여 조건과 진행 절차를 한눈에 볼 수 있습니다.",
            link: "/expo/event",
          },
        ];

  const upcoming =
    item?.upcoming && item.upcoming.length > 0
      ? item.upcoming
      : [
          {
            title: "5월 1차 라이브",
            date_text: "5월 첫째 주 예정",
            summary: "신제품 발표와 현장 문제 상담 중심으로 진행 예정입니다.",
            link: "/expo/live",
          },
          {
            title: "5월 2차 라이브",
            date_text: "5월 셋째 주 예정",
            summary: "계절 병해충과 특가 품목을 중심으로 구성합니다.",
            link: "/expo/live",
          },
        ];

  return (
    <section style={S.section} className="expo-section">
      <div style={S.card}>
        <div style={S.topMeta}>
          <div style={S.kicker}>MONTHLY LIVE SHOW</div>
          <div style={S.metaRight}>
            <span style={S.metaPill}>{dateText}</span>
            <span style={S.metaPill}>{participantText}</span>
          </div>
        </div>

        <h2 style={S.title}>{title}</h2>
        <div style={S.subtitle}>{subtitle}</div>
        <div style={S.desc}>{description}</div>

        <div style={S.actions}>
          <Link href={ctaLink} style={S.primaryBtn}>
            {ctaLabel} →
          </Link>
          <Link href={secondaryCtaLink} style={S.secondaryBtn}>
            {secondaryCtaLabel} →
          </Link>
        </div>

        <div style={S.videoSection}>
          <div style={S.videoHead}>
            <div>
              <div style={S.videoBadge}>대표 장비</div>
              <div style={S.videoTitle}>{featuredTitle}</div>
              <div style={S.videoDesc}>{featuredDesc}</div>
            </div>
          </div>

          <div style={S.videoWrap}>
            {featuredVideoEmbed ? (
              <iframe
                title={featuredTitle}
                src={featuredVideoEmbed}
                style={S.iframe}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div style={S.videoFallback}>대표 영상이 아직 등록되지 않았습니다.</div>
            )}
          </div>

          <div style={S.videoActions}>
            <Link href={featuredLink} style={S.primaryBtnSmall}>
              장비 상세 보기 →
            </Link>
            <Link href={secondaryCtaLink} style={S.secondaryBtnSmall}>
              경품/참여 보기 →
            </Link>
          </div>
        </div>

        <div style={S.lowerGrid}>
          <div style={S.block}>
            <div style={S.blockTitle}>이번 방송에서 함께 보실 내용</div>
            <div style={S.prizeGrid}>
              {prizes.map((prize, idx) => (
                <Link
                  key={`${prize.title ?? "prize"}-${idx}`}
                  href={safeText(prize.link, "/expo/live")}
                  style={S.prizeCard}
                >
                  <div style={S.prizeCardTitle}>
                    {safeText(prize.title, "라이브 콘텐츠")}
                  </div>
                  <div style={S.prizeCardDesc}>
                    {safeText(prize.summary, "이번 라이브에서 확인할 수 있는 내용입니다.")}
                  </div>
                  <div style={S.prizeCardCta}>보러가기 →</div>
                </Link>
              ))}
            </div>
          </div>

          <div style={S.block}>
            <div style={S.blockTitle}>예정된 다음 라이브</div>
            <div style={S.upcomingList}>
              {upcoming.map((live, idx) => (
                <Link
                  key={`${live.title ?? "upcoming"}-${idx}`}
                  href={safeText(live.link, "/expo/live")}
                  style={S.upcomingCard}
                >
                  <div style={S.upcomingDate}>{safeText(live.date_text, "일정 준비중")}</div>
                  <div style={S.upcomingTitle}>
                    {safeText(live.title, "다음 라이브")}
                  </div>
                  <div style={S.upcomingDesc}>
                    {safeText(live.summary, "다음 방송 정보를 곧 안내드립니다.")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
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
  card: {
    background:
      "linear-gradient(135deg, #0b3ea8 0%, #1451d1 45%, #0f766e 100%)",
    borderRadius: 34,
    padding: 28,
    color: "#fff",
    boxShadow: "0 20px 44px rgba(15,23,42,0.12)",
  },
  topMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#86efac",
    letterSpacing: 0.5,
  },
  metaRight: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(36px, 6vw, 62px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: 900,
    color: "rgba(255,255,255,0.96)",
  },
  desc: {
    marginTop: 12,
    maxWidth: 980,
    fontSize: 15,
    lineHeight: 1.85,
    color: "rgba(255,255,255,0.86)",
  },
  actions: {
    marginTop: 22,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 16,
    padding: "14px 20px",
    fontWeight: 950,
    fontSize: 15,
    display: "inline-block",
  },
  secondaryBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: "14px 20px",
    fontWeight: 950,
    fontSize: 15,
    display: "inline-block",
  },
  videoSection: {
    marginTop: 26,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 26,
    padding: 18,
    backdropFilter: "blur(10px)",
  },
  videoHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  videoBadge: {
    display: "inline-block",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 950,
  },
  videoTitle: {
    marginTop: 14,
    fontSize: 34,
    lineHeight: 1.12,
    fontWeight: 950,
  },
  videoDesc: {
    marginTop: 12,
    maxWidth: 920,
    fontSize: 15,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.88)",
  },
  videoWrap: {
    marginTop: 18,
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 22,
    overflow: "hidden",
    background: "rgba(2,6,23,0.72)",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: 0,
  },
  videoFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.76)",
    fontSize: 16,
  },
  videoActions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtnSmall: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 950,
    fontSize: 14,
    display: "inline-block",
  },
  secondaryBtnSmall: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 950,
    fontSize: 14,
    display: "inline-block",
  },
  lowerGrid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 14,
  },
  block: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 18,
  },
  blockTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "#fff",
  },
  prizeGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  prizeCard: {
    textDecoration: "none",
    color: "#fff",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    minHeight: 132,
    display: "block",
  },
  prizeCardTitle: {
    fontSize: 20,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  prizeCardDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)",
  },
  prizeCardCta: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: 950,
    color: "#bbf7d0",
  },
  upcomingList: {
    marginTop: 14,
    display: "grid",
    gap: 12,
  },
  upcomingCard: {
    textDecoration: "none",
    color: "#fff",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    display: "block",
  },
  upcomingDate: {
    fontSize: 12,
    fontWeight: 950,
    color: "#86efac",
    letterSpacing: 0.3,
  },
  upcomingTitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 950,
  },
  upcomingDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)",
  },
};