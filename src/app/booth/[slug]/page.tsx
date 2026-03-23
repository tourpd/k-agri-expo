import Link from "next/link";
import { notFound } from "next/navigation";

const boothMap: Record<
  string,
  {
    category: string;
    name: string;
    region: string;
    intro: string;
    products: { name: string; desc: string }[];
    videos: { title: string; desc: string }[];
    aiGuide: string[];
    depositGuide: string;
    eventNote: string;
  }
> = {
  dof: {
    category: "농자재관",
    name: "도프",
    region: "대한민국",
    intro:
      "도프 부스는 비료, 영양제, 병해충 대응 자재를 중심으로 농민 상담부터 제품 연결, 입금, 배송까지 이어지는 대표 부스입니다.",
    products: [
      { name: "싹쓰리충", desc: "총채벌레 초기 대응 중심 해충 솔루션" },
      { name: "멸규니", desc: "병해 예방과 생육 안정에 연결되는 대응 자재" },
      { name: "멀티피드", desc: "생육 회복과 영양 밸런스 보완에 강한 자재" },
      { name: "켈팍", desc: "활착과 생육 리듬 보완에 많이 찾는 제품" },
      { name: "메가파워칼", desc: "비대기 고칼륨 관리용 제품" },
    ],
    videos: [
      { title: "총채벌레 해결 방법", desc: "초기 방제 타이밍과 대응 흐름 설명" },
      { title: "마늘 수확량 올리는 비료", desc: "생육과 수량 중심 영양 관리 영상" },
      { title: "고추 비대 핵심", desc: "비대기 칼륨·칼슘 포인트 설명" },
    ],
    aiGuide: [
      "농민이 말하는 작물, 지역, 평수, 노지/하우스 정보를 먼저 듣습니다.",
      "총채벌레, 노균병, 비대불량 등 문제를 요약한 뒤 관련 제품으로 연결합니다.",
      "몇 평에 얼마나 쓰는지, 성분과 효과, 방제량까지 설명하고 구매로 이어지게 합니다.",
    ],
    depositGuide:
      "주문이 확정되면 업체 계좌로 직접 입금하고, 확인 후 업체가 직접 배송하는 구조입니다.",
    eventNote:
      "6개월 입점 기업 기준 정산 마진은 20%로 계산되며, 월말 기준으로 정산됩니다.",
  },

  "seed-master": {
    category: "종자관",
    name: "시드마스터",
    region: "대한민국",
    intro:
      "시드마스터 부스는 시기별 종자, 품종 선택, 육묘 전 확인해야 할 포인트를 중심으로 운영되는 종자 전문 부스입니다.",
    products: [
      { name: "고추 종자 패키지", desc: "지역과 작형에 맞는 추천 종자 구성" },
      { name: "토마토 종자", desc: "상품성과 안정성을 함께 보는 품종 제안" },
      { name: "오이 종자", desc: "초기 활착과 수량 안정성 중심 품종" },
    ],
    videos: [
      { title: "올해 고추 종자 추천 TOP5", desc: "지금 가장 많이 묻는 품종 흐름" },
      { title: "병에 강한 종자 고르는 기준", desc: "내병성과 수량의 균형 설명" },
    ],
    aiGuide: [
      "심으려는 작물과 지역, 평수를 기준으로 종자 선택 방향을 먼저 잡습니다.",
      "직파가 맞는지, 모종이 유리한지까지 같이 설명합니다.",
      "종자만 볼지, 초기 활착 자재까지 묶어서 볼지 상담 흐름으로 연결합니다.",
    ],
    depositGuide:
      "선택한 종자 또는 패키지는 업체 계좌 입금 후 발송되는 구조입니다.",
    eventNote:
      "종자관은 시기별 콘텐츠와 함께 연결되어 검색 유입이 많은 전시관입니다.",
  },

  "green-bio": {
    category: "친환경 농업관",
    name: "그린바이오",
    region: "대한민국",
    intro:
      "친환경 자재, 유기농 솔루션, 생육 회복 자재를 중심으로 운영되는 친환경 전문 부스입니다.",
    products: [
      { name: "친환경 해충 대응 자재", desc: "민감한 작물에도 접근 가능한 솔루션" },
      { name: "유기농 생육 보조제", desc: "생육 회복과 잎 색 개선 보조" },
    ],
    videos: [
      { title: "친환경으로도 해충 대응이 가능한가", desc: "실전 중심 설명 영상" },
    ],
    aiGuide: [
      "친환경 재배인지, 일반 재배인지 먼저 구분합니다.",
      "문제가 병해인지 해충인지 구분해 자재를 추천합니다.",
    ],
    depositGuide:
      "직접 입금 후 업체가 발송하며, 상담 내용을 기반으로 묶음 제안도 가능합니다.",
    eventNote:
      "친환경관은 바이어 문의와 연계하기 좋은 전시관입니다.",
  },

  "daepung-machine": {
    category: "농기계관",
    name: "대풍기계",
    region: "대한민국",
    intro:
      "농기계 부스는 장비 정보, 현장 작업 조건, 보조사업 가능성까지 함께 상담하는 장비 중심 부스입니다.",
    products: [
      { name: "정식기", desc: "작업 효율 향상 중심 장비" },
      { name: "이식기", desc: "대면적 작업에 적합한 장비" },
      { name: "부착형 장비", desc: "현장 여건에 따라 연동 가능한 장비" },
    ],
    videos: [
      { title: "현장에서 바로 쓰는 장비 리뷰", desc: "실제 작업 상황 중심 소개" },
    ],
    aiGuide: [
      "작물, 면적, 작업 환경을 먼저 듣고 필요한 장비 수준을 분류합니다.",
      "대농/소농에 따라 필요한 장비 범위가 다릅니다.",
    ],
    depositGuide:
      "장비는 직접 문의 후 견적과 입금 절차로 이어지는 구조입니다.",
    eventNote:
      "농기계는 바이어나 유통 파트너 문의로도 연결될 수 있습니다.",
  },

  "smart-farm-tech": {
    category: "스마트 농업관",
    name: "스마트팜테크",
    region: "대한민국",
    intro:
      "드론, 센서, 자동화, 데이터 기반 농업 솔루션을 소개하는 스마트 농업 전문 부스입니다.",
    products: [
      { name: "센서 패키지", desc: "환경 데이터 기반 관리 시스템" },
      { name: "드론 연동 솔루션", desc: "방제와 데이터 연계를 동시에" },
    ],
    videos: [
      { title: "스마트 농업, 어디부터 시작해야 하나", desc: "입문형 설명 영상" },
    ],
    aiGuide: [
      "현재 재배 방식과 규모를 기준으로 디지털화 수준을 먼저 판단합니다.",
      "드론, 센서, 자동화 중 무엇이 우선인지 나눠 설명합니다.",
    ],
    depositGuide:
      "장비/솔루션 특성상 상담 후 맞춤 견적과 진행으로 이어집니다.",
    eventNote:
      "스마트 농업관은 글로벌 바이어 연결 가능성이 높은 분야입니다.",
  },

  "new-agri-lab": {
    category: "이달의 신제품관",
    name: "뉴애그리랩",
    region: "대한민국",
    intro:
      "이번 달 새로 나온 농업 기술과 신제품을 먼저 소개하고, 농민과 바이어의 관심을 연결하는 신제품 전문 부스입니다.",
    products: [
      { name: "이달의 신제품 A", desc: "현장 반응을 먼저 보는 신규 아이템" },
      { name: "이달의 신제품 B", desc: "차별화된 성능을 강조하는 런칭 제품" },
    ],
    videos: [
      { title: "이달의 신제품 총정리", desc: "이번 달 주목 제품 소개" },
    ],
    aiGuide: [
      "현재 농가 상황과 필요한 문제 해결 포인트를 먼저 듣고 연결합니다.",
      "신제품이 맞는지, 기존 안정 제품이 맞는지까지 같이 설명합니다.",
    ],
    depositGuide:
      "신제품은 상담 후 직접 입금과 발송 절차로 이어집니다.",
    eventNote:
      "신제품관은 월간 라이브쇼와 연결될 때 홍보 효과가 가장 큽니다.",
  },
};

export default async function BoothDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const booth = boothMap[slug];

  if (!booth) notFound();

  return (
    <main style={S.page}>
      <section style={S.hero}>
        <div style={S.heroTop}>
          <div style={S.heroAvatar}>{booth.name.slice(0, 1)}</div>
          <div>
            <div style={S.heroBadge}>{booth.category}</div>
            <h1 style={S.heroTitle}>{booth.name}</h1>
            <div style={S.heroRegion}>{booth.region}</div>
          </div>
        </div>

        <p style={S.heroDesc}>{booth.intro}</p>
      </section>

      <section style={S.section}>
        <div style={S.grid}>
          <div style={S.leftCol}>
            <div style={S.card}>
              <div style={S.eyebrow}>대표 제품</div>
              <h2 style={S.cardTitle}>이 부스의 주요 제품</h2>
              <div style={S.listWrap}>
                {booth.products.map((item) => (
                  <div key={item.name} style={S.productItem}>
                    <div style={S.productName}>{item.name}</div>
                    <div style={S.productDesc}>{item.desc}</div>
                    <div style={S.productActions}>
                      <button style={S.darkBtn}>제품 보기</button>
                      <button style={S.greenBtn}>장바구니 담기</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.eyebrow}>영상</div>
              <h2 style={S.cardTitle}>제품 / 현장 설명 영상</h2>
              <div style={S.listWrap}>
                {booth.videos.map((item) => (
                  <div key={item.title} style={S.videoItem}>
                    <div style={S.videoTitle}>{item.title}</div>
                    <div style={S.videoDesc}>{item.desc}</div>
                    <button style={S.videoBtn}>영상 보기</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside style={S.rightCol}>
            <div style={S.ctaCard}>
              <div style={S.ctaEyebrow}>📞 AI 상담</div>
              <h2 style={S.ctaTitle}>이 부스 안에서 영업까지 이어집니다</h2>
              <p style={S.ctaDesc}>
                이 부스의 AI는 농민의 작물, 지역, 평수, 노지/하우스, 현재 문제를 듣고
                가장 적합한 제품과 사용량을 설명하는 영업형 상담 흐름으로 작동합니다.
              </p>

              <div style={S.guides}>
                {booth.aiGuide.map((item) => (
                  <div key={item} style={S.guideItem}>
                    {item}
                  </div>
                ))}
              </div>

              <Link href="/ai-consult" style={S.ctaBtn}>
                AI 상담 시작 →
              </Link>
            </div>

            <div style={S.sideCard}>
              <div style={S.sideEyebrow}>💳 주문 / 입금 안내</div>
              <p style={S.sideText}>{booth.depositGuide}</p>
            </div>

            <div style={S.sideCard}>
              <div style={S.sideEyebrow}>📌 운영 메모</div>
              <p style={S.sideText}>{booth.eventNote}</p>
            </div>

            <div style={S.sideCard}>
              <div style={S.sideEyebrow}>🔗 바로가기</div>
              <div style={S.linkList}>
                <Link href="/expo" style={S.linkItem}>
                  엑스포 메인 보기 →
                </Link>
                <Link href="/problems" style={S.linkItem}>
                  고민 해결 콘텐츠 보기 →
                </Link>
                <Link href="/buyer" style={S.linkItem}>
                  글로벌 바이어 문의 →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    color: "#0f172a",
    paddingBottom: 56,
  },
  hero: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "56px 24px 20px",
  },
  heroTop: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  heroAvatar: {
    width: 82,
    height: 82,
    borderRadius: 24,
    background: "linear-gradient(135deg, #0f172a 0%, #16a34a 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    fontWeight: 950,
    flexShrink: 0,
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
    margin: "12px 0 0",
    fontSize: 52,
    lineHeight: 1.05,
    fontWeight: 950,
    letterSpacing: -1,
  },
  heroRegion: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    fontWeight: 800,
  },
  heroDesc: {
    marginTop: 22,
    maxWidth: 980,
    color: "#64748b",
    fontSize: 17,
    lineHeight: 1.9,
  },
  section: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "8px 24px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 20,
  },
  leftCol: {
    display: "grid",
    gap: 18,
  },
  rightCol: {
    display: "grid",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 26,
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  cardTitle: {
    margin: "10px 0 0",
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 950,
    letterSpacing: -0.5,
  },
  listWrap: {
    marginTop: 18,
    display: "grid",
    gap: 14,
  },
  productItem: {
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  productDesc: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.8,
  },
  productActions: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  darkBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  greenBtn: {
    border: "none",
    background: "#15803d",
    color: "#fff",
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  videoItem: {
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  videoDesc: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.8,
  },
  videoBtn: {
    marginTop: 14,
    border: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    borderColor: "#cbd5e1",
  },
  ctaCard: {
    borderRadius: 28,
    padding: 22,
    background: "linear-gradient(135deg, #0f172a 0%, #166534 100%)",
    color: "#fff",
    boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
  },
  ctaEyebrow: {
    fontSize: 13,
    fontWeight: 900,
    color: "#bbf7d0",
  },
  ctaTitle: {
    margin: "12px 0 0",
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 950,
  },
  ctaDesc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.85,
    color: "rgba(255,255,255,0.9)",
  },
  guides: {
    marginTop: 16,
    display: "grid",
    gap: 10,
  },
  guideItem: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.1)",
    fontSize: 14,
    lineHeight: 1.75,
  },
  ctaBtn: {
    display: "inline-block",
    marginTop: 18,
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 900,
  },
  sideCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  sideEyebrow: {
    fontSize: 13,
    fontWeight: 900,
    color: "#0f766e",
  },
  sideText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.85,
  },
  linkList: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },
  linkItem: {
    textDecoration: "none",
    color: "#15803d",
    fontWeight: 900,
    fontSize: 14,
  },
};