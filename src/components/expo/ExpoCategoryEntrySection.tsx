import Link from "next/link";

const CATEGORIES = [
  {
    hallId: "fertilizer",
    icon: "🌱",
    title: "비료관",
    desc: "기비·추비·비대·활력 관련 제품",
  },
  {
    hallId: "eco-inputs",
    icon: "🍀",
    title: "친환경자재관",
    desc: "친환경 병해충·영양 관리 자재",
  },
  {
    hallId: "machinery",
    icon: "🚜",
    title: "농기계관",
    desc: "작업 효율을 높이는 농기계",
  },
  {
    hallId: "seed",
    icon: "🌾",
    title: "종자관",
    desc: "작물별 우수 종자·육묘 관련",
  },
  {
    hallId: "smart-farm",
    icon: "📱",
    title: "스마트농업관",
    desc: "센서·제어·자동화 장비",
  },
  {
    hallId: "future-insect",
    icon: "🦗",
    title: "미래곤충관",
    desc: "곤충 산업의 생산·가공·장비·교육",
  },
];

export default function ExpoCategoryEntrySection() {
  return (
    <section style={wrap}>
      <div style={eyebrow}>CATEGORY ENTRY</div>
      <h2 style={title}>원하는 분야부터 들어가세요</h2>
      <p style={desc}>
        농민이 찾는 방식대로 카테고리를 먼저 고르고, 그 안에서 프리미엄 부스와 제품을
        우선 확인하게 구성합니다.
      </p>

      <div style={grid}>
        {CATEGORIES.map((item) => (
          <Link
            key={item.hallId}
            href={`/expo/hall/${item.hallId}`}
            style={card}
          >
            <div style={icon}>{item.icon}</div>
            <div style={cardTitle}>{item.title}</div>
            <div style={cardDesc}>{item.desc}</div>
            <div style={cta}>카테고리 보기 →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const wrap: React.CSSProperties = {
  marginTop: 10,
};

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const title: React.CSSProperties = {
  marginTop: 14,
  fontSize: 58,
  lineHeight: 1.08,
  fontWeight: 950,
  color: "#0f172a",
};

const desc: React.CSSProperties = {
  marginTop: 24,
  fontSize: 22,
  lineHeight: 1.8,
  color: "#64748b",
  maxWidth: 1080,
};

const grid: React.CSSProperties = {
  marginTop: 30,
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 300,
  padding: "28px 26px",
  borderRadius: 28,
  border: "1px solid #e5e7eb",
  background: "#fff",
  textDecoration: "none",
  color: "#0f172a",
  boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
};

const icon: React.CSSProperties = {
  fontSize: 38,
  lineHeight: 1,
};

const cardTitle: React.CSSProperties = {
  marginTop: 26,
  fontSize: 28,
  lineHeight: 1.25,
  fontWeight: 950,
  color: "#0f172a",
};

const cardDesc: React.CSSProperties = {
  marginTop: 18,
  fontSize: 16,
  lineHeight: 1.8,
  color: "#64748b",
  minHeight: 58,
};

const cta: React.CSSProperties = {
  marginTop: 28,
  fontSize: 16,
  fontWeight: 950,
  color: "#0f172a",
};