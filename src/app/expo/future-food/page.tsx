import Link from "next/link";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

const cards = [
  {
    icon: "🐛",
    title: "곤충산업\n시작하기",
    href: "/expo/future-food/insect",
  },
  {
    icon: "🎓",
    title: "KFFR\n미래농업 아카데미",
    href: "/expo/future-food/academy",
  },
  {
    icon: "🏭",
    title: "스마트\n사육농장",
    href: "/expo/future-food/smart-farm",
  },
  {
    icon: "❤️",
    title: "생산형\n치유농업",
    href: "/expo/future-food/healing",
  },
  {
    icon: "🧑‍🌾",
    title: "청년농\n프로젝트",
    href: "/expo/future-food/youth",
  },
  {
    icon: "💪",
    title: "AI 농민건강관\n미래단백질 건강산업",
    href: "/expo/future-food/health",
    featured: true,
  },
  {
    icon: "🏘",
    title: "미래농업\n정착마을",
    href: "/expo/future-food/village",
  },
];

export default function FutureFoodPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <Link href="/expo" style={styles.backButton}>
          ← K-Agri Expo
        </Link>

        <a href="#future-cards" style={styles.heroButton}>
          새로운 기회 보기
        </a>
      </section>

      <section id="future-cards" style={styles.content}>
        <div style={styles.sectionKicker}>FUTURE AGRICULTURE</div>

        <h2 style={styles.sectionTitle}>대한민국 농업의 새로운 기회</h2>

        <p style={styles.sectionDesc}>
          미래식량관은 곤충을 파는 곳이 아닙니다.
          <br />
          농민이 생산자에서 경영자, 산업가로 성장하는 미래농업 게이트웨이입니다.
        </p>

        <div style={styles.line} />

        <div style={styles.grid}>
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              style={{
                ...styles.card,
                ...(card.featured ? styles.featuredCard : {}),
              }}
            >
              {card.featured ? (
                <div style={styles.hotBadge}>한미양행 연계 핵심관</div>
              ) : null}

              <div style={styles.iconWrap}>
                <span style={styles.icon}>{card.icon}</span>
              </div>

              <strong style={styles.cardTitle}>{card.title}</strong>

              <span style={styles.more}>
                {card.featured ? "AI 농민건강관 보기 →" : "자세히 보기 →"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section style={styles.healthBanner}>
        <div style={styles.healthKicker}>HANMI × KFFR × K-AGRI EXPO</div>

        <h2 style={styles.healthTitle}>
          한미양행 1,836개 제품을
          <br />
          농민 건강문제 기준으로 다시 분류합니다.
        </h2>

        <p style={styles.healthText}>
          근력감소 · 관절 · 눈건강 · 혈행 · 기억력 · 면역 · 수면 · 곤충단백질까지
          <br />
          고령 농민에게 필요한 건강 솔루션을 AI 농민건강관에서 보여줍니다.
        </p>

        <Link href="/expo/future-food/health" style={styles.healthButton}>
          AI 농민건강관 바로가기 →
        </Link>
      </section>

      <section style={styles.footer}>
        <strong style={styles.footerTitle}>K-AGRI EXPO FUTURE FOOD</strong>

        <p style={styles.footerText}>
          치유농업은 체험이 아닙니다.
          <br />
          건강 → 생산 → 소득으로 연결되어야 합니다.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f5f1",
    color: "#111",
    fontFamily:
      "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },

  hero: {
    minHeight: "760px",
    backgroundImage: "url('/images/future-food-hero.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderBottom: "1px solid rgba(7,91,48,0.12)",
    position: "relative",
  },

  backButton: {
    position: "absolute",
    left: 28,
    top: 24,
    padding: "13px 18px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.88)",
    color: "#075b30",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 950,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    zIndex: 120,
  },

  heroButton: {
    position: "absolute",
    left: "85px",
    top: "430px",
    width: "190px",
    height: "60px",
    borderRadius: "12px",
    background: "transparent",
    color: "transparent",
    textDecoration: "none",
    cursor: "pointer",
    zIndex: 100,
  },

  content: {
    padding: "70px 40px 80px",
    textAlign: "center",
    background: "#f4f5f1",
  },

  sectionKicker: {
    color: "#08733e",
    fontSize: "20px",
    fontWeight: 950,
  },

  sectionTitle: {
    margin: "14px 0 0",
    fontSize: "clamp(34px, 5vw, 54px)",
    letterSpacing: "-0.05em",
    fontWeight: 950,
    color: "#111",
    wordBreak: "keep-all",
  },

  sectionDesc: {
    marginTop: 18,
    fontSize: 22,
    lineHeight: 1.65,
    fontWeight: 800,
    color: "#333",
    wordBreak: "keep-all",
  },

  line: {
    width: "90px",
    height: "3px",
    background: "#08733e",
    margin: "28px auto 42px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "26px",
    maxWidth: "1120px",
    margin: "0 auto",
  },

  card: {
    minHeight: "270px",
    padding: "34px 24px",
    borderRadius: "18px",
    background: "#fff",
    boxShadow: "0 16px 34px rgba(0,0,0,0.1)",
    textDecoration: "none",
    color: "#111",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    border: "1px solid rgba(8,115,62,0.08)",
  },

  featuredCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)",
    border: "3px solid #16a34a",
    boxShadow: "0 20px 48px rgba(22,163,74,0.22)",
  },

  hotBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: "8px 12px",
    borderRadius: 999,
    background: "#16a34a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
  },

  iconWrap: {
    width: "112px",
    height: "112px",
    borderRadius: "999px",
    background: "#eef6ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },

  icon: {
    fontSize: "54px",
  },

  cardTitle: {
    whiteSpace: "pre-line",
    fontSize: "24px",
    lineHeight: 1.28,
    letterSpacing: "-0.05em",
    fontWeight: 950,
    wordBreak: "keep-all",
  },

  more: {
    marginTop: "24px",
    color: "#08733e",
    fontSize: "18px",
    fontWeight: 900,
  },

  healthBanner: {
    maxWidth: 1120,
    margin: "0 auto 42px",
    padding: "58px 34px",
    borderRadius: 28,
    background: "linear-gradient(135deg, #064e3b 0%, #15803d 100%)",
    color: "#fff",
    textAlign: "center",
    boxShadow: "0 20px 48px rgba(6,78,59,0.22)",
  },

  healthKicker: {
    color: "#bbf7d0",
    fontSize: 18,
    fontWeight: 950,
  },

  healthTitle: {
    margin: "18px 0 0",
    fontSize: "clamp(32px, 5vw, 52px)",
    lineHeight: 1.18,
    letterSpacing: "-0.05em",
    fontWeight: 950,
    wordBreak: "keep-all",
  },

  healthText: {
    marginTop: 22,
    fontSize: 21,
    lineHeight: 1.65,
    fontWeight: 800,
    color: "rgba(255,255,255,0.86)",
    wordBreak: "keep-all",
  },

  healthButton: {
    marginTop: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 62,
    padding: "0 34px",
    borderRadius: 999,
    background: "#facc15",
    color: "#111",
    textDecoration: "none",
    fontSize: 22,
    fontWeight: 950,
  },

  footer: {
    margin: "0 auto 60px",
    maxWidth: "1120px",
    padding: "56px 24px",
    textAlign: "center",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(232,242,234,0.95))",
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
  },

  footerTitle: {
    color: "#08733e",
    fontSize: "24px",
    fontWeight: 950,
  },

  footerText: {
    marginTop: "18px",
    fontSize: "24px",
    lineHeight: 1.65,
    fontWeight: 900,
    color: "#333",
    wordBreak: "keep-all",
  },
};