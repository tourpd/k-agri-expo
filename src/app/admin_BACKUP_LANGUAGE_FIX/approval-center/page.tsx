import Link from "next/link";

export const dynamic = "force-dynamic";

const items = [
  {
    priority: "긴급",
    type: "판매",
    title: "홍산마늘 깐마늘 11톤 긴급판매",
    source: "작가실",
    status: "승인대기",
    next: "메인 노출 · 문자발송 · B2B 영업",
  },
  {
    priority: "긴급",
    type: "뉴스",
    title: "오늘 농사뉴스 TOP5",
    source: "농사뉴스센터",
    status: "검증필요",
    next: "출처 확인 후 오후 6시 발행",
  },
  {
    priority: "중요",
    type: "웹툰",
    title: "안이영 고추 웹툰 1화",
    source: "작가실",
    status: "작성중",
    next: "공동편집 후 승인",
  },
  {
    priority: "중요",
    type: "쇼츠",
    title: "고추 탄저병 주의 쇼츠",
    source: "병해충 자료",
    status: "대기",
    next: "CG실 연결 예정",
  },
];

export default function ApprovalCenterPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>← 경영기획실</Link>
            <div style={S.eyebrow}>K-AGRI PROGRAMMING APPROVAL CENTER</div>
            <h1 style={S.title}>편성승인센터</h1>
            <p style={S.sub}>
              작가실·뉴스센터·웹툰·쇼츠·판매 콘텐츠는 여기서 컨펌 받은 뒤 발행합니다.
            </p>
          </div>
          <Link href="/admin/kagri-writers-room" style={S.darkBtn}>작가실 열기</Link>
        </header>

        <section style={S.ruleBox}>
          <h2>운영 기준</h2>
          <p>
            생성 위치와 상관없이 모든 콘텐츠는 편성승인센터로 모입니다.
            승인 전에는 메인페이지·뉴스·문자·유튜브·쇼츠로 발행하지 않습니다.
          </p>
        </section>

        <section style={S.kpiGrid}>
          <Kpi title="승인대기" value="4" color="#dc2626" />
          <Kpi title="검증필요" value="1" color="#f97316" />
          <Kpi title="수정요청" value="0" color="#2563eb" />
          <Kpi title="발행가능" value="1" color="#15803d" />
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>오늘 승인해야 할 콘텐츠</h2>
            <p>승인 · 수정요청 · 보류 · 반려 중 하나를 결정합니다.</p>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>우선</th>
                  <th style={S.th}>종류</th>
                  <th style={S.th}>콘텐츠</th>
                  <th style={S.th}>출처</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>다음 액션</th>
                  <th style={S.th}>결정</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.title}>
                    <td style={S.td}>
                      <span style={x.priority === "긴급" ? S.badgeRed : S.badgeYellow}>
                        {x.priority}
                      </span>
                    </td>
                    <td style={S.td}>{x.type}</td>
                    <td style={S.tdStrong}>{x.title}</td>
                    <td style={S.td}>{x.source}</td>
                    <td style={S.td}>{x.status}</td>
                    <td style={S.td}>{x.next}</td>
                    <td style={S.td}>
                      <div style={S.btns}>
                        <button style={S.approveBtn}>승인</button>
                        <button style={S.editBtn}>수정</button>
                        <button style={S.holdBtn}>보류</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.publishBox}>
          <h2>승인 후 발행 채널</h2>
          <div style={S.channelGrid}>
            {["메인페이지", "농사뉴스", "문자발송", "카카오", "유튜브", "쇼츠", "블로그", "밴드"].map((x) => (
              <div key={x} style={S.channel}>□ {x}</div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={{ ...S.kpi, borderColor: color }}>
      <div style={S.kpiTitle}>{title}</div>
      <div style={{ ...S.kpiValue, color }}>{value}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#111827", padding: 24 },
  wrap: { maxWidth: 1480, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 20 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eyebrow: { marginTop: 18, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0 0", fontSize: 58, lineHeight: 1, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { margin: "12px 0 0", color: "#64748b", fontWeight: 850, fontSize: 18 },
  darkBtn: { background: "#111827", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  ruleBox: { background: "#fff", border: "2px solid #bbf7d0", borderRadius: 24, padding: 24, marginBottom: 16 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 },
  kpi: { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 20, padding: 18 },
  kpiTitle: { color: "#64748b", fontWeight: 950 },
  kpiValue: { marginTop: 8, fontSize: 42, fontWeight: 950 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 24, overflow: "hidden", marginBottom: 16 },
  panelHead: { padding: 22, borderBottom: "1px solid #e5e7eb" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1200 },
  th: { background: "#f3f4f6", padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 950 },
  td: { padding: "16px", borderBottom: "1px solid #e5e7eb", fontWeight: 850, verticalAlign: "top" },
  tdStrong: { padding: "16px", borderBottom: "1px solid #e5e7eb", fontWeight: 950, fontSize: 17, verticalAlign: "top" },
  badgeRed: { background: "#fee2e2", color: "#dc2626", borderRadius: 999, padding: "7px 10px", fontWeight: 950 },
  badgeYellow: { background: "#fef3c7", color: "#b45309", borderRadius: 999, padding: "7px 10px", fontWeight: 950 },
  btns: { display: "flex", gap: 6, flexWrap: "wrap" },
  approveBtn: { border: 0, background: "#15803d", color: "#fff", borderRadius: 9, padding: "8px 10px", fontWeight: 950 },
  editBtn: { border: 0, background: "#2563eb", color: "#fff", borderRadius: 9, padding: "8px 10px", fontWeight: 950 },
  holdBtn: { border: 0, background: "#64748b", color: "#fff", borderRadius: 9, padding: "8px 10px", fontWeight: 950 },
  publishBox: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 24, padding: 24 },
  channelGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 },
  channel: { background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, fontWeight: 950 },
};
