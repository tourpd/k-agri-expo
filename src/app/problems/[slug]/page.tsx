import Link from "next/link";
import { notFound } from "next/navigation";

const problemMap: Record<
  string,
  {
    category: string;
    title: string;
    summary: string;
    why: string[];
    solution: string[];
    alternatives?: string[];
    videoTitle: string;
    videoDesc: string;
    recommendedProducts: string[];
    recommendedBooths: string[];
    consultPrompt: string;
  }
> = {
  "march-crops-to-avoid": {
    category: "시기별 농사",
    title: "3월에 심으면 망하는 작물 5가지",
    summary:
      "3월은 기온과 지온이 불안정해 보이는 것보다 실패 확률이 높은 작물이 있습니다. 무작정 심기보다 지금 시기에 맞는 선택이 중요합니다.",
    why: [
      "지온이 아직 충분히 올라오지 않아 발아와 활착이 동시에 흔들릴 수 있습니다.",
      "초기 생육이 늦어지면 뒤늦게 비료와 약제로 때워도 회복 비용이 더 커집니다.",
      "비슷한 시기라도 지역과 재배 방식에 따라 성공/실패가 크게 갈립니다.",
    ],
    solution: [
      "3월에는 무조건 심는 것보다 지역, 평수, 노지/하우스를 먼저 구분해야 합니다.",
      "작물 선택이 애매하면 바로 파종하지 말고, 대체 가능한 작물과 준비 품목을 먼저 확인해야 합니다.",
      "실전에서는 씨앗보다 모종, 또는 지온이 더 오른 뒤 정식하는 방식이 유리한 경우가 많습니다.",
    ],
    alternatives: ["완두", "시금치", "상추", "쪽파", "봄배추"],
    videoTitle: "3월에 심어야 할 작물과 피해야 할 작물",
    videoDesc:
      "한국농수산TV 영상으로 연결해 실제 현장 관점에서 어떤 작물을 고르면 좋은지 설명합니다.",
    recommendedProducts: ["종자 추천 패키지", "초기 활착 자재", "육묘 보조 자재"],
    recommendedBooths: ["종자관", "육묘 전문 부스", "농자재관"],
    consultPrompt: "지금 심으려는 작물과 몇 평 농사인지 AI에게 바로 물어보세요.",
  },

  "winter-crops-no-topdressing": {
    category: "월동작물",
    title: "월동작물에 추비 대신 해야 안 망하는 법",
    summary:
      "월동작물은 무조건 추비부터 넣는다고 살아나는 것이 아닙니다. 생육 상태, 뿌리 상태, 지온, 토양 수분을 먼저 봐야 합니다.",
    why: [
      "뿌리가 약한 상태에서 추비를 먼저 넣으면 흡수보다 스트레스가 먼저 올 수 있습니다.",
      "지온이 낮은 시기에는 비료를 줘도 기대만큼 흡수되지 않을 수 있습니다.",
      "원인이 생육 정지인지, 병해인지, 뿌리 문제인지 먼저 구분해야 합니다.",
    ],
    solution: [
      "추비보다 먼저 현재 생육 정지 원인을 파악해야 합니다.",
      "필요하면 엽면, 활착 회복, 뿌리 회복 중심으로 먼저 접근합니다.",
      "작물과 평수에 맞는 대응량을 계산해서 과다 처방을 피해야 합니다.",
    ],
    videoTitle: "월동작물 회복의 핵심은 추비가 아닐 수 있습니다",
    videoDesc:
      "생육 회복, 뿌리 상태, 지온 체크 등 실제 농가가 놓치기 쉬운 순서를 설명하는 영상으로 연결합니다.",
    recommendedProducts: ["생육 회복 자재", "활착 보조제", "엽면 보조 영양제"],
    recommendedBooths: ["농자재관", "비료 전문 부스"],
    consultPrompt: "작물과 현재 상태를 적으면 AI가 추비가 맞는지부터 판단해드립니다.",
  },

  "pepper-top5-mistakes": {
    category: "고추 농사",
    title: "고추 농사 망치는 실수 TOP5",
    summary:
      "고추 농사는 한 번의 큰 실수보다, 작은 실수 다섯 개가 겹쳐서 무너지는 경우가 많습니다. 초기 활착, 비대, 칼슘, 병해충을 함께 봐야 합니다.",
    why: [
      "초기 활착이 흔들리면 이후 비대기까지 계속 끌려갑니다.",
      "칼슘 문제처럼 보이지만 실제 원인은 수분, 뿌리, 생육 리듬인 경우도 많습니다.",
      "총채벌레 등 병해충은 초기에 못 잡으면 수량과 상품성에 직격탄입니다.",
    ],
    solution: [
      "고추는 시기별로 관리 포인트를 나눠서 접근해야 합니다.",
      "현재 단계가 정식기인지, 비대기인지에 따라 추천 자재가 달라집니다.",
      "평수와 작형에 맞는 사용량 계산까지 같이 봐야 헛돈을 줄일 수 있습니다.",
    ],
    videoTitle: "고추 농가가 가장 많이 놓치는 실전 포인트",
    videoDesc:
      "고추 비대, 활착, 병해충 대응을 실제 사례 중심으로 설명하는 영상 연결 구간입니다.",
    recommendedProducts: ["멀티피드", "메가파워칼", "칼슘 보조 자재", "싹쓰리충"],
    recommendedBooths: ["농자재관", "고추 전문 부스"],
    consultPrompt: "고추 몇 평인지, 노지인지 하우스인지 입력하면 AI가 바로 영업 상담으로 연결합니다.",
  },

  "thrips-timing": {
    category: "병해충",
    title: "총채벌레 방제 타이밍 놓치면 생기는 일",
    summary:
      "총채벌레는 초기에 못 잡으면 뒤로 갈수록 방제 비용이 커지고 상품성까지 무너질 수 있습니다. 타이밍이 핵심입니다.",
    why: [
      "초기 발생을 놓치면 농약 횟수와 방제 비용이 함께 늘어납니다.",
      "상품성과 수확량 모두에 영향을 주기 때문에 빠른 대응이 중요합니다.",
      "비슷한 증상처럼 보여도 다른 해충/병해와 구분이 필요합니다.",
    ],
    solution: [
      "발생 초기인지 확산 단계인지부터 구분해야 합니다.",
      "현재 작물, 평수, 재배 방식에 따라 권장 대응량이 달라집니다.",
      "친환경 대응인지 일반 방제인지도 먼저 선택해야 합니다.",
    ],
    videoTitle: "총채벌레는 왜 초기에 잡아야 하는가",
    videoDesc:
      "총채벌레 발생 시점과 초기 방제 타이밍의 중요성을 영상으로 연결합니다.",
    recommendedProducts: ["싹쓰리충", "싹쓰리충 골드", "멸규니"],
    recommendedBooths: ["농자재관", "방제 솔루션 부스"],
    consultPrompt: "총채벌레가 어느 정도인지, 몇 평인지 입력하면 AI가 바로 필요한 수량까지 계산합니다.",
  },

  "garlic-leaf-yellowing": {
    category: "마늘 농사",
    title: "마늘 잎이 누래질 때 가장 먼저 봐야 할 3가지",
    summary:
      "마늘 잎이 누래졌다고 무조건 비료부터 넣으면 더 꼬일 수 있습니다. 뿌리, 병해, 생육 정지 여부를 먼저 봐야 합니다.",
    why: [
      "겉으로 같은 황화처럼 보여도 원인은 뿌리 약화, 영양 불균형, 병해 등 다양할 수 있습니다.",
      "지금 시기의 잎 상태는 수확량 신호일 수 있어 초기 판단이 중요합니다.",
      "무조건 한 가지 자재로 해결하려 하면 오히려 회복이 늦어질 수 있습니다.",
    ],
    solution: [
      "황화 원인을 먼저 구분하고 자재를 선택해야 합니다.",
      "노지/하우스, 현재 평수, 지역 기온까지 같이 봐야 합니다.",
      "필요하면 생육 회복과 병해 대응을 같이 묶어서 접근합니다.",
    ],
    videoTitle: "마늘 잎마름과 황화, 무엇이 먼저 원인인가",
    videoDesc:
      "마늘의 황화 증상을 판단할 때 가장 먼저 확인해야 할 기준을 영상으로 설명합니다.",
    recommendedProducts: ["생육 회복 자재", "뿌리 회복 보조제", "병해 대응 자재"],
    recommendedBooths: ["농자재관", "마늘 전문 부스"],
    consultPrompt: "마늘 잎 상태와 재배 면적을 입력하면 AI가 원인 추정부터 도와드립니다.",
  },

  "pepper-calcium-guide": {
    category: "비료/영양",
    title: "고추 칼슘은 아무 때나 주면 안 되는 이유",
    summary:
      "칼슘은 중요하지만, 항상 정답은 아닙니다. 시기와 증상, 수분 상태, 비대 리듬을 같이 봐야 실제 효과가 나옵니다.",
    why: [
      "칼슘 부족처럼 보여도 실제로는 수분 문제나 흡수 리듬 문제일 수 있습니다.",
      "잘못된 타이밍과 과다 투입은 비용만 늘리고 효과는 약할 수 있습니다.",
      "비대기인지 초기 생육기인지에 따라 접근 방식이 다릅니다.",
    ],
    solution: [
      "현재 생육 단계와 증상을 먼저 정리해야 합니다.",
      "칼슘 단독이 맞는지, 칼륨/미량요소와 같이 가야 하는지도 판단해야 합니다.",
      "평수 기준으로 필요한 양을 계산해서 안내받는 것이 가장 안전합니다.",
    ],
    videoTitle: "고추 칼슘, 왜 타이밍이 중요한가",
    videoDesc:
      "고추 비대기 영양 관리에서 칼슘과 칼륨의 역할을 구분해 설명하는 영상입니다.",
    recommendedProducts: ["칼슘 보조 자재", "메가파워칼", "비대기 영양 자재"],
    recommendedBooths: ["농자재관", "비료 전문 부스"],
    consultPrompt: "고추 현재 상태와 몇 평인지 적으면 AI가 칼슘이 맞는지부터 설명합니다.",
  },
};

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = problemMap[slug];

  if (!post) notFound();

  return (
    <main style={S.page}>
      <section style={S.hero}>
        <div style={S.heroBadge}>{post.category}</div>
        <h1 style={S.heroTitle}>{post.title}</h1>
        <p style={S.heroDesc}>{post.summary}</p>
      </section>

      <section style={S.section}>
        <div style={S.contentGrid}>
          <article style={S.contentCard}>
            <div style={S.block}>
              <div style={S.blockEyebrow}>왜 문제가 되나</div>
              <ul style={S.ul}>
                {post.why.map((item) => (
                  <li key={item} style={S.li}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={S.block}>
              <div style={S.blockEyebrow}>어떻게 접근해야 하나</div>
              <ul style={S.ul}>
                {post.solution.map((item) => (
                  <li key={item} style={S.li}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {post.alternatives && (
              <div style={S.block}>
                <div style={S.blockEyebrow}>대신 고려할 작물 / 선택지</div>
                <div style={S.tagsWrap}>
                  {post.alternatives.map((item) => (
                    <span key={item} style={S.tag}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside style={S.side}>
            <div style={S.sideCard}>
              <div style={S.sideEyebrow}>🎥 한국농수산TV 연결 영상</div>
              <h3 style={S.sideTitle}>{post.videoTitle}</h3>
              <p style={S.sideDesc}>{post.videoDesc}</p>
              <button style={S.sideBtnPrimary}>영상 보기</button>
            </div>

            <div style={S.sideCard}>
              <div style={S.sideEyebrow}>🧪 관련 제품</div>
              <div style={S.listWrap}>
                {post.recommendedProducts.map((item) => (
                  <div key={item} style={S.listItem}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={S.sideCard}>
              <div style={S.sideEyebrow}>🏢 연결 전시관 / 부스</div>
              <div style={S.listWrap}>
                {post.recommendedBooths.map((item) => (
                  <div key={item} style={S.listItem}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={S.ctaCard}>
              <div style={S.ctaEyebrow}>📞 AI 농사 상담</div>
              <h3 style={S.ctaTitle}>이제 상담으로 이어집니다</h3>
              <p style={S.ctaDesc}>{post.consultPrompt}</p>
              <Link href="/ai-consult" style={S.ctaBtn}>
                AI 상담 시작 →
              </Link>
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
    padding: "56px 24px 18px",
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
    fontSize: 50,
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -1,
    maxWidth: 980,
  },
  heroDesc: {
    marginTop: 18,
    color: "#64748b",
    fontSize: 17,
    lineHeight: 1.9,
    maxWidth: 920,
  },
  section: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "8px 24px 0",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 20,
  },
  contentCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 26,
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
  },
  block: {
    marginBottom: 24,
  },
  blockEyebrow: {
    fontSize: 13,
    fontWeight: 900,
    color: "#16a34a",
    marginBottom: 12,
  },
  ul: {
    margin: 0,
    paddingLeft: 20,
  },
  li: {
    marginBottom: 12,
    color: "#334155",
    lineHeight: 1.85,
    fontSize: 15,
  },
  tagsWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  tag: {
    padding: "9px 12px",
    borderRadius: 999,
    background: "#ecfeff",
    color: "#155e75",
    fontSize: 13,
    fontWeight: 800,
  },
  side: {
    display: "grid",
    gap: 16,
  },
  sideCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 26,
    padding: 22,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  sideEyebrow: {
    fontSize: 13,
    fontWeight: 900,
    color: "#0f766e",
  },
  sideTitle: {
    margin: "12px 0 0",
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 950,
  },
  sideDesc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#64748b",
  },
  sideBtnPrimary: {
    marginTop: 16,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  listWrap: {
    marginTop: 14,
    display: "grid",
    gap: 10,
  },
  listItem: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  ctaCard: {
    borderRadius: 26,
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
    fontSize: 26,
    lineHeight: 1.15,
    fontWeight: 950,
  },
  ctaDesc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.85,
    color: "rgba(255,255,255,0.9)",
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
};