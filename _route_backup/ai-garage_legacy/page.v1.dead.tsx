"use client";

import { useEffect, useState } from "react";

type PV5Spec = {
  model: string;
  label: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  wheelbase_mm: number;
  image_url: string;
  role: string;
};

const STARTERS = [
  "아내와 전국 여행을 다니며 차박하고 싶어요",
  "아이들과 주말마다 캠핑을 다니고 싶어요",
  "유튜브 촬영 장비를 싣고 전국을 다니고 싶어요",
  "낚시 장비를 싣고 쉬었다 갈 수 있는 차가 필요해요",
  "농장 일도 하고, 쉴 수 있는 공간도 있었으면 해요",
  "부모님 병원 이동과 가족 여행을 함께 하고 싶어요"
];

const FOLLOWUPS = [
  "누가 함께 타나요?",
  "차 안에서 꼭 하고 싶은 일은 무엇인가요?",
  "가장 많이 싣는 장비는 무엇인가요?",
  "잠을 차 안에서 자야 하나요?",
  "가장 포기하기 싫은 공간은 무엇인가요?"
];

export default function Page() {
  const [specs, setSpecs] = useState<PV5Spec[]>([]);
  const [story, setStory] = useState("");
  const [focusQuestion, setFocusQuestion] = useState(FOLLOWUPS[0]);
  const [vehicle, setVehicle] = useState<PV5Spec | null>(null);
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", time: "" });

  useEffect(() => {
    fetch("/api/ai-garage/specs")
      .then(r => r.json())
      .then(j => setSpecs(j.specs || []));
  }, []);

  function appendText(t: string) {
    setStory(prev => prev ? `${prev}\n${t}` : t);
  }

  async function createDesign(selectedVehicle?: string) {
    setLoading(true);
    const res = await fetch("/api/ai-garage/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: story,
        selected_vehicle: selectedVehicle || vehicle?.model || ""
      })
    });
    const json = await res.json();
    setDesign(json);
    setLoading(false);
    setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function money(n: number) {
    return n.toLocaleString("ko-KR") + "원";
  }

  function estimate(p: any) {
    const base =
      p?.vehicle?.includes("High Roof") ? 53000000 :
      p?.vehicle?.includes("Cargo") ? 50000000 :
      p?.vehicle?.includes("Openbed") ? 52000000 :
      p?.vehicle?.includes("WAV") ? 61000000 :
      45000000;

    const custom = 14500000;
    const labor = 4500000;
    return { base, custom, labor, total: base + custom + labor };
  }

  function requestLead(p: any) {
    const e = estimate(p);
    alert(`상봉기아 상담 요청서

고객명: ${lead.name}
연락처: ${lead.phone}
희망시간: ${lead.time}

고객 요청:
${story}

추천 차량:
${p.vehicle}

설계안:
${p.concept_name}

가상 예상 견적:
${money(e.total)}

상봉기아 담당자가 이 내용으로 고객에게 연락합니다.`);
  }

  return (
    <main className="page">
      <section className="hero">
        <b>K-AGRI AI Garage · 상봉기아</b>
        <h1>말씀해주신 생활에 맞춰<br />PV5 공간을 설계해드립니다</h1>
        <p>차종을 몰라도 됩니다. 사용 목적을 들은 뒤, 실제 PV5 제원 안에서 가능한 차량과 공간을 보여드립니다.</p>
      </section>

      <section className="panel">
        <h2>1. 먼저 이런 식으로 시작해보세요</h2>
        <div className="starters">
          {STARTERS.map(x => (
            <button key={x} onClick={() => appendText(x)}>{x}</button>
          ))}
        </div>

        <div className="question">
          <b>{focusQuestion}</b>
          <div>
            {FOLLOWUPS.map(q => (
              <button key={q} onClick={() => setFocusQuestion(q)}>{q}</button>
            ))}
          </div>
        </div>

        <textarea
          value={story}
          onChange={e => setStory(e.target.value)}
          placeholder="예) 아내와 전국 여행을 다니고 싶고, 촬영 장비와 낚시 장비를 싣고, 밤에는 차박도 하고 싶어요."
        />

        <button className="primary" onClick={() => createDesign()}>
          {loading ? "설계 중..." : "내 PV5 설계 보기"}
        </button>
      </section>

      <section className="panel">
        <h2>2. PV5 기준 차량 살펴보기</h2>
        <p>카드를 누르면 이 차량이 어떤 용도에 맞는지 확인하고, 바로 이 차 기준으로 설계를 시작할 수 있습니다.</p>

        <div className="cars">
          {specs.map(car => (
            <article className={vehicle?.model === car.model ? "car on" : "car"} key={car.model} onClick={() => setVehicle(car)}>
              <div className="top">
                <h3>{car.model}</h3>
                <span>{car.label}</span>
              </div>
              <img src={car.image_url} alt={car.model} />
              <div className="spec">전장 {car.length_mm} · 전폭 {car.width_mm} · 전고 {car.height_mm} · 휠베이스 {car.wheelbase_mm}mm</div>
              <p>{car.role}</p>
              <button onClick={(e) => { e.stopPropagation(); setVehicle(car); createDesign(car.model); }}>
                이 차량 기준으로 설계 보기
              </button>
            </article>
          ))}
        </div>
      </section>

      {vehicle && (
        <section className="panel vehicleDetail">
          <h2>{vehicle.model}</h2>
          <img src={vehicle.image_url} alt={vehicle.model} />
          <p>{vehicle.role}</p>
          <div className="spec">전장 {vehicle.length_mm} · 전폭 {vehicle.width_mm} · 전고 {vehicle.height_mm} · 휠베이스 {vehicle.wheelbase_mm}mm</div>
          <button className="primary" onClick={() => createDesign(vehicle.model)}>이 차량으로 내 공간 설계하기</button>
        </section>
      )}

      {design?.proposals?.[0] && (
        <section className="panel" id="result">
          <h2>3. 추천 설계안</h2>
          {design.customer_understanding?.summary && <p className="summary">{design.customer_understanding.summary}</p>}

          {design.proposals.slice(0, 1).map((p: any) => {
            const e = estimate(p);
            return (
              <article className="proposal" key={p.id}>
                <h3>{p.concept_name}</h3>
                <h2>{p.vehicle}</h2>
                <img src={p.image_url} alt={p.vehicle} />

                <div className="spec">
                  실제 제원: 전장 {p.spec?.length_mm} / 전폭 {p.spec?.width_mm} / 전고 {p.spec?.height_mm} / 휠베이스 {p.spec?.wheelbase_mm}mm
                </div>

                <h4>이렇게 쓰는 공간입니다</h4>
                <p>{p.layout_strategy}</p>

                <h4>공간 구성</h4>
                {p.zones?.map((z: any) => (
                  <div className="zone" key={z.name}>
                    <b>{z.name}</b>
                    <span>{z.fit_status}</span>
                    <p>{z.purpose}</p>
                  </div>
                ))}

                <h4>보여줘야 할 이미지</h4>
                <div className="views">
                  <div>외관 조감도 생성 필요</div>
                  <div>내부 투시도 생성 필요</div>
                  <div>제품 배치도 생성 필요</div>
                  <div>후면 적재 장면 생성 필요</div>
                </div>

                <h4>가상 예상 견적</h4>
                <div className="estimate">
                  <p>차량 기준가 <b>{money(e.base)}</b></p>
                  <p>내부 구성/제품 <b>{money(e.custom)}</b></p>
                  <p>시공/상담 예비비 <b>{money(e.labor)}</b></p>
                  <strong>총 예상 {money(e.total)}</strong>
                </div>

                <h4>견적 상담 요청</h4>
                <input placeholder="고객명" value={lead.name} onChange={ev => setLead({ ...lead, name: ev.target.value })} />
                <input placeholder="연락처" value={lead.phone} onChange={ev => setLead({ ...lead, phone: ev.target.value })} />
                <input placeholder="상담 희망 시간" value={lead.time} onChange={ev => setLead({ ...lead, time: ev.target.value })} />

                <button className="primary" onClick={() => requestLead(p)}>상봉기아 견적 상담 요청</button>
              </article>
            );
          })}
        </section>
      )}

      <style jsx>{`
        .page{min-height:100vh;background:#f4faf4;padding:18px;font-family:Arial,sans-serif;color:#111}
        .hero,.panel{background:#fff;border:1px solid #d8ebd8;border-radius:24px;padding:20px;margin-bottom:18px;box-shadow:0 12px 30px rgba(0,0,0,.04)}
        .hero{background:linear-gradient(135deg,#e9f8ec,#fff)}
        .hero b,.hero h1{color:#14532d}
        .hero h1{font-size:34px;line-height:1.15;margin:10px 0;letter-spacing:-.04em}
        h2{font-size:25px;margin:0 0 12px}
        p{line-height:1.55}
        .starters,.cars,.views{display:grid;gap:12px}
        .starters button,.question button{border:1px solid #d8ebd8;background:#fff;border-radius:14px;padding:14px;text-align:left;font-size:16px}
        .question{background:#f1f8f1;border-radius:18px;padding:14px;margin:14px 0}
        .question div{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
        textarea,input{width:100%;box-sizing:border-box;border:1px solid #d8ebd8;border-radius:16px;padding:16px;font-size:17px;margin-top:10px}
        textarea{min-height:150px;line-height:1.6}
        .primary{width:100%;border:0;border-radius:16px;background:#137333;color:#fff;font-size:18px;font-weight:900;padding:18px;margin-top:14px}
        .car,.proposal,.zone{border:1px solid #d8ebd8;border-radius:18px;padding:14px;background:#fff}
        .car{cursor:pointer}
        .car.on{border:3px solid #137333;background:#f0f8f0}
        .top{display:flex;justify-content:space-between;align-items:center;gap:8px}
        .top h3{margin:0}
        .top span{background:#137333;color:#fff;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900}
        img{width:100%;height:220px;object-fit:contain;background:#f2f6f2;border-radius:14px;margin:12px 0}
        .spec,.summary,.estimate{background:#f1f8f1;border-radius:14px;padding:12px;line-height:1.5;margin:10px 0}
        .car button{width:100%;border:0;background:#137333;color:#fff;border-radius:14px;padding:13px;font-weight:900}
        .zone{margin-bottom:8px}
        .zone span{float:right;color:#137333;font-weight:900}
        .views div{background:#f1f8f1;border-radius:14px;padding:20px;text-align:center;font-weight:900;color:#14532d}
        .estimate p{display:flex;justify-content:space-between;border-bottom:1px solid #e1eee1;padding-bottom:8px}
        .estimate strong{display:block;font-size:22px;color:#137333;margin-top:12px}
        @media(min-width:900px){.page{max-width:1180px;margin:0 auto}.cars{grid-template-columns:repeat(3,1fr)}.starters{grid-template-columns:repeat(2,1fr)}.views{grid-template-columns:repeat(4,1fr)}}
      `}</style>
    </main>
  );
}
