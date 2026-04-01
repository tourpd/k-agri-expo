// src/app/expo/sponsor/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

const PACKAGES = [
  {
    title: "메인관 TOP 5",
    price: "500만원 ~ 1,000만원",
    badge: "PLATINUM",
    desc: "K-Agri Expo 메인 첫 화면 자동 슬라이드에 노출되는 최고 프리미엄 광고 상품입니다.",
    items: [
      "메인관 자동 슬라이드 노출",
      "부스 상세 바로 연결",
      "대표 이미지/로고 노출",
      "EXPO 특가 연동 가능",
      "한국농수산TV 협업형 노출 가능",
    ],
    tone: "dark",
  },
  {
    title: "농자재관 TOP 5",
    price: "200만원 ~ 400만원",
    badge: "PREMIUM",
    desc: "농자재관 상단 프리미엄 슬롯에 고정 노출됩니다.",
    items: [
      "농자재관 상단 TOP 5 고정 노출",
      "전시장 지도보다 먼저 노출",
      "대표 이미지/로고 표시",
      "부스 바로 입장 버튼",
    ],
    tone: "warm",
  },
  {
    title: "농기계관 TOP 5",
    price: "300만원 ~ 500만원",
    badge: "PREMIUM",
    desc: "농기계 기업을 위한 관별 프리미엄 배너형 상품입니다.",
    items: [
      "농기계관 상단 TOP 5 고정 노출",
      "신제품/행사 장비 강조 가능",
      "부스/특가/상담 연동",
      "대표 이미지 크게 노출",
    ],
    tone: "warm",
  },
  {
    title: "종자관 TOP 5",
    price: "150만원 ~ 300만원",
    badge: "SPECIAL",
    desc: "종자/육묘/품종 관련 업체를 위한 프리미엄 전시 슬롯입니다.",
    items: [
      "종자관 상단 TOP 5 고정 노출",
      "부스 대표 소개 강조",
      "품종/육묘 정보 연결",
    ],
    tone: "light",
  },
  {
    title: "스마트팜관 TOP 5",
    price: "200만원 ~ 400만원",
    badge: "SPECIAL",
    desc: "센서, 자동화, AI, 데이터농업 기업을 위한 프리미엄 슬롯입니다.",
    items: [
      "스마트팜관 상단 TOP 5 노출",
      "기술 기업 이미지 강조",
      "전시장/부스/상담 연결",
    ],
    tone: "light",
  },
  {
    title: "일반 부스",
    price: "50만원 ~ 100만원",
    badge: "STANDARD",
    desc: "상시 운영 온라인 박람회에 기본 입점하는 표준 부스 상품입니다.",
    items: [
      "부스 페이지 제공",
      "제품/특가/상담 연결",
      "전시장 지도 노출",
      "향후 확장형 광고 업그레이드 가능",
    ],
    tone: "plain",
  },
];

export default function ExpoSponsorPage() {
  return (
    <main style={S.page}>
      <div style={S.container}>
        <header style={S.header}>
          <div>
            <div style={S.kicker}>K-Agri Expo</div>
            <h1 style={S.title}>광고 · 스폰서 상품 안내</h1>
            <div style={S.sub}>
              K-Agri Expo는 연중 상시 운영되는 대한민국 농업 온라인 박람회입니다.
              메인관과 관별 프리미엄 슬롯, 일반 부스 상품을 통해 기업의 브랜드와 제품을 효과적으로 노출할 수 있습니다.
            </div>
          </div>

          <div style={S.headerActions}>
            <Link href="/expo" style={S.btnGhost}>
              엑스포 홈
            </Link>
            <Link href="/expo/booths" style={S.btnGhost}>
              부스 보기
            </Link>
            <Link href="/expo/deals" style={S.btnPrimary}>
              EXPO 특가
            </Link>
          </div>
        </header>

        <section style={S.hero}>
          <div style={S.heroBadge}>SPONSOR PROGRAM</div>
          <div style={S.heroTitle}>가장 잘 보이는 자리에 가장 강한 기업이 들어갑니다</div>
          <div style={S.heroDesc}>
            메인관 프리미엄 자동 슬라이드, 각 관 TOP 5 스폰서 슬롯, 일반 부스 입점까지
            단계별 상품으로 운영할 수 있습니다.
          </div>

          <div style={S.heroActions}>
            <a href="mailto:contact@kagri-expo.com" style={S.btnPrimary}>
              광고 문의하기
            </a>
            <Link href="/expo/booths" style={S.btnGhost}>
              현재 부스 보기
            </Link>
          </div>
        </section>

        <section style={S.grid}>
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.title}
              style={{
                ...S.card,
                ...(pkg.tone === "dark"
                  ? S.cardDark
                  : pkg.tone === "warm"
                  ? S.cardWarm
                  : pkg.tone === "light"
                  ? S.cardLight
                  : S.cardPlain),
              }}
            >
              <div style={S.badgeRow}>
                <div style={S.pkgBadge}>{pkg.badge}</div>
                <div style={S.price}>{pkg.price}</div>
              </div>

              <h2 style={S.cardTitle}>{pkg.title}</h2>
              <p style={S.cardDesc}>{pkg.desc}</p>

              <div style={S.itemWrap}>
                {pkg.items.map((item) => (
                  <div key={item} style={S.item}>
                    ✓ {item}
                  </div>
                ))}
              </div>

              <div style={S.cardActions}>
                <a href="mailto:contact@kagri-expo.com" style={S.btnPrimary}>
                  문의하기
                </a>
              </div>
            </article>
          ))}
        </section>

        <section style={S.noteBox}>
          <h3 style={S.noteTitle}>운영 방식</h3>
          <div style={S.noteText}>
            현재는 업체가 자료를 보내주시면 운영자가 검수 후 등록하는 방식이 가장 안정적입니다.
            이후 박람회가 커지면 업체 직접 등록 → 운영 승인 방식으로 확장할 수 있습니다.
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    color: "#111",
    padding: "28px 16px 56px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#ef4444",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    lineHeight: 1.8,
    maxWidth: 760,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
  },
  btnGhost: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
  },
  hero: {
    marginTop: 20,
    border: "1px solid #eee",
    borderRadius: 24,
    padding: 24,
    background: "linear-gradient(135deg, #111 0%, #2b2b2b 100%)",
    color: "#fff",
  },
  heroBadge: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: 950,
    lineHeight: 1.2,
    letterSpacing: -0.3,
  },
  heroDesc: {
    marginTop: 12,
    maxWidth: 760,
    fontSize: 15,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.9)",
  },
  heroActions: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  grid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
    gap: 14,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    border: "1px solid #eee",
  },
  cardDark: {
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
  },
  cardWarm: {
    background: "#fff7ed",
    color: "#111",
    border: "1px solid #fed7aa",
  },
  cardLight: {
    background: "#eff6ff",
    color: "#111",
    border: "1px solid #bfdbfe",
  },
  cardPlain: {
    background: "#fff",
    color: "#111",
    border: "1px solid #eee",
  },
  badgeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  pkgBadge: {
    fontSize: 11,
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(0,0,0,0.08)",
    width: "fit-content",
  },
  price: {
    fontSize: 18,
    fontWeight: 950,
  },
  cardTitle: {
    marginTop: 16,
    marginBottom: 0,
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1.25,
  },
  cardDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.8,
    color: "inherit",
    opacity: 0.9,
  },
  itemWrap: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  item: {
    fontSize: 13,
    lineHeight: 1.7,
  },
  cardActions: {
    marginTop: 18,
  },
  noteBox: {
    marginTop: 24,
    border: "1px solid #eee",
    borderRadius: 20,
    padding: 20,
    background: "#fafafa",
  },
  noteTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 950,
  },
  noteText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
  },
};