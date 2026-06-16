import Link from "next/link";

export const dynamic = "force-dynamic";

const sources = [
  {
    name: "안이영 농민교육 자료",
    category: "교육자산",
    status: "원천자료 확보",
    problem: "좋은 자료가 있어도 매번 조PD가 직접 해석해야 함",
    output: "고추 웹툰, 농사뉴스, 교육 쇼츠, 강의안",
    next: "고추 자료 1개를 골라 1화 제작 후보 생성",
  },
  {
    name: "홍산마늘 프로젝트",
    category: "판매자산",
    status: "긴급 판매 진행",
    problem: "마늘 판매가 홍보에만 머물면 대량계약으로 이어지기 어려움",
    output: "B2B 제안서, 문자, 판매뉴스, 쇼츠, 가격표",
    next: "김치공장·급식업체용 영업 콘텐츠 생성",
  },
  {
    name: "병해충 자료",
    category: "문제해결자산",
    status: "자료 분산",
    problem: "농민은 병해충이 왔을 때 바로 답을 원함",
    output: "긴급경보, 방제카드, 쇼츠, 뉴스, 작물별 체크리스트",
    next: "고추 탄저병 경보 콘텐츠 후보 생성",
  },
  {
    name: "농사뉴스 TOP5",
    category: "유입자산",
    status: "구조 설계중",
    problem: "농민이 매일 들어올 이유가 아직 약함",
    output: "오늘의 돈 되는 뉴스, 날씨, 시세, 지원사업, 병해충",
    next: "오후 6시 승인용 뉴스 후보 5개 생성",
  },
];

const candidates = [
  ["뉴스", "고추 탄저병 지금 확인해야 하는 이유", "병해충 자료", "승인대기"],
  ["웹툰", "안이영 고추 이야기 1화", "안이영 자료", "초안"],
  ["판매", "홍산마늘 김치공장 제안서", "홍산마늘", "제작중"],
  ["쇼츠", "비 오기 전 농민이 해야 할 3가지", "농사뉴스", "검토"],
  ["문자", "급식업체 홍산마늘 특가 안내", "홍산마늘", "승인대기"],
];

export default function AiContentDnaPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>← 경영기획실</Link>
            <div style={S.eyebrow}>AI CONTENT DNA ENGINE</div>
            <h1 style={S.title}>AI 콘텐츠 DNA 엔진</h1>
            <p style={S.sub}>
              자료를 모으는 곳이 아니라, 농민에게 필요한 뉴스·쇼츠·웹툰·판매콘텐츠로 변환하는 공간입니다.
            </p>
          </div>
          <div style={S.headerBtns}>
            <Link href="/admin/approval-center" style={S.darkBtn}>편성승인센터</Link>
            <Link href="/admin/kagri-writers-room" style={S.greenBtn}>작가실</Link>
          </div>
        </header>

        <section style={S.truthBox}>
          <div>
            <div style={S.redLabel}>오늘의 핵심 전환</div>
            <h2 style={S.truthTitle}>조PD가 직접 콘텐츠를 만드는 구조에서, 자료가 콘텐츠 후보를 뽑아내는 구조로 바꿉니다.</h2>
            <p style={S.truthText}>
              목표는 새 센터를 늘리는 것이 아닙니다. 안이영 자료, 홍산마늘, 병해충, 농사뉴스 같은 원천자산이
              자동으로 콘텐츠 후보를 만들고, 조PD는 선택·수정·승인만 하는 구조입니다.
            </p>
          </div>
          <div style={S.decisionBox}>
            <span>오늘 만들 흐름</span>
            <b>자료 1개 → 후보 20개 → 승인센터</b>
            <small>이 흐름이 생기면 방송국이 움직이기 시작합니다.</small>
          </div>
        </section>

        <section style={S.flow}>
          <Flow no="1" title="원천자산" desc="PPT, PDF, 영상, 사진, 현장자료" />
          <Flow no="2" title="AI 분해" desc="핵심주제, 농민문제, 판매포인트 추출" />
          <Flow no="3" title="콘텐츠 후보" desc="뉴스, 쇼츠, 웹툰, 문자, 제안서" />
          <Flow no="4" title="편성승인" desc="승인, 수정요청, 보류, 발행결정" />
          <Flow no="5" title="농민에게 전달" desc="홈페이지, 문자, 유튜브, 카카오, 블로그" />
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>원천자산별 변환 계획</h2>
            <p>자료를 보관하는 게 아니라, 농민에게 쓸 수 있는 결과물로 바꿉니다.</p>
          </div>

          <div style={S.assetGrid}>
            {sources.map((x) => (
              <article key={x.name} style={S.assetCard}>
                <div style={S.assetTop}>
                  <span style={S.badge}>{x.category}</span>
                  <span style={S.status}>{x.status}</span>
                </div>
                <h3>{x.name}</h3>
                <div style={S.block}>
                  <b>현재 문제</b>
                  <p>{x.problem}</p>
                </div>
                <div style={S.block}>
                  <b>생성 결과</b>
                  <p>{x.output}</p>
                </div>
                <div style={S.nextBox}>
                  <b>다음 실행</b>
                  <p>{x.next}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>오늘 생성해야 할 콘텐츠 후보</h2>
            <p>이 목록이 편성승인센터로 넘어가야 실제 운영이 됩니다.</p>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>유형</th>
                  <th style={S.th}>콘텐츠 후보</th>
                  <th style={S.th}>원천자산</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>다음</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((r) => (
                  <tr key={r[1]}>
                    <td style={S.td}><span style={S.typeBadge}>{r[0]}</span></td>
                    <td style={S.tdStrong}>{r[1]}</td>
                    <td style={S.td}>{r[2]}</td>
                    <td style={S.td}>{r[3]}</td>
                    <td style={S.td}>
                      <Link href="/admin/approval-center" style={S.smallBtn}>승인센터로</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.today}>
          <div>
            <h2>오늘은 이것만 합니다</h2>
            <p>
              안이영 고추 자료 1개 또는 홍산마늘 자료 1개를 골라서
              뉴스·쇼츠·웹툰·문자 후보로 분해하는 흐름을 먼저 만듭니다.
            </p>
          </div>
          <div style={S.todayBtns}>
            <Link href="/admin/kagri-writers-room/knowledge" style={S.greenBtn}>안이영 자료 보기</Link>
            <Link href="/admin/agri-assets" style={S.greenBtn}>홍산마늘 자산 보기</Link>
            <Link href="/admin/approval-center" style={S.darkBtn}>승인센터 확인</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Flow({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <div style={S.flowCard}>
      <div style={S.flowNo}>{no}</div>
      <b>{title}</b>
      <p>{desc}</p>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#111827", padding: 24 },
  wrap: { maxWidth: 1480, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 22 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eyebrow: { marginTop: 16, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0 0", fontSize: 58, lineHeight: 1, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { margin: "12px 0 0", color: "#475569", fontSize: 20, lineHeight: 1.5, fontWeight: 850 },
  headerBtns: { display: "flex", gap: 10, alignItems: "flex-start" },
  darkBtn: { background: "#111827", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950 },
  greenBtn: { background: "#15803d", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950 },

  truthBox: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, background: "#fff", border: "3px solid #15803d", borderRadius: 30, padding: 28, marginBottom: 18 },
  redLabel: { color: "#dc2626", fontWeight: 950 },
  truthTitle: { margin: "8px 0", fontSize: 40, lineHeight: 1.15, fontWeight: 950, letterSpacing: "-.05em" },
  truthText: { color: "#475569", fontSize: 19, lineHeight: 1.6, fontWeight: 850 },
  decisionBox: { background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 24, padding: 22, display: "grid", alignContent: "center", gap: 8 },
  flow: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 },
  flowCard: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, padding: 18 },
  flowNo: { width: 40, height: 40, borderRadius: 12, background: "#111827", color: "#fff", display: "grid", placeItems: "center", fontWeight: 950, marginBottom: 12 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 26, overflow: "hidden", marginBottom: 18 },
  panelHead: { padding: 22, borderBottom: "1px solid #e5e7eb" },
  assetGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, padding: 18 },
  assetCard: { border: "1px solid #e5e7eb", borderRadius: 22, padding: 18, background: "#f8fafc" },
  assetTop: { display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  badge: { background: "#ecfdf5", color: "#15803d", borderRadius: 999, padding: "6px 10px", fontWeight: 950, fontSize: 13 },
  status: { background: "#f1f5f9", color: "#475569", borderRadius: 999, padding: "6px 10px", fontWeight: 950, fontSize: 13 },
  block: { marginTop: 14 },
  nextBox: { marginTop: 14, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 980 },
  th: { background: "#f3f4f6", padding: 14, textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 950 },
  td: { padding: 14, borderBottom: "1px solid #e5e7eb", fontWeight: 850, verticalAlign: "top" },
  tdStrong: { padding: 14, borderBottom: "1px solid #e5e7eb", fontWeight: 950, verticalAlign: "top" },
  typeBadge: { background: "#e0f2fe", color: "#0369a1", borderRadius: 999, padding: "7px 10px", fontWeight: 950 },
  smallBtn: { background: "#15803d", color: "#fff", borderRadius: 10, padding: "8px 12px", textDecoration: "none", fontWeight: 950 },
  today: { display: "flex", justifyContent: "space-between", gap: 18, background: "#111827", color: "#fff", borderRadius: 28, padding: 26 },
  todayBtns: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
};
