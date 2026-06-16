
import Link from "next/link";

export const dynamic = "force-dynamic";

const PHONE = "01085561010";

const DISPLAY_PHONE = "010-8556-1010";

export default function HongsanGarlicPage() {

  return (

    <main style={{ minHeight: "100vh", background: "#f8faf5", color: "#111827" }}>

      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 16px 60px" }}>

        <Link href="/expo" style={{ color: "#087a35", fontWeight: 900, textDecoration: "none" }}>

          ← K-Agri Expo

        </Link>

        <div style={{ marginTop: 22, overflow: "hidden", borderRadius: 28, boxShadow: "0 18px 45px rgba(15,23,42,.18)" }}>

          <img

            src="/images/hongsan-garlic-main.png"

            alt="홍산마늘 깐마늘 긴급특가"

            style={{ width: "100%", display: "block" }}

          />

        </div>

        <section style={{ marginTop: 24, borderRadius: 28, background: "#fff", padding: 28, boxShadow: "0 14px 36px rgba(15,23,42,.10)" }}>

          <p style={{ margin: 0, color: "#dc2626", fontWeight: 950, fontSize: 18 }}>홍산마늘 긴급 대량공급</p>

          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(34px, 6vw, 64px)", lineHeight: 1.05, letterSpacing: "-.06em", fontWeight: 950 }}>

            마트 깐마늘 12,000원/kg<br />

            홍산마늘 깐마늘 <span style={{ color: "#dc2626" }}>5,500원/kg</span>

          </h1>

          <p style={{ marginTop: 18, fontSize: 22, lineHeight: 1.55, fontWeight: 800 }}>

            현재 재고 11톤. 김치공장, 반찬공장, 교회, 급식업체, 식자재업체 대량 구매 환영합니다.

            화물 배송 가능합니다.

          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 20 }}>

            <Box title="100kg 구매 시" value="65만원 절약" />

            <Box title="500kg 구매 시" value="325만원 절약" />

            <Box title="1톤 구매 시" value="650만원 절약" />

          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>

            <a href={`tel:${PHONE}`} style={btn("#dc2626")}>📞 대량 구매 상담하기<br />{DISPLAY_PHONE}</a>

            <a href="#inquiry" style={btn("#087a35")}>🛒 구매 문의 남기기</a>

          </div>

        </section>

        <section style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          <Info title="왜 이렇게 저렴합니까?">

            홍산마늘 연구회가 보유한 깐마늘 11톤을 2주 안에 판매해야 하기 때문입니다.

            품질 문제가 아닙니다. 농촌진흥청이 6년간 연구해 개발한 대한민국 토종마늘입니다.

          </Info>

          <Info title="대량 구매 대상">

            김치공장, 반찬공장, 교회 식당, 급식업체, 식자재마트, 프랜차이즈 식당, 복지급식, 군납 관련 업체.

          </Info>

        </section>

        <section style={{ marginTop: 22, borderRadius: 28, background: "#fff", padding: 28, boxShadow: "0 14px 36px rgba(15,23,42,.10)" }}>

          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 950 }}>비교하면 확실합니다</h2>

          <div style={{ overflowX: "auto", marginTop: 16 }}>

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: 18, fontWeight: 800 }}>

              <thead>

                <tr>

                  {["구분", "시중 깐마늘", "홍산마늘 특가", "절약금액"].map((h) => (

                    <th key={h} style={th}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[

                  ["1kg", "12,000원", "5,500원", "6,500원"],

                  ["100kg", "1,200,000원", "550,000원", "650,000원"],

                  ["500kg", "6,000,000원", "2,750,000원", "3,250,000원"],

                  ["1톤", "12,000,000원", "5,500,000원", "6,500,000원"],

                ].map((r) => (

                  <tr key={r[0]}>

                    {r.map((c, i) => (

                      <td key={c} style={{ ...td, color: i >= 2 ? "#dc2626" : "#111827" }}>{c}</td>

                    ))}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        <section style={{ marginTop: 22, borderRadius: 28, background: "#fff", padding: 28, boxShadow: "0 14px 36px rgba(15,23,42,.10)" }}>

          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 950 }}>영상 설명</h2>

          <div style={{ marginTop: 16, aspectRatio: "16 / 9", borderRadius: 22, overflow: "hidden", background: "#111" }}>

            <iframe

              src="https://www.youtube.com/embed/"

              title="홍산마늘 이야기"

              allowFullScreen

              style={{ width: "100%", height: "100%", border: 0 }}

            />

          </div>

          <p style={{ marginTop: 12, fontWeight: 800, color: "#6b7280" }}>

            유튜브 업로드 후 embed 주소만 교체하면 됩니다.

          </p>

        </section>

        <section id="inquiry" style={{ marginTop: 22, borderRadius: 28, background: "#fff7ed", padding: 28, border: "2px solid #fed7aa" }}>

          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 950 }}>지금 바로 상담하세요</h2>

          <p style={{ fontSize: 24, fontWeight: 900 }}>

            이성준 회장 {DISPLAY_PHONE}

          </p>

          <a href={`tel:${PHONE}`} style={btn("#dc2626")}>📞 전화 상담하기</a>

          <p style={{ marginTop: 16, fontWeight: 800, color: "#6b7280" }}>

            택배 불가. 최소 100kg 이상 대량 구매만 상담합니다. 업체 직접 픽업 또는 화물 출고 조건입니다.

          </p>

        </section>

      </section>

    </main>

  );

}

function Box({ title, value }: { title: string; value: string }) {

  return (

    <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, background: "#f9fafb" }}>

      <p style={{ margin: 0, color: "#6b7280", fontWeight: 900 }}>{title}</p>

      <p style={{ margin: "8px 0 0", fontSize: 28, color: "#dc2626", fontWeight: 950 }}>{value}</p>

    </div>

  );

}

function Info({ title, children }: { title: string; children: React.ReactNode }) {

  return (

    <div style={{ borderRadius: 28, background: "#fff", padding: 28, boxShadow: "0 14px 36px rgba(15,23,42,.10)" }}>

      <h2 style={{ margin: 0, fontSize: 30, fontWeight: 950 }}>{title}</h2>

      <p style={{ marginTop: 14, fontSize: 20, lineHeight: 1.6, fontWeight: 800 }}>{children}</p>

    </div>

  );

}

function btn(bg: string): React.CSSProperties {

  return {

    display: "block",

    borderRadius: 18,

    background: bg,

    color: "#fff",

    padding: "18px 22px",

    textAlign: "center",

    textDecoration: "none",

    fontSize: 22,

    fontWeight: 950,

  };

}

const th: React.CSSProperties = {

  border: "1px solid #d1d5db",

  background: "#f3f4f6",

  padding: 14,

  textAlign: "center",

};

const td: React.CSSProperties = {

  border: "1px solid #d1d5db",

  padding: 14,

  textAlign: "center",

};

