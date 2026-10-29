"use client";

import { useState } from "react";

export default function Page() {
  const [dream, setDream] = useState("나는 한국농수산TV PD다. 아내와 전국 농가를 다니며 유튜브 촬영을 하고 밤에는 차박도 하고 싶다. 커피도 마시고 편집도 해야 한다.");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/pv5-life/design", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ dream })
    });
    setResult(await res.json());
    setLoading(false);
  }

  const money = (n:number) => Number(n || 0).toLocaleString("ko-KR") + "원";

  return (
    <main style={S.page}>
      <section style={S.wrap}>
        <section style={S.hero}>
          <div>
            <div style={S.badge}>K-AGRI × PV5 SIMULATION</div>
            <h1 style={S.title}>당신의 삶을<br/>PV5 공간으로 먼저 보여드립니다</h1>
            <p style={S.sub}>실제 차량 이미지와 실제 크기 기준으로 2D 배치도를 생성합니다.</p>
          </div>
          <img src="/mobility/pv5/reference/pv5-cargo-highroof.png" style={S.heroCar}/>
        </section>

        <textarea value={dream} onChange={e=>setDream(e.target.value)} style={S.textarea}/>
        <button onClick={run} style={S.button}>{loading ? "생성 중..." : "내 PV5 공간 시뮬레이션 보기"}</button>

        {result && (
          <>
            <section style={S.card}>
              <h2>{result.title}</h2>
              <img src={result.vehicle_image} style={S.car}/>
              <h1>{result.vehicle}</h1>
              <p>실내 기준: {result.interior.length} × {result.interior.width} × {result.interior.height}mm</p>
            </section>

            <section style={S.card}>
              <h2>실제 크기 기반 2D 공간 배치도</h2>
              <img src={result.floorplan_image} style={S.plan}/>
            </section>

            <section style={S.card}>
              <h2>배치된 구성</h2>
              {result.placed_items.map((x:any)=>(
                <div key={x.label} style={S.item}>
                  <b>{x.label}</b>
                  <p>크기 {x.w} × {x.d} × {x.h}mm / 위치 x:{x.x}, y:{x.y}</p>
                  <strong>{money(x.price)}</strong>
                </div>
              ))}
            </section>

            <section style={S.card}>
              <h2>예상 제작비</h2>
              <p>차량 기준가: {money(result.estimate.vehicle)}</p>
              <p>공간 구성: {money(result.estimate.custom)}</p>
              <p>제작/설치비: {money(result.estimate.labor)}</p>
              <h1 style={S.total}>총 예상 {money(result.estimate.total)}</h1>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

const S:any = {
  page:{minHeight:"100vh",background:"#f4faf4",padding:24,color:"#111"},
  wrap:{maxWidth:1100,margin:"0 auto"},
  hero:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center",background:"#fff",borderRadius:28,padding:26,border:"1px solid #d8ebd8"},
  badge:{fontWeight:900,color:"#137333"},
  title:{fontSize:46,lineHeight:1.12,color:"#14532d",margin:"12px 0"},
  sub:{fontSize:20,lineHeight:1.5},
  heroCar:{width:"100%",maxHeight:360,objectFit:"contain",background:"#eef4ee",borderRadius:20},
  textarea:{width:"100%",minHeight:140,marginTop:20,padding:18,fontSize:18,borderRadius:16,background:"#fff",color:"#111",border:0},
  button:{width:"100%",marginTop:14,padding:18,border:0,borderRadius:16,background:"#137333",color:"#fff",fontSize:20,fontWeight:900},
  card:{background:"#fff",border:"1px solid #d8ebd8",borderRadius:24,padding:22,marginTop:20,boxShadow:"0 10px 24px rgba(0,0,0,.05)"},
  car:{width:"100%",maxHeight:360,objectFit:"contain",background:"#eef4ee",borderRadius:18},
  plan:{width:"100%",borderRadius:18,border:"1px solid #d8ebd8"},
  item:{borderTop:"1px solid #ddd",padding:"14px 0"},
  total:{color:"#137333"}
};
