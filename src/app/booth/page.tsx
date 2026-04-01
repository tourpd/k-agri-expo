import Link from "next/link";
import React from "react";

const booths = [
  {
    slug: "dof",
    category: "농자재관",
    name: "도프",
    region: "대한민국",
    intro:
      "비료, 영양제, 병해충 대응 솔루션을 중심으로 농민 상담부터 제품 연결까지 이어지는 대표 부스입니다.",
    tags: ["싹쓰리충", "멸규니", "멀티피드", "켈팍", "메가파워칼"],
  },
  {
    slug: "seed-master",
    category: "종자관",
    name: "시드마스터",
    region: "대한민국",
    intro:
      "고추, 토마토, 오이 등 시기별 인기 종자와 육묘 전 꼭 확인해야 할 품종 정보를 제공하는 종자 전문 부스입니다.",
    tags: ["고추 종자", "토마토", "오이", "육묘"],
  },
  {
    slug: "green-bio",
    category: "친환경 농업관",
    name: "그린바이오",
    region: "대한민국",
    intro:
      "친환경 자재와 유기농 솔루션을 중심으로 병해충과 생육 문제를 해결하는 친환경 전문 부스입니다.",
    tags: ["친환경", "유기농", "해충 대응", "생육 회복"],
  },
  {
    slug: "daepung-machine",
    category: "농기계관",
    name: "대풍기계",
    region: "대한민국",
    intro:
      "농기계 신제품과 현장 효율 장비를 소개하고 실제 작업 조건에 맞는 장비 상담을 제공하는 농기계 부스입니다.",
    tags: ["농기계", "이식기", "작업 효율", "장비 상담"],
  },
  {
    slug: "smart-farm-tech",
    category: "스마트 농업관",
    name: "스마트팜테크",
    region: "대한민국",
    intro:
      "드론, 센서, 자동화, 데이터 기반 농업 관리까지 스마트 농업 기술을 소개하는 디지털 농업 부스입니다.",
    tags: ["드론", "센서", "자동화", "데이터 농업"],
  },
  {
    slug: "new-agri-lab",
    category: "이달의 신제품관",
    name: "뉴애그리랩",
    region: "대한민국",
    intro:
      "이번 달 새로 나온 농업 기술과 신제품을 먼저 소개하고 바이어와 농민의 관심을 연결하는 신제품 부스입니다.",
    tags: ["신제품", "신기술", "신제품 런칭"],
  },
];

export default function BoothPage() {
  return (
    <main style={S.page}>
      <section style={S.hero}>
        <div style={S.heroBadge}>K-Agri Expo</div>
        <h1 style={S.heroTitle}>참가 기업 / 부스 보기</h1>

        <p style={S.heroDesc}>
          단순 전시가 아니라 농민 상담 → 제품 → 주문까지 이어지는
          **실제 영업형 농업 플랫폼 부스**입니다.
        </p>
      </section>

      <section style={S.section}>
        <div style={S.sectionHead}>
          <div>
            <div style={S.eyebrow}>FEATURED BOOTHS</div>
            <h2 style={S.title}>엑스포 참가 기업</h2>
          </div>

          <Link href="/enter" style={S.primaryLink}>
            기업 입점하기 →
          </Link>
        </div>

        <div style={S.grid}>
          {booths.map((booth) => (
            <Link key={booth.slug} href={`/booth/${booth.slug}`} style={S.card}>
              <div style={S.cardTop}>
                <div style={S.avatar}>{booth.name.slice(0, 1)}</div>

                <div style={{ flex: 1 }}>
                  <div style={S.cardCategory}>{booth.category}</div>

                  <h3 style={S.cardTitle}>{booth.name}</h3>

                  <div style={S.cardRegion}>{booth.region}</div>
                </div>
              </div>

              <p style={S.cardIntro}>{booth.intro}</p>

              <div style={S.tagsWrap}>
                {booth.tags.map((tag) => (
                  <span key={tag} style={S.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={S.cardCta}>부스 입장 →</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#f8fafc 0%,#ffffff 100%)",
    color: "#0f172a",
    paddingBottom: 60,
  },

  hero: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "60px 24px 20px",
  },

  heroBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 900,
  },

  heroTitle: {
    margin: "18px 0 0",
    fontSize: 48,
    fontWeight: 900,
  },

  heroDesc: {
    marginTop: 18,
    maxWidth: 800,
    color: "#64748b",
    fontSize: 17,
    lineHeight: 1.8,
  },

  section: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "10px 24px",
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
  },

  title: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: 900,
  },

  primaryLink: {
    textDecoration: "none",
    color: "#fff",
    background: "#15803d",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 800,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 20,
  },

  card: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "linear-gradient(135deg,#0f172a,#16a34a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 900,
  },

  cardCategory: {
    fontSize: 11,
    fontWeight: 900,
    background: "#f1f5f9",
    padding: "5px 8px",
    borderRadius: 999,
    display: "inline-block",
  },

  cardTitle: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 900,
  },

  cardRegion: {
    fontSize: 13,
    color: "#64748b",
  },

  cardIntro: {
    marginTop: 14,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },

  tagsWrap: {
    marginTop: 14,
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  tag: {
    padding: "5px 8px",
    borderRadius: 999,
    background: "#ecfeff",
    color: "#155e75",
    fontSize: 12,
    fontWeight: 700,
  },

  cardCta: {
    marginTop: 16,
    fontWeight: 900,
    color: "#15803d",
  },
};