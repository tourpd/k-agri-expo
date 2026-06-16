import Link from "next/link";

export const dynamic = "force-dynamic";

const news = [
  ["1", "마늘 가격 강세 지속", "저장마늘·홍산마늘 출하 전략 점검", "시세"],
  ["2", "비 소식 / 태풍 가능성", "비 예보 있을 때만 긴급 알림", "날씨"],
  ["3", "고추 탄저병·총채벌레 주의", "비 온 뒤 병해충 예찰 필요", "병해충"],
  ["4", "농기계·스마트팜 지원사업", "신청 마감일 확인 필요", "지원"],
  ["5", "이번 주 돈 되는 작물 시세", "마늘·양파·고추·오이 중심", "가격"],
];

export default function FarmerBriefingPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <Link href="/expo" style={S.back}>← K-Agri Expo</Link>

        <section style={S.hero}>
          <div>
            <div style={S.badge}>매일 오전 6시 편성 · 조PD 승인 후 공개</div>
            <h1 style={S.title}>
              돈이 되는 <span style={{ color: "#047857" }}>농사정보</span><br />
              혼자만 보세요!
            </h1>
            <p style={S.desc}>
              농민에게 돈이 되는 뉴스만 5가지로 엄선합니다. 날씨는 비·태풍·폭염처럼 농사에 영향을 줄 때만 알려드립니다.
            </p>
          </div>

          <div style={S.summary}>
            <h2 style={S.summaryTitle}>오늘 브리핑 핵심</h2>
            <p style={S.summaryText}>마늘 가격 · 비 소식 · 고추 병해충 · 지원사업 · 이번 주 시세</p>
            <button style={S.mainBtn}>오늘의 농사뉴스 확인하기 →</button>
          </div>
        </section>

        <section style={S.notice}>
          <div style={S.noticeIcon}>🌧️</div>
          <div>
            <b>비 소식이 있습니다</b>
            <p>내일 오후부터 비 예보가 있어 약제 살포·수확·저장고 환기 일정을 조정하세요.</p>
          </div>
        </section>

        <section style={S.grid}>
          <div style={S.cardBig}>
            <h2 style={S.sectionTitle}>오늘의 농사뉴스 TOP 5</h2>
            <div style={S.newsList}>
              {news.map((n) => (
                <div key={n[0]} style={S.newsItem}>
                  <div style={S.num}>{n[0]}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={S.newsTitle}>{n[1]}</h3>
                    <p style={S.newsDesc}>{n[2]}</p>
                  </div>
                  <div style={S.tag}>{n[3]}</div>
                  <button style={S.smallBtn}>자세히</button>
                </div>
              ))}
            </div>
          </div>

          <aside style={S.side}>
            <h2 style={S.sectionTitle}>오늘 해야 할 일</h2>
            {["마늘 저장고 환기 확인", "고추 탄저병 예찰", "비 오기 전 배수로 점검", "지원사업 마감일 확인"].map((x) => (
              <div key={x} style={S.todo}>✅ {x}</div>
            ))}
          </aside>
        </section>

        <section style={S.sourceBox}>
          <h2 style={S.sectionTitle}>출처와 검증</h2>
          <p style={S.sourceText}>
            모든 브리핑은 농진청·농식품부·기상청·KAMIS·농민신문 등 공개자료를 바탕으로 편성국 검토 후 발행합니다.
          </p>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef2f5", color: "#111827", padding: 24 },
  wrap: { maxWidth: 1160, margin: "0 auto" },
  back: { color: "#047857", textDecoration: "none", fontWeight: 950 },
  hero: { marginTop: 22, background: "#fff", borderRadius: 30, padding: 42, display: "grid", gridTemplateColumns: "1.4fr .8fr", gap: 24, boxShadow: "0 18px 45px rgba(15,23,42,.10)" },
  badge: { color: "#047857", fontWeight: 950, marginBottom: 16 },
  title: { margin: 0, fontSize: 64, lineHeight: 1.05, fontWeight: 950, letterSpacing: "-.07em" },
  desc: { marginTop: 22, fontSize: 21, lineHeight: 1.55, fontWeight: 800, color: "#475569" },
  summary: { background: "linear-gradient(135deg,#064e3b,#047857)", color: "#fff", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", justifyContent: "center" },
  summaryTitle: { margin: 0, fontSize: 30, fontWeight: 950 },
  summaryText: { fontSize: 18, lineHeight: 1.5, fontWeight: 800 },
  mainBtn: { marginTop: 10, height: 58, border: 0, borderRadius: 15, background: "#fff", color: "#047857", fontSize: 18, fontWeight: 950 },
  notice: { marginTop: 18, background: "#fff7ed", border: "2px solid #fdba74", borderRadius: 22, padding: 22, display: "flex", gap: 18, alignItems: "center" },
  noticeIcon: { fontSize: 46 },
  grid: { marginTop: 18, display: "grid", gridTemplateColumns: "1.5fr .7fr", gap: 18 },
  cardBig: { background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 12px 34px rgba(15,23,42,.08)" },
  side: { background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 12px 34px rgba(15,23,42,.08)" },
  sectionTitle: { margin: "0 0 18px", fontSize: 28, fontWeight: 950 },
  newsList: { display: "grid", gap: 10 },
  newsItem: { display: "flex", gap: 14, alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 },
  num: { width: 38, height: 38, borderRadius: 10, background: "#047857", color: "#fff", display: "grid", placeItems: "center", fontWeight: 950 },
  newsTitle: { margin: 0, fontSize: 21, fontWeight: 950 },
  newsDesc: { margin: "5px 0 0", color: "#64748b", fontWeight: 800 },
  tag: { background: "#ecfdf5", color: "#047857", borderRadius: 999, padding: "8px 12px", fontWeight: 950 },
  smallBtn: { border: "1px solid #d1d5db", background: "#fff", borderRadius: 12, padding: "10px 14px", fontWeight: 950 },
  todo: { borderBottom: "1px solid #e5e7eb", padding: "15px 0", fontSize: 18, fontWeight: 900 },
  sourceBox: { marginTop: 18, background: "#fff", borderRadius: 24, padding: 24 },
  sourceText: { margin: 0, color: "#475569", fontSize: 18, fontWeight: 800, lineHeight: 1.6 },
};
