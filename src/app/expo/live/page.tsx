import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ExpoLivePage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <section style={S.hero}>
          <div style={S.heroText}>
            <div style={S.badge}>📺 K-Agri 월간 라이브 쇼</div>

            <h1 style={S.title}>
              신제품 발표 · 농민 퀴즈쇼 · 즉석 선물 ·
              <br />
              대형 경품 추첨
            </h1>

            <p style={S.desc}>
              매달 K-Agri Expo 라이브에서 신제품 발표, 농민 퀴즈쇼, 즉석 선물,
              그리고 이달의 메인 경품 추첨까지 한 번에 진행합니다.
            </p>

            <div style={S.heroActions}>
              <Link href="/expo/event" style={S.primaryBtn}>
                이벤트 참여하기 →
              </Link>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={S.ghostBtn}
              >
                유튜브 바로가기
              </a>
            </div>
          </div>

          <div style={S.heroVisualWrap}>
            <img
              src="/images/mock/live-show.jpg"
              alt="K-Agri Live Show"
              style={S.heroVisual}
            />
          </div>
        </section>

        <section style={S.section}>
          <div style={S.eyebrow}>LIVE PROGRAM</div>
          <h2 style={S.sectionTitle}>이번 달 라이브 구성</h2>

          <div style={S.grid4}>
            <div style={S.card}>
              <div style={S.cardNo}>01</div>
              <div style={S.cardTitle}>신제품 발표</div>
              <div style={S.cardDesc}>
                참가 기업의 신제품과 주력 제품을 라이브에서 직접 소개합니다.
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardNo}>02</div>
              <div style={S.cardTitle}>농민 퀴즈쇼</div>
              <div style={S.cardDesc}>
                채팅창 정답자에게 싹쓰리충, 멸규니 등 즉석 선물을 제공합니다.
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardNo}>03</div>
              <div style={S.cardTitle}>특가 소개</div>
              <div style={S.cardDesc}>
                두루 마늘파종기, 켈팍, 칼마규황 등 EXPO 특가를 소개합니다.
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardNo}>04</div>
              <div style={S.cardTitle}>대형 경품 추첨</div>
              <div style={S.cardDesc}>
                영진로타리 산악형 돌분쇄기 1대 추첨을 라이브에서 진행합니다.
              </div>
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.eyebrow}>HOW TO WIN</div>
          <h2 style={S.sectionTitle}>경품 추첨 방식</h2>

          <div style={S.noticeBox}>
            <ul style={S.noticeList}>
              <li>이벤트 참여자 전화번호 목록에서 랜덤 추첨합니다.</li>
              <li>라이브 방송 중 당첨자 전화번호 일부를 공개합니다.</li>
              <li>당첨자는 채팅창에 본인 이름을 남기면 최종 확정됩니다.</li>
              <li>일정 시간 내 응답이 없으면 재추첨합니다.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    color: "#0f172a",
  },
  wrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "24px 24px 70px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 20,
    borderRadius: 34,
    padding: 28,
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)",
    color: "#fff",
  },
  heroText: {},
  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 950,
  },
  title: {
    margin: "18px 0 0",
    fontSize: 46,
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -1,
  },
  desc: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.9)",
    maxWidth: 760,
  },
  heroActions: {
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
  ghostBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.14)",
  },
  heroVisualWrap: {
    minHeight: 320,
    borderRadius: 24,
    overflow: "hidden",
    background: "rgba(255,255,255,0.08)",
  },
  heroVisual: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  section: {
    marginTop: 28,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    margin: "8px 0 0",
    fontSize: 32,
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.7,
  },
  grid4: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  cardNo: {
    fontSize: 14,
    fontWeight: 950,
    color: "#16a34a",
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1.15,
  },
  cardDesc: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.8,
  },
  noticeBox: {
    marginTop: 16,
    borderRadius: 24,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  noticeList: {
    margin: 0,
    paddingLeft: 18,
    color: "#475569",
    lineHeight: 1.9,
  },
};