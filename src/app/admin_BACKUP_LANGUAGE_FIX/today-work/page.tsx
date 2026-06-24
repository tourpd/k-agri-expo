import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rows = [
  ["1", "LibreOffice 확인", "PPT/HWP 변환 준비", "which soffice", "대기", "-"],
  ["2", "안이영 PPT 3개 업로드", "자료 → 텍스트 추출", "/admin/knowledge-assets/extract", "진행", "자료자산센터"],
  ["3", "농진청 PDF 3개 업로드", "PDF → 텍스트 추출", "/admin/knowledge-assets/extract", "진행", "자료자산센터"],
  ["4", "판단규칙 추출", "작물·월·증상·원인·대책·행동지시 생성", "/admin/knowledge-assets/extract", "대기", "AI 추출"],
  ["5", "DB 저장 확인", "knowledge_rules 행 증가 확인", "/admin/knowledge-assets/rules", "대기", "Supabase"],
  ["6", "6월 FCPXML 업로드", "자막 추출·쇼츠 후보 생성", "/admin/ai-broadcast-station", "대기", "AI 방송국"],
  ["7", "자막 교정사전 확인", "제충박사→제균박사 / 연면십이→엽면시비", "/admin/ai-broadcast-station", "대기", "자막DB"],
];

export default function TodayWorkPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/knowledge-assets" style={S.back}>← 농업 AI 두뇌센터</Link>
            <div style={S.eye}>K-AGRI TODAY WORK</div>
            <h1 style={S.title}>오늘 작업 실행센터</h1>
            <p style={S.sub}>오늘은 새 기능 추가 금지. 자료 업로드 → 판단규칙 → DB 저장 → 방송국 테스트만 합니다.</p>
          </div>
        </header>

        <section style={S.notice}>
          <b>오늘 완료 기준</b>
          <span>안이영 PPT 3개 + 농진청 PDF 3개 + 6월 FCPXML 1개가 실제로 돌아가면 성공입니다.</span>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>오늘 할 일 엑셀표</h2>
            <span>순서대로 진행</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>순서</th>
                  <th style={S.th}>작업</th>
                  <th style={S.thWide}>목적</th>
                  <th style={S.th}>실행 위치</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>구분</th>
                  <th style={S.th}>바로가기</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r[0]}>
                    <td style={S.rank}>{r[0]}</td>
                    <td style={S.tdTitle}>{r[1]}</td>
                    <td style={S.td}>{r[2]}</td>
                    <td style={S.td}>{r[3]}</td>
                    <td style={r[4] === "진행" ? S.good : S.wait}>{r[4]}</td>
                    <td style={S.td}>{r[5]}</td>
                    <td style={S.td}>
                      {r[3].startsWith("/") ? (
                        <Link href={r[3]} style={S.btn}>열기</Link>
                      ) : (
                        <code>{r[3]}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>터미널 확인 명령</h2>
          </div>
          <pre style={S.code}>{`cd ~/projects/k-agri-expo

which soffice

# dev 서버 재시작이 필요하면
pkill -f "next dev" || true
rm -f .next/dev/lock
npm run dev`}</pre>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1700, margin: "0 auto" },
  header: { marginBottom: 18 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 14, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 54, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { color: "#475569", fontSize: 18, fontWeight: 850 },
  notice: { background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 18, padding: 16, marginBottom: 14, display: "flex", gap: 14, flexWrap: "wrap" },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, overflow: "hidden", marginBottom: 14 },
  panelHead: { padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 1300, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, whiteSpace: "nowrap" },
  thWide: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, minWidth: 460 },
  rank: { padding: 12, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950 },
  td: { padding: 12, borderTop: "1px solid #edf2f7", fontWeight: 850 },
  tdTitle: { padding: 12, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  good: { padding: 12, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  wait: { padding: 12, borderTop: "1px solid #edf2f7", color: "#64748b", fontWeight: 950 },
  btn: { background: "#0f172a", color: "#fff", borderRadius: 10, padding: "8px 12px", textDecoration: "none", fontWeight: 950 },
  code: { padding: 18, background: "#0f172a", color: "#fff", overflowX: "auto", fontWeight: 850 },
};
