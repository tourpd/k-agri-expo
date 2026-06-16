import Link from "next/link";

export const dynamic = "force-dynamic";

const assets = [
  {
    name: "안이영 농민교육 30년 자료",
    type: "교육·현장지식",
    data: "PPT / 강의안 / 병해충 설명 / 농민교육 사례",
    truth: "농민이 실제 현장에서 반복해서 묻는 문제를 정리한 자료",
    status: "자료 정리 필요",
    next: "자료 10개부터 업로드·분류",
  },
  {
    name: "홍산마늘 170톤 프로젝트",
    type: "농산물 자산·판매",
    data: "물량 / 가격 / 저장 / 판매 / 바이어 / 가공처",
    truth: "농산물은 상품이 아니라 자산이며, 판매전략이 곧 수익을 결정함",
    status: "실전 진행중",
    next: "김치공장·급식업체 B2B 제안서 생성",
  },
  {
    name: "병해충 현장 데이터",
    type: "농민 문제해결",
    data: "작물 / 증상 / 발생시기 / 지역 / 방제결과",
    truth: "농민은 이론보다 지금 내 밭에서 먹히는 해결책을 원함",
    status: "구조화 필요",
    next: "고추 탄저병 사례부터 정리",
  },
  {
    name: "한국농수산TV 영상 자산",
    type: "방송·콘텐츠",
    data: "촬영영상 / 인터뷰 / 제품사례 / 농가성공사례",
    truth: "20년 현장 콘텐츠는 AI가 따라올 수 없는 K-AGRI의 핵심 원천",
    status: "분류 필요",
    next: "상위 50개 영상부터 콘텐츠 DNA화",
  },
];

export default function TruthCenterPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>
              ← 경영기획실
            </Link>
            <div style={S.eyebrow}>K-AGRI TRUTH DATA CENTER</div>
            <h1 style={S.title}>농업 진실 데이터센터</h1>
            <p style={S.sub}>
              광고가 아니라 데이터, 주장보다 근거, 경험을 검증 가능한 자산으로 바꾸는 곳입니다.
            </p>
          </div>
          <Link href="/admin/approval-center" style={S.darkBtn}>
            편성승인센터
          </Link>
        </header>

        <section style={S.hero}>
          <div>
            <div style={S.redLabel}>핵심 목적</div>
            <h2 style={S.heroTitle}>
              농민을 움직이는 힘은 예쁜 콘텐츠가 아니라 검증된 진실입니다.
            </h2>
            <p style={S.heroText}>
              안이영 자료, 홍산마늘, 병해충, 한국농수산TV 영상은 단순 자료가 아닙니다.
              이 자료를 데이터화해야 뉴스·쇼츠·웹툰·거래·교육이 흔들리지 않습니다.
            </p>
          </div>
          <div style={S.heroBox}>
            <span>오늘 할 일</span>
            <b>핵심 자산 4개를 먼저 정리</b>
            <small>안이영 · 홍산마늘 · 병해충 · 한국농수산TV</small>
          </div>
        </section>

        <section style={S.kpiGrid}>
          <Kpi title="핵심 원천자산" value="4개" desc="먼저 살릴 자산" />
          <Kpi title="우선 실험대상" value="1개" desc="안이영 또는 홍산마늘" />
          <Kpi title="목표 결과" value="20개" desc="뉴스·쇼츠·웹툰·문자 후보" />
          <Kpi title="판단 기준" value="진실" desc="농민을 움직이는 근거" />
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>핵심 데이터 자산맵</h2>
            <p>무엇을 보유했고, 어떤 진실을 뽑아낼 수 있으며, 다음 행동이 무엇인지 봅니다.</p>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>자산명</th>
                  <th style={S.th}>유형</th>
                  <th style={S.th}>보유 데이터</th>
                  <th style={S.th}>파악해야 할 진실</th>
                  <th style={S.th}>현재상태</th>
                  <th style={S.th}>다음 행동</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.name}>
                    <td style={S.tdTitle}>{a.name}</td>
                    <td style={S.td}>{a.type}</td>
                    <td style={S.td}>{a.data}</td>
                    <td style={S.td}>{a.truth}</td>
                    <td style={S.td}>
                      <span style={S.badge}>{a.status}</span>
                    </td>
                    <td style={S.tdStrong}>{a.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.actionBox}>
          <div>
            <h2>오늘 결론</h2>
            <p>
              새 화면을 더 만드는 것이 아니라, 먼저 <b>안이영 자료 1개</b> 또는
              <b> 홍산마늘 자료 1개</b>를 골라 진실 데이터로 해체합니다.
            </p>
          </div>
          <div style={S.btns}>
            <Link href="/admin/kagri-writers-room/knowledge" style={S.greenBtn}>
              안이영 자료 보기
            </Link>
            <Link href="/admin/agri-assets" style={S.greenBtn}>
              농산물 자산 보기
            </Link>
            <Link href="/admin/ai-production-line" style={S.darkBtn}>
              제작라인 보기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiTitle}>{title}</div>
      <div style={S.kpiValue}>{value}</div>
      <div style={S.kpiDesc}>{desc}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 28 },
  wrap: { maxWidth: 1500, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 24 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eyebrow: { marginTop: 16, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0 0", fontSize: 58, lineHeight: 1, fontWeight: 950, letterSpacing: "-.06em", color: "#0f172a" },
  sub: { margin: "14px 0 0", color: "#475569", fontSize: 21, lineHeight: 1.55, fontWeight: 850 },
  darkBtn: { background: "#0f172a", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  greenBtn: { background: "#15803d", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950 },

  hero: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 22, background: "#fff", border: "3px solid #15803d", borderRadius: 30, padding: 30, marginBottom: 18 },
  redLabel: { color: "#dc2626", fontWeight: 950 },
  heroTitle: { margin: "10px 0", fontSize: 42, lineHeight: 1.15, fontWeight: 950, letterSpacing: "-.05em", color: "#0f172a" },
  heroText: { color: "#334155", fontSize: 19, lineHeight: 1.65, fontWeight: 850 },
  heroBox: { background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 24, padding: 24, display: "grid", alignContent: "center", gap: 10, color: "#0f172a" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 },
  kpi: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 22, padding: 22 },
  kpiTitle: { color: "#64748b", fontWeight: 950 },
  kpiValue: { marginTop: 8, fontSize: 42, fontWeight: 950, color: "#0f172a" },
  kpiDesc: { marginTop: 6, color: "#475569", fontWeight: 850 },

  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 26, overflow: "hidden", marginBottom: 18 },
  panelHead: { padding: 24, borderBottom: "1px solid #e5e7eb", color: "#0f172a" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1180 },
  th: { background: "#f1f5f9", color: "#0f172a", padding: 15, textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 950 },
  td: { padding: 15, borderBottom: "1px solid #e5e7eb", color: "#0f172a", fontWeight: 800, verticalAlign: "top", lineHeight: 1.5 },
  tdTitle: { padding: 15, borderBottom: "1px solid #e5e7eb", color: "#0f172a", fontWeight: 950, verticalAlign: "top" },
  tdStrong: { padding: 15, borderBottom: "1px solid #e5e7eb", color: "#15803d", fontWeight: 950, verticalAlign: "top" },
  badge: { background: "#ecfdf5", color: "#15803d", borderRadius: 999, padding: "7px 11px", fontWeight: 950 },

  actionBox: { display: "flex", justifyContent: "space-between", gap: 20, background: "#0f172a", color: "#fff", borderRadius: 28, padding: 26 },
  btns: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
};
