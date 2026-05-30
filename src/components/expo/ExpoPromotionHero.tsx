"use client";

import React from "react";

type Props = {
  item: any;
  mode?: "admin" | "public";
};

function safe(v: unknown, fallback = "") {
  const s = String(v || "").trim();
  return s || fallback;
}

function num(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toYoutubeEmbed(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";

  if (v.includes("youtube.com/embed/")) return v;

  if (v.includes("youtu.be/")) {
    const id = v.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (v.includes("watch?v=")) {
    const id = v.split("watch?v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  return "";
}

function getDDay(v?: string | null) {
  const value = safe(v);
  if (!value) return "D-22";

  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "D-22";

  const diff = t - Date.now();
  if (diff <= 0) return "D-DAY";

  return `D-${Math.ceil(diff / (1000 * 60 * 60 * 24))}`;
}

export default function ExpoPromotionHero({ item, mode = "public" }: Props) {
  const title = safe(item?.title, "2026 영진로타리 신제품 출시");
  const subtitle = safe(item?.subtitle, "역회전 로타리 1대 무료 추첨");

  const sponsorName = safe(item?.sponsor_name, "영진로타리");
  const partnerName = safe(item?.partner_name, "K-Agri Expo");

  const liveDateLabel = safe(
    item?.live_date_label,
    "5월 28일 (수) 오후 8시 LIVE"
  );

  const dday = safe(item?.dday_label) || getDDay(item?.live_datetime);

  const participantCount = num(
    item?.participant_count_auto ?? item?.participant_count_manual,
    150
  );

  const buttonText = safe(item?.button_text, "무료 추첨 참여하기");
  const buttonLink = safe(item?.button_link, "/expo/live/join");

  const guideText = safe(
    item?.description,
    "사전 참여 후 방송 중 실시간 추첨을 통해 최종 당첨자를 선정합니다."
  );

  const prizeLabel = safe(item?.prize_label, "오늘의 대표 경품");
  const prizeTitle = safe(item?.prize_title, "영진로타리 역회전 로타리");
  const prizeDesc = safe(
    item?.prize_desc,
    "돌 많은 밭에서도 강력한 작업이 가능한 영진로타리 역회전 로타리입니다."
  );

  const feature1 = safe(item?.feature_1, "돌 많은 밭에서도 강력한 분쇄력");
  const feature2 = safe(item?.feature_2, "역회전 구조로 토양 깊이 파쇄");
  const feature3 = safe(item?.feature_3, "방송 중 실시간 당첨자 공개");
  const feature4 = safe(item?.feature_4, "전화 확인 후 최종 경품 확정");

  const imageUrl = safe(item?.image_url);
  const videoUrl = safe(item?.video_url);
  const embedUrl = toYoutubeEmbed(videoUrl);

  const productImageScale = num(item?.product_image_scale, 1);

  return (
    <section style={mode === "admin" ? S.adminWrap : S.wrap}>
      <div style={S.poster}>
        <div style={S.left}>
          <div style={S.topMini}>
            <div style={S.kagri}>🌿 K-Agri Expo</div>
            <div style={S.monthly}>MONTHLY LIVE EVENT</div>
          </div>

          <div style={S.leftHero}>
            <div style={S.logoCoin}>工</div>

            <h2 style={S.mainTitle}>{title}</h2>

            <div style={S.ddayCard}>
              <div style={S.ddayText}>{dday}</div>
              <div style={S.ddayDate}>{liveDateLabel}</div>
              <div style={S.ddaySmall}>LIVE까지 남았습니다!</div>
            </div>
          </div>

          <div style={S.yellowBenefit}>🎁 {subtitle}</div>

          <div style={S.flowBox}>
            <div style={S.flowTitle}>참여 방법</div>
            <div style={S.flowRow}>
              <Flow icon="📝" title="사전 참여" text="참여 신청하기" />
              <Arrow />
              <Flow icon="▶️" title="방송 시청" text="라이브 시청하기" />
              <Arrow />
              <Flow icon="🎁" title="실시간 추첨" text="방송 중 추첨 진행" />
              <Arrow />
              <Flow icon="☎️" title="전화 확인" text="당첨자 개별 연락" />
              <Arrow />
              <Flow icon="⭐" title="최종 당첨" text="경품 발송" />
            </div>
          </div>

          <div style={S.infoGrid}>
            <div style={S.performanceBox}>
              <h3 style={S.infoTitle}>제품의 강력한 성능</h3>
              <p style={S.infoText}>✓ {feature1}</p>
              <p style={S.infoText}>✓ {feature2}</p>
            </div>

            <div style={S.drawBox}>
              <h3 style={S.infoTitle}>라이브 추첨 안내</h3>
              <p style={S.infoText}>✓ {feature3}</p>
              <p style={S.infoText}>✓ {feature4}</p>
            </div>
          </div>

          <a href={buttonLink} style={S.ctaButton}>
            <span>🎁</span>
            <strong>{buttonText}</strong>
            <b>›</b>
          </a>

          <div style={S.guideBox}>
            <span>✎</span>
            <p>{guideText}</p>
          </div>
        </div>

        <div style={S.right}>
          <div style={S.rightHead}>
            <div>
              <div style={S.ppl}>PPL 협찬사</div>
              <div style={S.partner}>🌿 {partnerName}</div>
              <div style={S.sponsor}>{sponsorName}</div>
            </div>

            <div style={S.participantBox}>
              <div style={S.participantLabel}>현재 참여 농가</div>
              <div style={S.participantNumber}>
                {participantCount.toLocaleString("ko-KR")}
                <span style={S.peopleUnit}>명</span>
              </div>
              <div style={S.people}>👥</div>
            </div>
          </div>

          <div style={S.mediaBox}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={title}
                allowFullScreen
                style={S.video}
              />
            ) : (
              <div style={S.emptyMedia}>유튜브 링크를 입력하세요</div>
            )}
          </div>

          <div style={S.prizeBlock}>
            <div style={S.prizeText}>
              <div style={S.prizeLabel}>{prizeLabel}</div>
              <h3 style={S.prizeTitle}>{prizeTitle}</h3>
              <p style={S.prizeDesc}>{prizeDesc}</p>
            </div>

            <div style={S.prizeImageWrap}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={prizeTitle}
                  style={{
                    ...S.prizeImage,
                    transform: `scale(${productImageScale})`,
                  }}
                />
              ) : (
                <div style={S.prizePlaceholder}>경품 이미지</div>
              )}
            </div>
          </div>

          <div style={S.redSchedule}>
            <div style={S.calendarBig}>📅</div>
            <div>
              <div style={S.redScheduleLabel}>라이브 일정</div>
              <div style={S.redScheduleText}>{liveDateLabel}</div>
            </div>
          </div>

          <div style={S.note}>※ 방송 일정은 변경될 수 있습니다.</div>
        </div>
      </div>
    </section>
  );
}

function Flow({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div style={S.flowItem}>
      <div style={S.flowIcon}>{icon}</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Arrow() {
  return <div style={S.arrow}>→</div>;
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    padding: "24px 20px 0",
  },

  adminWrap: {
    padding: 0,
  },

  poster: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: 26,
    borderRadius: 34,
    background:
      "linear-gradient(135deg, #030712 0%, #071827 45%, #063f2f 100%)",
    color: "#ffffff",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    boxShadow: "0 30px 90px rgba(15,23,42,0.28)",
    overflow: "hidden",
  },

  left: {
    minWidth: 0,
  },

  topMini: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  kagri: {
    color: "#86efac",
    fontSize: 17,
    fontWeight: 950,
  },

  monthly: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#991b1b",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 950,
    letterSpacing: "0.03em",
  },

  leftHero: {
    display: "grid",
    gridTemplateColumns: "78px 1fr 190px",
    gap: 15,
    alignItems: "center",
  },

  logoCoin: {
    width: 66,
    height: 66,
    borderRadius: 999,
    background: "linear-gradient(135deg,#fef3c7,#f59e0b)",
    color: "#92400e",
    border: "5px solid #ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: 36,
    fontWeight: 950,
  },

  mainTitle: {
    margin: 0,
    fontSize: 52,
    lineHeight: 1.03,
    letterSpacing: "-0.075em",
    fontWeight: 950,
    wordBreak: "keep-all",
  },

  ddayCard: {
    height: 146,
    borderRadius: 22,
    background: "linear-gradient(180deg,#ef4444 0%,#991b1b 100%)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 13,
    boxShadow: "0 18px 42px rgba(239,68,68,0.25)",
  },

  ddayText: {
    fontSize: 54,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.05em",
  },

  ddayDate: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 1.25,
    fontWeight: 950,
    whiteSpace: "pre-line",
  },

  ddaySmall: {
    marginTop: 5,
    fontSize: 12,
    color: "#fecaca",
    fontWeight: 850,
  },

  yellowBenefit: {
    marginTop: 18,
    minHeight: 60,
    borderRadius: 16,
    background: "linear-gradient(135deg,#fde047 0%,#fb923c 100%)",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    lineHeight: 1.15,
    fontWeight: 950,
    wordBreak: "keep-all",
  },

  flowBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    background: "rgba(2,6,23,0.48)",
    border: "1px solid rgba(255,255,255,0.14)",
  },

  flowTitle: {
    color: "#fde047",
    fontSize: 14,
    fontWeight: 950,
    marginBottom: 13,
  },

  flowRow: {
    display: "grid",
    gridTemplateColumns:
      "1fr 22px 1fr 22px 1fr 22px 1fr 22px 1fr",
    gap: 4,
    alignItems: "center",
  },

  flowItem: {
    textAlign: "center",
    display: "grid",
    gap: 5,
    fontSize: 12,
    fontWeight: 850,
  },

  flowIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    margin: "0 auto",
    background: "rgba(255,255,255,0.08)",
    display: "grid",
    placeItems: "center",
    fontSize: 26,
  },

  arrow: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: 950,
  },

  infoGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  performanceBox: {
    padding: 16,
    borderRadius: 18,
    background: "rgba(22,101,52,0.55)",
    border: "1px solid rgba(134,239,172,0.22)",
  },

  drawBox: {
    padding: 16,
    borderRadius: 18,
    background: "rgba(30,64,175,0.52)",
    border: "1px solid rgba(147,197,253,0.22)",
  },

  infoTitle: {
    margin: "0 0 8px",
    color: "#fde047",
    fontSize: 18,
    fontWeight: 950,
  },

  infoText: {
    margin: "6px 0 0",
    fontSize: 15,
    fontWeight: 850,
    lineHeight: 1.45,
  },

  ctaButton: {
    marginTop: 16,
    minHeight: 68,
    borderRadius: 20,
    background: "linear-gradient(135deg,#fde047 0%,#f59e0b 100%)",
    color: "#111827",
    textDecoration: "none",
    display: "grid",
    gridTemplateColumns: "54px 1fr 48px",
    alignItems: "center",
    padding: "0 18px",
    fontSize: 32,
    fontWeight: 950,
  },

  guideBox: {
    marginTop: 14,
    padding: "15px 18px",
    borderRadius: 17,
    background: "rgba(2,6,23,0.52)",
    border: "1px solid rgba(255,255,255,0.13)",
    display: "flex",
    gap: 12,
    alignItems: "center",
    color: "#ffffff",
    fontWeight: 800,
    lineHeight: 1.5,
  },

  right: {
    minWidth: 0,
    borderRadius: 28,
    background: "#ffffff",
    color: "#111827",
    padding: 22,
    display: "grid",
    gap: 15,
  },

  rightHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },

  ppl: {
    width: "fit-content",
    padding: "8px 14px",
    borderRadius: 999,
    background: "#166534",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 950,
    marginBottom: 8,
  },

  partner: {
    color: "#166534",
    fontSize: 26,
    lineHeight: 1.1,
    fontWeight: 950,
  },

  sponsor: {
    marginTop: 6,
    color: "#166534",
    fontSize: 29,
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },

  participantBox: {
    width: 190,
    height: 96,
    borderRadius: 17,
    background: "#020617",
    color: "#ffffff",
    padding: "13px 16px",
    position: "relative",
    boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
  },

  participantLabel: {
    fontSize: 15,
    fontWeight: 900,
    color: "#e5e7eb",
  },

  participantNumber: {
    marginTop: 4,
    color: "#facc15",
    fontSize: 48,
    lineHeight: 1,
    fontWeight: 950,
  },

  peopleUnit: {
    fontSize: 18,
    marginLeft: 4,
    color: "#ffffff",
  },

  people: {
    position: "absolute",
    right: 12,
    top: 18,
    width: 42,
    height: 42,
    borderRadius: 999,
    background: "#166534",
    display: "grid",
    placeItems: "center",
    fontSize: 21,
  },

  mediaBox: {
    height: 285,
    borderRadius: 22,
    overflow: "hidden",
    background: "#000000",
    display: "grid",
    placeItems: "center",
  },

  video: {
    width: "100%",
    height: "100%",
    border: 0,
    display: "block",
    background: "#000000",
  },

  emptyMedia: {
    color: "#94a3b8",
    fontSize: 20,
    fontWeight: 950,
    textAlign: "center",
  },

  prizeBlock: {
    display: "grid",
    gridTemplateColumns: "1fr 210px",
    gap: 16,
    alignItems: "center",
  },

  prizeText: {
    minWidth: 0,
  },

  prizeLabel: {
    width: "fit-content",
    padding: "7px 13px",
    borderRadius: 999,
    background: "#166534",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 950,
    marginBottom: 8,
  },

  prizeTitle: {
    margin: 0,
    fontSize: 31,
    lineHeight: 1.08,
    letterSpacing: "-0.05em",
    fontWeight: 950,
    color: "#111827",
    wordBreak: "keep-all",
  },

  prizeDesc: {
    margin: "10px 0 0",
    color: "#475569",
    fontSize: 15,
    lineHeight: 1.45,
    fontWeight: 800,
    wordBreak: "keep-all",
  },

  prizeImageWrap: {
    height: 132,
    borderRadius: 999,
    background: "#dcfce7",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  prizeImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transformOrigin: "center center",
    transition: "transform 0.2s ease",
  },

  prizePlaceholder: {
    color: "#166534",
    fontWeight: 950,
  },

  redSchedule: {
    padding: "17px 19px",
    borderRadius: 18,
    background: "linear-gradient(135deg,#ef4444 0%,#991b1b 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 14px 32px rgba(185,28,28,0.22)",
  },

  calendarBig: {
    width: 56,
    height: 56,
    borderRadius: 13,
    background: "#ffffff",
    color: "#111827",
    display: "grid",
    placeItems: "center",
    fontSize: 33,
  },

  redScheduleLabel: {
    fontSize: 17,
    fontWeight: 950,
    color: "#fecaca",
  },

  redScheduleText: {
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 950,
  },

  note: {
    color: "#475569",
    fontSize: 12,
    fontWeight: 800,
  },
};