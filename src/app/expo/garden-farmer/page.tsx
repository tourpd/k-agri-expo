import Link from "next/link";
export const dynamic = "force-dynamic";
const PRODS = [
  { badge: "베란다 화분 필수", bg: "#16a34a", title: "가든파머 홈그린 활력스프레이", target: "실내 화분 · 반려식물 전용", desc: "햇빛 부족으로 잎이 누렇게 뜨거나 생기가 없을 때, 냄새 없는 천연 아미노산 미네랄을 즉시 공급합니다.", spec: "500ml 즉시분무형 스프레이" },
  { badge: "친환경 병해충 솔루션", bg: "#0284c7", title: "가든파머 클린가든 천연보호제", target: "뿌리파리 · 응애 · 진딧물 예방 및 관리", desc: "인체와 반려동물에 무해한 천연 식물 추출 오일로 실내에서도 안심하고 벌레를 차단합니다.", spec: "500ml 즉시분무형 스프레이" },
  { badge: "텃밭 풍년 수확", bg: "#d97706", title: "가든파머 텃밭애(愛) 발근·비대 솔루션", target: "주말농장 · 옥상텃밭 · 상추/고추/토마토", desc: "도프 프리미엄 아미노산 기술로 초기 뿌리 활착을 2배 촉진하고 열매 당도와 크기를 키웁니다.", spec: "500ml 고농축 원액" },
  { badge: "초보 식집사 추천", bg: "#7c3aed", title: "가든파머 식집사 3종 스타터 키트", target: "아파트 입문자 · 원스톱 가든 케어", desc: "영양부족, 벌레, 뿌리썩음의 3대 고민을 한 번에 해결하는 기획 번들 세트입니다.", spec: "3종 세트 + 가이드북" }
];
export default function GardenFarmerPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 60px" }}>
      <section style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 100%)", borderRadius: 24, padding: "48px 32px", color: "#fff", marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#86efac", marginBottom: 12 }}>DOPE × GARDEN FARMER × K-AGRI EXPO</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.3, marginBottom: 16 }}>베란다 정원 & 텃밭학교<br /><span style={{ color: "#86efac" }}>가든파머(Garden Farmer) 공식관</span></h1>
        <p style={{ fontSize: 16, color: "#dcfce7", lineHeight: 1.6, marginBottom: 20 }}>아파트 베란다 식집사부터 주말농장 도시농부까지! 대리점 눈치 없는 냄새 제로 친환경 영양제와 전용 솔루션을 만나보세요.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>✓ 실내 무취 친환경</span>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>✓ 반려동물·유아 안심</span>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>✓ 엑스포 단독 특별 기획</span>
        </div>
      </section>
      <section style={{ marginBottom: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", marginBottom: 8 }}>OFFICIAL PRODUCTS</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>도프 가든파머 전용 라인업</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {PRODS.map((prod, idx) => (
            <div key={idx} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column" }}>
              <div style={{ alignSelf: "flex-start", background: prod.bg, color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, marginBottom: 12 }}>{prod.badge}</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>{prod.title}</h3>
              <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 700, marginBottom: 12 }}>{prod.target}</div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, flex: 1, marginBottom: 16 }}>{prod.desc}</p>
              <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: 10, marginBottom: 16 }}>📦 {prod.spec}</div>
              <Link href="/expo/booths" style={{ textAlign: "center", background: "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px", borderRadius: 12, textDecoration: "none" }}>공식 부스에서 혜택 문의하기 →</Link>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: "#0f172a", borderRadius: 24, padding: "36px 24px", color: "#fff", textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", marginBottom: 10 }}>YOUTUBE × GARDEN FARMER</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>한국농수산TV 〈가든파머 텃밭학교〉</h2>
        <p style={{ fontSize: 15, color: "#cbd5e1", marginBottom: 20 }}>아파트 베란다와 텃밭에서 직접 키우는 실전 재배 노하우를 영상으로 만나보세요.</p>
        <a href="https://www.youtube.com/@tourpd" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#ef4444", color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 24px", borderRadius: 999, textDecoration: "none" }}>유튜브 가든파머 강의 보러가기 🎬</a>
      </section>
    </div>
  );
}
