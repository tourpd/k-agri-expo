import React from "react";
import Link from "next/link";

import ExpoFooter from "@/components/expo/ExpoFooter";

type Props = {
  hero: any;
  cms: any;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  promotions: any[];
  liveShow: any;
  hotIssues: any[];
  homeDeals: any[];
  monthlyQuestionItems: any[];
  problemContents: any[];
  autoNewProducts: any[];
  responsiveCss: string;
  pageStyle: React.CSSProperties;
};

const halls = [
  { icon: "📈", title: "농산물 거래소", desc: "농민과 바이어가 직접 만나는 국내 최대 직거래 장터", href: "/expo/hall" },
  { icon: "🚚", title: "산지직송 직판장", desc: "사진 한 장으로 판매! AI 상세페이지 제작 지원", href: "/expo/hall" },
  { icon: "🎁", title: "라이브 · 이벤트", desc: "실시간 라이브 쇼핑 · 경품 · 추첨 이벤트", href: "/expo/live" },
  { icon: "💬", title: "농사의 모든 걸 물어보세요", desc: "작물 · 병해충 · 비료 · 농기계 · 정부지원 · 가격까지", href: "/ai-consult" },
  { icon: "💜", title: "건강관 (한미양행)", desc: "농민 건강을 위한 맞춤 건강제품", href: "/expo/health/joint" },
  { icon: "🌿", title: "미래식량관", desc: "첨단 기능성 소재 · 단백질 · 메디푸드 · 건기식 · 화장품", href: "/expo/hall" },
];

const partners = [
  { name: "영진로타리", desc: "신제품 역회전 로타리", href: "/expo/live" },
  { name: "대동", desc: "스마트 농기계 솔루션", href: "/expo/hall" },
  { name: "TYM", desc: "트랙터·농기계 전문", href: "/expo/hall" },
  { name: "독수리5형제", desc: "친환경 농자재 전문", href: "/expo/hall" },
  { name: "한미양행", desc: "맞춤 건강제품", href: "/expo/health/joint" },
];

function Header() {
  return (
    <header style={S.header}>
      <div>
        <div style={S.logo}><span style={{ color: "#12843b" }}>K-Agri</span> 365 EXPO</div>
        <div style={S.sub}>365일 온라인 농업박람회</div>
      </div>
      <div style={S.headerActions}>
        <Link href="/search" style={S.iconBtn}>⌕</Link>
        <Link href="/login" style={S.loginBtn}>👤 로그인</Link>
        <Link href="/me" style={S.iconBtn}>🔔</Link>
      </div>
    </header>
  );
}

function HeroEvent() {
  return (
    <section style={S.heroGrid}>
      <div style={S.heroCard}>
        <div style={S.heroText}>농민이 찾는 모든 것,<br />여기 <span style={{ color: "#fde047" }}>한 곳</span>에!</div>
        <div style={S.stats}>
          <Stat label="참여기업" value="128개" />
          <Stat label="등록상품" value="5,421개" />
          <Stat label="오늘 상담" value="342건" />
          <Stat label="진행 이벤트" value="4건" />
        </div>
      </div>

      <Link href="/expo/live" style={S.eventCard}>
        <div style={S.badge}>진행중</div>
        <div style={S.eventSmall}>이번달 무료 추첨 이벤트!</div>
        <h2 style={S.eventTitle}>영진로타리<br />역회전 로타리 1대<br />무료 추첨 이벤트!</h2>
        <div style={S.eventBottom}>
          <strong>남은시간 D-22</strong>
          <span style={S.greenButton}>이벤트 참여하기 ›</span>
        </div>
      </Link>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

function PhotoDoctor() {
  return (
    <Link href="https://plant-doctor-app.vercel.app/" style={S.photoCard}>
      <div style={S.photoIcon}>📷</div>
      <div>
        <h2 style={S.cardTitle}>포토닥터</h2>
        <p style={S.cardDesc}>작물 문제, 사진 한장으로 진단!<br />AI가 빠르고 정확하게 알려드려요.</p>
        <span style={S.greenButton}>사진 올리기 ›</span>
      </div>
      <div style={S.photoBubble}>질병·해충<br />즉시 진단!</div>
    </Link>
  );
}

function HallGrid() {
  return (
    <section style={S.grid}>
      {halls.map((h) => (
        <Link key={h.title} href={h.href} style={S.tile}>
          <div style={S.tileIcon}>{h.icon}</div>
          <div>
            <h3 style={S.tileTitle}>{h.title}</h3>
            <p style={S.tileDesc}>{h.desc}</p>
            <span style={S.linkText}>바로가기 ›</span>
          </div>
        </Link>
      ))}
    </section>
  );
}

function FarmerChoice() {
  return (
    <Link href="/expo/farmer-decision" style={S.choiceCard}>
      <div>
        <h2 style={S.cardTitle}>농민의 선택 <span style={{ fontSize: 15 }}>(설문/데이터)</span></h2>
        <p style={S.cardDesc}>전국 농민 설문에 참여하고<br />농업 트렌드와 데이터를 확인하세요!</p>
        <span style={S.greenButton}>참여하기 ›</span>
      </div>
      <div style={S.choiceStats}>
        <strong>이번주 조사 현황</strong>
        <p>참여 농가 12,536명</p>
        <p>주요 작물 가격 전망</p>
        <div style={S.pills}>
          <span>상승 42%</span>
          <span>보합 35%</span>
          <span>하락 23%</span>
        </div>
      </div>
    </Link>
  );
}

function PartnerSection() {
  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <h2 style={S.sectionTitle}>이번주 참여기업</h2>
        <Link href="/expo/hall" style={S.more}>전체보기 ›</Link>
      </div>
      <div style={S.partnerRow}>
        {partners.map((p) => (
          <Link key={p.name} href={p.href} style={S.partnerCard}>
            <div style={S.newBadge}>NEW</div>
            <strong>{p.name}</strong>
            <p>{p.desc}</p>
            <span>제품 보기 ›</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BottomLinks() {
  const items = [
    ["📢", "공지사항", "엑스포 소식 확인하기", "/expo"],
    ["🤝", "입점 · 광고 문의", "참여 기업을 모집합니다", "/expo/vendor/apply"],
    ["🎧", "비즈니스 상담", "전문 상담 신청하기", "/expo/contact"],
    ["❔", "고객센터", "문의사항을 남겨주세요", "/expo/contact"],
  ];

  return (
    <section style={S.bottomGrid}>
      {items.map(([icon, title, desc, href]) => (
        <Link key={title} href={href} style={S.bottomCard}>
          <div style={S.bottomIcon}>{icon}</div>
          <div>
            <strong>{title}</strong>
            <p>{desc}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}

function BottomNav() {
  return (
    <nav style={S.bottomNav}>
      <Link href="/expo" style={S.navOn}>홈</Link>
      <Link href="https://plant-doctor-app.vercel.app/" style={S.nav}>포토닥터</Link>
      <Link href="/expo/live" style={S.nav}>이벤트</Link>
      <Link href="/expo/hall" style={S.nav}>거래소</Link>
      <Link href="/me" style={S.nav}>마이페이지</Link>
    </nav>
  );
}

export default function ExpoHomeLayout(_props: Props) {
  return (
    <main style={S.page} className="expo-home">
      <Header />
      <HeroEvent />
      <PhotoDoctor />
      <HallGrid />
      <FarmerChoice />
      <PartnerSection />
      <BottomLinks />
      <ExpoFooter />
      <BottomNav />
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "22px 18px 86px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    maxWidth: 1160,
    margin: "0 auto 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  logo: { fontSize: 32, fontWeight: 950, letterSpacing: "-0.06em" },
  sub: { marginTop: 4, fontSize: 15, color: "#475569", fontWeight: 800 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  iconBtn: { textDecoration: "none", color: "#111827", fontSize: 24 },
  loginBtn: {
    textDecoration: "none",
    color: "#047857",
    border: "1px solid #16a34a",
    borderRadius: 999,
    padding: "9px 16px",
    fontWeight: 950,
    background: "#fff",
  },
  heroGrid: {
    maxWidth: 1160,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: 14,
  },
  heroCard: {
    minHeight: 250,
    borderRadius: 24,
    padding: 28,
    color: "#fff",
    background:
      "linear-gradient(rgba(15,23,42,.28), rgba(15,23,42,.55)), linear-gradient(135deg, #0f172a 0%, #064e3b 55%, #15803d 100%)",
    boxShadow: "0 20px 50px rgba(15,23,42,.14)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  heroText: { fontSize: 34, lineHeight: 1.15, fontWeight: 950, letterSpacing: "-0.05em" },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    background: "rgba(0,0,0,.48)",
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  stat: { textAlign: "center" },
  statLabel: { fontSize: 13, opacity: .9, fontWeight: 900 },
  statValue: { marginTop: 4, fontSize: 23, fontWeight: 950 },
  eventCard: {
    textDecoration: "none",
    color: "#111827",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 44px rgba(15,23,42,.08)",
  },
  badge: {
    display: "inline-block",
    background: "#ef4444",
    color: "#fff",
    borderRadius: 999,
    padding: "5px 10px",
    fontWeight: 950,
    fontSize: 12,
  },
  eventSmall: { marginTop: 8, fontWeight: 900, color: "#334155" },
  eventTitle: { margin: "10px 0 20px", fontSize: 28, lineHeight: 1.2, letterSpacing: "-0.05em" },
  eventBottom: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  greenButton: {
    display: "inline-block",
    background: "#13823b",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 950,
    textDecoration: "none",
  },
  photoCard: {
    maxWidth: 1160,
    margin: "14px auto 0",
    textDecoration: "none",
    color: "#0f172a",
    minHeight: 190,
    borderRadius: 24,
    background: "linear-gradient(90deg,#f0fdf4,#ffffff)",
    border: "1px solid #dcfce7",
    display: "grid",
    gridTemplateColumns: "90px 1fr 130px",
    alignItems: "center",
    gap: 16,
    padding: 26,
  },
  photoIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#13823b",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 34,
  },
  photoBubble: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    color: "#13823b",
    fontWeight: 950,
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(15,23,42,.08)",
  },
  cardTitle: { margin: 0, fontSize: 26, fontWeight: 950, letterSpacing: "-0.04em" },
  cardDesc: { margin: "8px 0 14px", color: "#334155", fontWeight: 800, lineHeight: 1.55 },
  grid: {
    maxWidth: 1160,
    margin: "14px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  tile: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 20,
    minHeight: 160,
    display: "grid",
    gridTemplateColumns: "52px 1fr",
    gap: 14,
    boxShadow: "0 12px 30px rgba(15,23,42,.06)",
  },
  tileIcon: { fontSize: 36 },
  tileTitle: { margin: 0, fontSize: 22, fontWeight: 950, letterSpacing: "-0.04em" },
  tileDesc: { margin: "7px 0 12px", color: "#334155", lineHeight: 1.45, fontWeight: 800 },
  linkText: { color: "#13823b", fontWeight: 950 },
  choiceCard: {
    maxWidth: 1160,
    margin: "14px auto 0",
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 24,
    padding: 24,
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: 20,
  },
  choiceStats: { borderLeft: "1px solid #fdba74", paddingLeft: 20, fontWeight: 900 },
  pills: { display: "flex", gap: 8, flexWrap: "wrap" },
  section: { maxWidth: 1160, margin: "18px auto 0" },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 950 },
  more: { color: "#475569", textDecoration: "none", fontWeight: 900 },
  partnerRow: { display: "flex", overflowX: "auto", gap: 10, paddingBottom: 4 },
  partnerCard: {
    minWidth: 160,
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    fontWeight: 900,
  },
  newBadge: { color: "#16a34a", fontSize: 12, fontWeight: 950 },
  bottomGrid: {
    maxWidth: 1160,
    margin: "18px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  bottomCard: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  bottomIcon: { fontSize: 28 },
  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "#fff",
    borderTop: "1px solid #e5e7eb",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    padding: "10px 8px",
    zIndex: 50,
  },
  nav: { textAlign: "center", textDecoration: "none", color: "#64748b", fontWeight: 900 },
  navOn: { textAlign: "center", textDecoration: "none", color: "#15803d", fontWeight: 950 },
};

