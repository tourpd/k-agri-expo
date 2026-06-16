import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const menus = [
  ["1", "농업 AI 두뇌센터", "전체 관제탑", "/admin/knowledge-assets", "자료·판단·방송 흐름 총괄"],
  ["2", "자료자산센터", "업로드", "/admin/knowledge-assets/extract", "안이영 PPT·농진청 PDF·도프 자료·거래처 자료 일괄 관리"],
  ["3", "판단규칙 DB", "DB", "/admin/knowledge-assets/rules", "작물·월·증상·원인·대책·행동지시 관리"],
  ["4", "농민 행동지시센터", "실행", "/admin/farm-action-engine", "오늘 할 일 TOP5·문자·푸시·PPL 추천"],
  ["5", "AI 방송국", "제작", "/admin/ai-broadcast-station", "FCPXML·자막·쇼츠·밴드·티스토리·유튜브 게시글"],
  ["6", "한국농수산TV 자산센터", "유튜브", "/admin/youtube-assets", "기존 유튜브 영상 DB화"],
  ["7", "작가실", "원고", "/admin/kagri-writers-room", "유튜브 제목·밴드·티스토리·블로그 글"],
  ["8", "AI 제작라인", "디자인", "/admin/ai-production-line", "썸네일·카드뉴스·인포그래픽"],
  ["9", "쇼츠 생성기", "쇼츠", "/admin/shorts-generator", "롱폼 영상 → 쇼츠 후보"],
  ["10", "오늘 작업센터", "오늘", "/admin/today-work", "오늘 해야 할 일만 모아보기"],
  ["11", "농산물 자산센터", "거래", "/admin/agri-assets", "저장농산물·대량판매·산지직송 연결"],
  ["12", "기업·PPL 자산센터", "준비", "/admin/company-assets", "도프·두루기계·부성바이오·영진로타리 확장 예정"],
  ["13", "GEO/AEO 스카우트", "준비", "/admin/geo-scout", "기업 AI 노출점수·홍보비 모델 예정"],
];

export default function AdminDashboardPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <div style={S.eye}>K-AGRI ADMIN OS</div>
            <h1 style={S.title}>K-AGRI 통합 관리자 대시보드</h1>
            <p style={S.sub}>
              모든 관리 화면을 여기서 시작합니다. 자료 → 판단규칙 → 행동지시 → 방송 → 쇼츠 → 거래까지 한 화면에서 이동합니다.
            </p>
          </div>
        </header>

        <section style={S.kpis}>
          <div style={S.kpi}><b>오늘 1순위</b><strong>자료자산센터</strong><span>안이영 PPT·농진청 PDF 테스트</span></div>
          <div style={S.kpi}><b>운영 원칙</b><strong>엑셀형</strong><span>카드형 금지, 한 줄 한 건</span></div>
          <div style={S.kpi}><b>핵심 자산</b><strong>한국농수산TV</strong><span>유튜브·촬영원본·자막</span></div>
          <div style={S.kpi}><b>수익 방향</b><strong>AI 노출점수</strong><span>기업 홍보비·콘텐츠 제작</span></div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>관리 메뉴판</h2>
            <span>자주 쓰는 순서대로 배치</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>순서</th>
                  <th style={S.th}>메뉴</th>
                  <th style={S.th}>구분</th>
                  <th style={S.thWide}>역할</th>
                  <th style={S.th}>실행</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr key={m[0]}>
                    <td style={S.rank}>{m[0]}</td>
                    <td style={S.titleTd}>{m[1]}</td>
                    <td style={S.good}>{m[2]}</td>
                    <td style={S.td}>{m[4]}</td>
                    <td style={S.td}>
                      <Link href={m[3]} style={S.btn}>열기</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1800, margin: "0 auto" },
  header: { marginBottom: 18 },
  eye: { color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 54, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { color: "#475569", fontSize: 18, fontWeight: 850 },
  kpis: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 14 },
  kpi: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, padding: 18, display: "grid", gap: 8 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, overflow: "hidden" },
  panelHead: { padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 1300, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, whiteSpace: "nowrap" },
  thWide: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, minWidth: 650 },
  rank: { padding: 14, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950 },
  td: { padding: 14, borderTop: "1px solid #edf2f7", fontWeight: 850 },
  titleTd: { padding: 14, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  good: { padding: 14, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  btn: { background: "#0f172a", color: "#fff", borderRadius: 10, padding: "8px 12px", textDecoration: "none", fontWeight: 950 },
};
