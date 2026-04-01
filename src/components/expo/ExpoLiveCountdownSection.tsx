import React from "react";
import Link from "next/link";

type PrizeItem = {
  id: string;
  title: string;
  subtitle?: string | null;
};

type LiveCountdownSectionProps = {
  title?: string;
  subtitle?: string;
  liveDateText?: string;
  eventDate?: string | null; // 예: "2026-04-27T19:00:00+09:00"
  participantCount?: number;
  todayIncreaseCount?: number;
  prizes?: PrizeItem[];
  liveLink?: string;
  eventLink?: string;
};

function getDdayLabel(eventDate?: string | null) {
  if (!eventDate) return "일정 준비중";

  const target = new Date(eventDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (Number.isNaN(target)) return "일정 준비중";

  const dayMs = 1000 * 60 * 60 * 24;
  const dday = Math.ceil(diff / dayMs);

  if (dday > 0) return `D-${dday}`;
  if (dday === 0) return "D-DAY";
  return "진행 후";
}

export default function ExpoLiveCountdownSection({
  title = "K-Agri 월간 라이브 쇼",
  subtitle = "이달의 경품과 핫 이슈를 라이브로 공개합니다.",
  liveDateText = "4월 27일 저녁 7시",
  eventDate,
  participantCount = 1284,
  todayIncreaseCount = 128,
  prizes = [],
  liveLink = "/expo/live",
  eventLink = "/expo/event",
}: LiveCountdownSectionProps) {
  const ddayLabel = getDdayLabel(eventDate);

  return (
    <section style={S.sectionWrap} className="expo-section">
      <div style={S.card}>
        <div style={S.headerRow}>
          <div>
            <div style={S.eyebrow}>🔥 MONTHLY LIVE SHOW</div>
            <h2 style={S.title}>{title}</h2>
            <p style={S.subtitle}>{subtitle}</p>
          </div>

          <div style={S.ddayBox}>
            <div style={S.ddayLabel}>라이브까지</div>
            <div style={S.ddayValue}>{ddayLabel}</div>
          </div>
        </div>

        <div style={S.statGrid}>
          <div style={S.statCard}>
            <div style={S.statLabel}>라이브 일정</div>
            <div style={S.statValue}>{liveDateText}</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>현재 참여 농민</div>
            <div style={S.statValue}>{participantCount.toLocaleString()}명</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>오늘 증가</div>
            <div style={S.statValue}>+{todayIncreaseCount.toLocaleString()}명</div>
          </div>
        </div>

        <div style={S.prizeWrap}>
          <div style={S.prizeTitle}>이번 라이브 경품</div>

          {prizes.length === 0 ? (
            <div style={S.emptyBox}>이번 달 경품 정보가 곧 공개됩니다.</div>
          ) : (
            <div style={S.prizeGrid}>
              {prizes.map((item) => (
                <div key={item.id} style={S.prizeCard}>
                  <div style={S.prizeName}>{item.title}</div>
                  {item.subtitle ? (
                    <div style={S.prizeSubtitle}>{item.subtitle}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.buttonRow}>
          <Link href={eventLink} style={S.primaryBtn}>
            이벤트 참여하기 →
          </Link>
          <Link href={liveLink} style={S.secondaryBtn}>
            라이브 일정 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  sectionWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  card: {
    borderRadius: 32,
    padding: 28,
    color: "#fff",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #0f766e 100%)",
    boxShadow: "0 18px 44px rgba(15,23,42,0.12)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(28px, 4vw, 42px)",
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 12,
    maxWidth: 760,
    fontSize: 15,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.88)",
  },
  ddayBox: {
    minWidth: 140,
    borderRadius: 22,
    padding: "16px 18px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
  },
  ddayLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.78)",
  },
  ddayValue: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: 950,
    lineHeight: 1,
  },
  statGrid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  statCard: {
    borderRadius: 20,
    padding: "16px 18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.75)",
  },
  statValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  prizeWrap: {
    marginTop: 24,
  },
  prizeTitle: {
    fontSize: 16,
    fontWeight: 950,
    marginBottom: 12,
  },
  prizeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  prizeCard: {
    borderRadius: 18,
    padding: "16px 18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  prizeName: {
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1.4,
  },
  prizeSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.6,
  },
  emptyBox: {
    borderRadius: 18,
    padding: "16px 18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 14,
    color: "rgba(255,255,255,0.86)",
  },
  buttonRow: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 950,
  },
  secondaryBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.16)",
  },
};