import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hubs = [
  {
    title: "자료자산센터",
    desc: "안이영 PPT · 농진청 PDF · 도프 자료 · HWP · DOC · FCPXML을 일괄 업로드하고 엑셀형으로 관리",
    href: "/admin/knowledge-assets/extract",
    status: "운영",
    count: "확장형",
  },
  {
    title: "판단규칙 DB",
    desc: "작물·월·생육단계·증상·원인·대책·행동지시를 한 줄 한 건으로 관리",
    href: "/admin/knowledge-assets/rules",
    status: "운영",
    count: "DB",
  },
  {
    title: "농민 행동지시 운영센터",
    desc: "판단규칙을 오늘 할 일 TOP5, 문자, 푸시, PPL 추천으로 변환",
    href: "/admin/farm-action-engine",
    status: "운영",
    count: "실행",
  },
  {
    title: "AI 방송국",
    desc: "FCPXML·영상 원본을 분석해 자막, 쇼츠, 밴드, 티스토리, 유튜브 게시글 생성",
    href: "/admin/ai-broadcast-station",
    status: "운영",
    count: "제작",
  },
  {
    title: "한국농수산TV 콘텐츠 자산센터",
    desc: "기존 유튜브 영상 전체를 DB화해 과거 영상·쇼츠·블로그 소재로 재활용",
    href: "/admin/youtube-assets",
    status: "준비",
    count: "유튜브",
  },
  {
    title: "AI 제작라인",
    desc: "카드뉴스, 인포그래픽, 썸네일, 자료화면, 이미지 생성 연결",
    href: "/admin/ai-production-line",
    status: "연결",
    count: "디자인",
  },
  {
    title: "쇼츠 생성기",
    desc: "롱폼 자막과 주제를 쇼츠 제목·대본·자막·컷 구성으로 변환",
    href: "/admin/shorts-generator",
    status: "연결",
    count: "쇼츠",
  },
  {
    title: "K-AGRI 작가실",
    desc: "유튜브 제목, 밴드 글, 티스토리, 네이버블로그, 뉴스 원고 생성",
    href: "/admin/kagri-writers-room",
    status: "연결",
    count: "작가",
  },
];

export default function KnowledgeAssetsPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>← 경영기획실</Link>
            <div style={S.eye}>K-AGRI AGRICULTURE BRAIN CENTER</div>
            <h1 style={S.title}>농업 AI 두뇌센터</h1>
            <p style={S.sub}>
              모든 자료는 계속 늘어난다는 전제로 관리합니다. 카드형이 아니라 엑셀형 자산센터로 운영합니다.
            </p>
          </div>
        </header>

        <section style={S.summary}>
          <div style={S.kpi}><b>자료 원칙</b><strong>무한 확장</strong><span>PPT·PDF·HWP·영상·FCPXML</span></div>
          <div style={S.kpi}><b>관리 방식</b><strong>엑셀형</strong><span>한 줄 한 건</span></div>
          <div style={S.kpi}><b>핵심 자산</b><strong>한국농수산TV</strong><span>유튜브·원본·자료</span></div>
          <div style={S.kpi}><b>최종 목표</b><strong>AI 방송국</strong><span>촬영원본 → 콘텐츠</span></div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>통합 운영 엑셀표</h2>
            <span>자료 → 판단규칙 → 행동지시 → 방송 → 쇼츠 → 판매</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>우선</th>
                  <th style={S.th}>센터</th>
                  <th style={S.thWide}>역할</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>구분</th>
                  <th style={S.th}>실행</th>
                </tr>
              </thead>
              <tbody>
                {hubs.map((h, i) => (
                  <tr key={h.href}>
                    <td style={S.tdRank}>{i + 1}</td>
                    <td style={S.tdTitle}>{h.title}</td>
                    <td style={S.td}>{h.desc}</td>
                    <td style={S.tdGood}>{h.status}</td>
                    <td style={S.td}>{h.count}</td>
                    <td style={S.td}>
                      <Link href={h.href} style={S.openBtn}>열기</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>100점 운영 순서</h2>
            <span>지금부터 이 순서로 진행</span>
          </div>

          <div style={S.flowTable}>
            <div style={S.flowRow}><b>1</b><span>자료자산센터에 안이영 PPT·농진청 PDF·도프 자료·유튜브 자료를 일괄 업로드</span></div>
            <div style={S.flowRow}><b>2</b><span>AI가 원문을 추출하고 작물·월·증상·원인·대책·행동지시로 분해</span></div>
            <div style={S.flowRow}><b>3</b><span>판단규칙 DB에 저장해 농민 행동지시 운영센터에서 TOP5 생성</span></div>
            <div style={S.flowRow}><b>4</b><span>AI 방송국에서 FCPXML·영상 원본을 분석해 자막·쇼츠·밴드·티스토리 생성</span></div>
            <div style={S.flowRow}><b>5</b><span>한국농수산TV 기존 영상을 DB화해 과거 영상·자료화면·쇼츠 소재로 재활용</span></div>
            <div style={S.flowRow}><b>6</b><span>PPL 상품 DB와 연결해 아미65·아스트롱·제균박사·K-PLUS 자동 추천</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1800, margin: "0 auto" },
  header: { marginBottom: 20 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 14, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 56, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { color: "#475569", fontSize: 19, fontWeight: 850 },
  summary: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 14 },
  kpi: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, padding: 18, display: "grid", gap: 8 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, overflow: "hidden", marginBottom: 14 },
  panelHead: { padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 1300, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, whiteSpace: "nowrap" },
  thWide: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, minWidth: 700 },
  td: { padding: 14, borderTop: "1px solid #edf2f7", fontWeight: 850, verticalAlign: "top" },
  tdRank: { padding: 14, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950 },
  tdTitle: { padding: 14, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  tdGood: { padding: 14, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  openBtn: { background: "#0f172a", color: "#fff", borderRadius: 10, padding: "9px 13px", textDecoration: "none", fontWeight: 950 },
  flowTable: { padding: 12 },
  flowRow: { display: "grid", gridTemplateColumns: "60px 1fr", gap: 12, padding: 14, borderBottom: "1px solid #edf2f7", fontWeight: 900 },
};
