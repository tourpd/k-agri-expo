"use client";

export default function InsectFutureHall() {
  return (
    <section style={S.wrap}>
      
      <div style={S.header}>
        <div style={S.badge}>CATEGORY HALL</div>
        <h1 style={S.title}>미래 곤충관</h1>
        <p style={S.desc}>
          유튜브 교육 콘텐츠를 기반으로  
          곤충 사육 → 가공 → 건강식품 사업까지 연결합니다.
        </p>
      </div>

      {/* 🔥 실제 영상 연결 */}
      <div style={S.videoRow}>
        <button
          style={S.btnPrimary}
          onClick={() => window.open("https://youtu.be/q9Fm3p6rpkE", "_blank")}
        >
          📺 고소애 사육법
        </button>

        <button
          style={S.btnPrimary}
          onClick={() => window.open("https://youtu.be/LWBGYMdMRtI", "_blank")}
        >
          📺 메디푸드 사업
        </button>

        <button
          style={S.btnPrimary}
          onClick={() => window.open("https://youtu.be/dAJIOy6cjTI", "_blank")}
        >
          📺 곤충산업단지
        </button>
      </div>

      {/* 🔥 공식 사업 연결 */}
      <div style={S.linkRow}>
        <button
          style={S.btnSecondary}
          onClick={() => window.open("https://hanminutrition.com/", "_blank")}
        >
          🏢 한미양행 →
        </button>

        <button
          style={S.btnSecondary}
          onClick={() =>
            window.open(
              "https://smartstore.naver.com/kffr",
              "_blank"
            )
          }
        >
          🌱 KFFR 공식몰 →
        </button>
      </div>

      {/* 🔥 사업 구조 (핵심 메시지) */}
      <div style={S.flow}>
        👉 유튜브 교육 → 사육 → 원료 생산 → 한미양행 가공 → KFFR 판매
      </div>

      {/* 🔥 "있어 보이는" 구조 카드 */}
      <div style={S.cardGrid}>
        <div style={S.card}>
          <div style={S.cardTitle}>📺 교육</div>
          <div style={S.cardText}>
            영상으로 사육 방법과 수익 구조 이해
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>🐛 생산</div>
          <div style={S.cardText}>
            고소애 등 식용곤충 직접 생산
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>🏭 가공</div>
          <div style={S.cardText}>
            한미양행 연계 건강식품 개발
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>🛒 판매</div>
          <div style={S.cardText}>
            KFFR 브랜드로 시장 판매
          </div>
        </div>
      </div>

      {/* 🔥 CTA (과하지 않게) */}
      <div style={S.cta}>
        영상 확인 후 사업 구조를 이해하신 분만  
        공식 사이트에서 추가 정보를 확인하세요.
      </div>

    </section>
  );
}

const S: any = {

wrap:{
  marginTop:40,
  padding:30,
  borderRadius:30,
  background:"linear-gradient(135deg,#166534,#15803d)",
  color:"white"
},

badge:{
  fontSize:14,
  fontWeight:800,
  opacity:0.8
},

title:{
  fontSize:42,
  fontWeight:900,
  marginTop:10
},

desc:{
  marginTop:10,
  fontSize:18,
  opacity:0.9,
  lineHeight:1.6
},

videoRow:{
  marginTop:30,
  display:"flex",
  gap:12,
  flexWrap:"wrap"
},

linkRow:{
  marginTop:15,
  display:"flex",
  gap:12,
  flexWrap:"wrap"
},

btnPrimary:{
  padding:"14px 20px",
  borderRadius:14,
  background:"white",
  color:"#166534",
  fontWeight:900,
  border:"none",
  cursor:"pointer"
},

btnSecondary:{
  padding:"12px 18px",
  borderRadius:14,
  background:"rgba(255,255,255,0.15)",
  color:"white",
  fontWeight:800,
  border:"1px solid rgba(255,255,255,0.3)",
  cursor:"pointer"
},

cardGrid:{
  marginTop:24,
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))",
  gap:12
},

card:{
  padding:18,
  borderRadius:18,
  background:"rgba(255,255,255,0.12)",
  border:"1px solid rgba(255,255,255,0.2)"
},

cardTitle:{
  fontSize:18,
  fontWeight:900
},

cardText:{
  marginTop:6,
  fontSize:14,
  opacity:0.9
},

flow:{
  marginTop:25,
  padding:16,
  borderRadius:16,
  background:"#065f46",
  fontWeight:800
},

cta:{
  marginTop:20,
  fontSize:16,
  fontWeight:700,
  opacity:0.95
}

};