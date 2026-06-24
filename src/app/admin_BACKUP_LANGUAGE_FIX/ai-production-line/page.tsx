import Link from "next/link";

export const dynamic = "force-dynamic";

const jobs = [
  ["홍산마늘 긴급판매", "판매콘텐츠", "CG 6종", "성우 1종", "영상 3종", "승인대기"],
  ["오늘 농사뉴스 TOP5", "뉴스", "인포그래픽 5종", "앵커멘트", "뉴스형 쇼츠", "제작중"],
  ["안이영 고추웹툰 1화", "웹툰", "웹툰컷 8장", "캐릭터 대사", "릴스 영상", "초안"],
  ["고추 탄저병 경보", "병해충", "방제카드 4장", "경고음성", "긴급 쇼츠", "대기"],
];

export default function Page() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>← 경영기획실</Link>
            <div style={S.eyebrow}>AI PRODUCTION LINE</div>
            <h1 style={S.title}>AI 자동 제작라인</h1>
            <p style={S.sub}>
              콘텐츠 하나가 들어오면 CG · 성우 · 영상 · 자막 · 승인까지 자동으로 흘러가는 생산라인입니다.
            </p>
          </div>
          <Link href="/admin/approval-center" style={S.darkBtn}>편성승인센터</Link>
        </header>

        <section style={S.hero}>
          <div>
            <div style={S.red}>핵심 전환</div>
            <h2 style={S.heroTitle}>조PD가 일일이 만드는 구조를 끝냅니다.</h2>
            <p style={S.heroText}>
              앞으로는 자료 하나가 들어오면 AI가 글, 그림, 음성, 영상 후보를 만들고
              조PD는 선택·수정·승인만 합니다.
            </p>
          </div>
          <div style={S.heroCard}>
            <span>목표</span>
            <b>자료 1개 → 결과물 20개</b>
            <small>뉴스 · 쇼츠 · 웹툰 · 문자 · 영상</small>
          </div>
        </section>

        <section style={S.flow}>
          <Step no="1" title="원천자료" desc="PPT · PDF · 영상 · 사진 · 현장메모" />
          <Step no="2" title="작가 AI" desc="뉴스 · 쇼츠 · 웹툰 · 문자 대본 생성" />
          <Step no="3" title="CG실" desc="인포그래픽 · 지도 · 표 · 썸네일 · 웹툰컷" />
          <Step no="4" title="성우실" desc="나레이션 · 캐릭터 대사 · 뉴스 멘트" />
          <Step no="5" title="영상실" desc="이미지+음성+자막 자동 조립" />
          <Step no="6" title="승인센터" desc="조PD 최종 승인 후 발행" />
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>자동 제작 대기열</h2>
            <p>앞으로 모든 콘텐츠는 이 생산라인을 거쳐 승인센터로 이동합니다.</p>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>콘텐츠</th>
                  <th style={S.th}>유형</th>
                  <th style={S.th}>CG 결과물</th>
                  <th style={S.th}>성우 결과물</th>
                  <th style={S.th}>영상 결과물</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>다음</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((r) => (
                  <tr key={r[0]}>
                    <td style={S.tdStrong}>{r[0]}</td>
                    <td style={S.td}>{r[1]}</td>
                    <td style={S.td}>{r[2]}</td>
                    <td style={S.td}>{r[3]}</td>
                    <td style={S.td}>{r[4]}</td>
                    <td style={S.td}><span style={S.badge}>{r[5]}</span></td>
                    <td style={S.td}>
                      <Link href="/admin/approval-center" style={S.smallBtn}>승인센터로</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.cards}>
          <Factory title="CG실" desc="표, 지도, 인포그래픽, 썸네일, 웹툰컷을 자동 생성합니다." items={["가격표", "전국지도", "비교표", "웹툰컷", "쇼츠 이미지"]} />
          <Factory title="성우실" desc="뉴스형, 다큐형, 농촌 꽁트형, 캐릭터형 음성을 만듭니다." items={["뉴스 멘트", "조PD톤", "농민 캐릭터", "효과음", "BGM"]} />
          <Factory title="영상실" desc="CG와 음성을 붙이고 자막을 얹어 업로드 가능한 영상으로 만듭니다." items={["쇼츠", "뉴스", "웹툰영상", "판매영상", "교육영상"]} />
        </section>

        <section style={S.today}>
          <h2>오늘 성공 기준</h2>
          <p>
            홍산마늘 또는 안이영 자료 1개를 골라서
            글 → CG → 성우 → 영상 → 승인센터까지 이어지는 첫 생산라인을 만든다.
          </p>
        </section>
      </div>
    </main>
  );
}

function Step({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <div style={S.step}>
      <div style={S.no}>{no}</div>
      <b>{title}</b>
      <p>{desc}</p>
    </div>
  );
}

function Factory({ title, desc, items }: { title: string; desc: string; items: string[] }) {
  return (
    <article style={S.factory}>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div style={S.itemGrid}>
        {items.map((x) => <span key={x}>{x}</span>)}
      </div>
    </article>
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
  darkBtn: { background: "#111827", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950, height: "fit-content" },

  hero: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, background: "#fff", border: "3px solid #15803d", borderRadius: 30, padding: 28, marginBottom: 18 },
  red: { color: "#dc2626", fontWeight: 950 },
  heroTitle: { margin: "8px 0", fontSize: 42, lineHeight: 1.12, fontWeight: 950, letterSpacing: "-.05em" },
  heroText: { color: "#475569", fontSize: 19, lineHeight: 1.6, fontWeight: 850 },
  heroCard: { background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 24, padding: 22, display: "grid", alignContent: "center", gap: 8 },
  flow: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 18 },
  step: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, padding: 16 },
  no: { width: 38, height: 38, borderRadius: 12, background: "#111827", color: "#fff", display: "grid", placeItems: "center", fontWeight: 950, marginBottom: 10 },

  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 26, overflow: "hidden", marginBottom: 18 },
  panelHead: { padding: 22, borderBottom: "1px solid #e5e7eb" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1100 },
  th: { background: "#f3f4f6", padding: 14, textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 950 },
  td: { padding: 14, borderBottom: "1px solid #e5e7eb", fontWeight: 850, verticalAlign: "top" },
  tdStrong: { padding: 14, borderBottom: "1px solid #e5e7eb", fontWeight: 950, verticalAlign: "top" },
  badge: { background: "#ecfdf5", color: "#15803d", borderRadius: 999, padding: "7px 10px", fontWeight: 950 },
  smallBtn: { background: "#15803d", color: "#fff", borderRadius: 10, padding: "8px 12px", textDecoration: "none", fontWeight: 950 },

  cards: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 },
  factory: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 24, padding: 22 },
  itemGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  today: { background: "#111827", color: "#fff", borderRadius: 28, padding: 26 },
};
