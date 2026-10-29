"use client";

import { useState } from "react";

const LIFE = [
  "아내와 전국 여행하며 차박하고 싶다",
  "유튜브 촬영하며 전국을 돌아다니고 싶다",
  "농장과 캠핑을 함께 하고 싶다",
  "낚시와 차박을 동시에 하고 싶다",
  "이동식 사무실이 필요하다",
  "커피차를 운영하고 싶다",
  "나만의 이동 스튜디오가 필요하다",
];

const SPACE = [
  "촬영·편집 중심형",
  "차박·캠핑 중심형",
  "업무·사무실 중심형",
  "멀티 플렉스형",
];

export default function Page() {
  const [step, setStep] = useState(1);
  const [life, setLife] = useState("");
  const [custom, setCustom] = useState("");
  const [space, setSpace] = useState("");
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const selectedLife = custom || life;

  async function run(nextStep: number) {
    setLoading(true);
    const res = await fetch("/api/ai-garage/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ life: selectedLife, space }),
    });
    const data = await res.json();
    setDesign(data.design);
    setLoading(false);
    setStep(nextStep);
  }

  return (
    <main className="page">
      <header>
        <div>
          <h1>K-AGRI AI Garage</h1>
          <p>당신의 삶을 PV5로 설계합니다.</p>
        </div>
      </header>

      {step === 1 && (
        <section className="card">
          <span className="badge">STEP 1</span>
          <h2>어떤 삶을 살고 싶으신가요?</h2>
          <p className="desc">차종 몰라도 됩니다. 원하는 생활을 고르세요.</p>

          <div className="list">
            {LIFE.map((x) => (
              <button key={x} onClick={() => setLife(x)} className={life === x ? "on" : ""}>
                {x}
              </button>
            ))}
          </div>

          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="직접 작성하기"
          />

          <button className="primary" disabled={!selectedLife || loading} onClick={() => run(2)}>
            {loading ? "분석 중..." : "다음"}
          </button>
        </section>
      )}

      {step === 2 && design && (
        <section className="card">
          <span className="badge">STEP 2</span>
          <h2>당신은</h2>
          <h3 className="concept">“{design.concept}”</h3>
          <p className="desc">{design.summary}</p>

          <div className="resultBox">
            <small>추천 차량</small>
            <strong>{design.vehicle}</strong>
          </div>

          <div className="chips">
            {design.modules?.slice(0, 5).map((m: string) => (
              <span key={m}>✓ {m}</span>
            ))}
          </div>

          <button className="primary" onClick={() => setStep(3)}>
            실내공간 선택하기
          </button>

          <button className="ghost" onClick={() => setStep(1)}>
            이전으로
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="card">
          <span className="badge">STEP 3</span>
          <h2>어떤 실내공간이 필요하신가요?</h2>
          <p className="desc">가장 중요한 공간 하나를 선택하세요.</p>

          <div className="list">
            {SPACE.map((x) => (
              <button key={x} onClick={() => setSpace(x)} className={space === x ? "on" : ""}>
                {x}
              </button>
            ))}
          </div>

          <button className="primary" disabled={!space || loading} onClick={() => run(4)}>
            {loading ? "설계 중..." : "내 PV5 설계 보기"}
          </button>

          <button className="ghost" onClick={() => setStep(2)}>
            이전으로
          </button>
        </section>
      )}

      {step === 4 && design && (
        <section className="card final">
          <span className="badge">STEP 4</span>
          <h2>당신만의 PV5 설계안</h2>

          <div className="resultBox">
            <small>라이프스타일</small>
            <strong>{design.concept}</strong>
          </div>

          <div className="resultBox">
            <small>추천 차량</small>
            <strong>{design.vehicle}</strong>
          </div>

          <h3>핵심 구성</h3>
          <div className="moduleList">
            {design.modules?.map((m: string) => (
              <div key={m}>{m}</div>
            ))}
          </div>

          <h3>예상 견적</h3>
          <div className="quote">
            <Line k="차량 가격" v={design.estimate?.vehiclePrice} />
            <Line k="개조/옵션 비용" v={design.estimate?.optionPrice} />
            <Line k="시공비" v={design.estimate?.installPrice} />
            <Line k="총 예상 금액" v={design.estimate?.total} total />
            <p>예상 제작 기간: {design.estimate?.buildTime || "4~6주"}</p>
          </div>

          <div className="notice">
            실제 차량 이미지와 실내 렌더링은 다음 단계에서 이미지 생성 API 또는 실제 촬영 이미지 DB와 연결합니다.
          </div>

          <button className="primary">이 설계로 상담 예약하기</button>
          <button className="ghost" onClick={() => setStep(1)}>
            다시 설계하기
          </button>
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f6faf6;
          font-family: Arial, sans-serif;
          color: #111;
          padding-bottom: 32px;
        }

        header {
          background: #fff;
          padding: 18px 18px 14px;
          border-bottom: 1px solid #e5eee5;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        h1 {
          margin: 0;
          font-size: 22px;
          color: #14532d;
        }

        header p {
          margin: 6px 0 0;
          font-size: 13px;
        }

        .card {
          margin: 14px;
          background: #fff;
          border: 1px solid #dcebdc;
          border-radius: 22px;
          padding: 22px 18px;
          box-shadow: 0 12px 32px rgba(0,0,0,.04);
        }

        .badge {
          display: inline-block;
          background: #2f8f4e;
          color: #fff;
          padding: 7px 13px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        h2 {
          margin: 0 0 10px;
          font-size: 25px;
          line-height: 1.25;
        }

        .desc {
          color: #444;
          font-size: 15px;
          line-height: 1.55;
        }

        .list {
          display: grid;
          gap: 10px;
          margin: 18px 0;
        }

        .list button {
          width: 100%;
          border: 1px solid #dcebdc;
          background: #fff;
          border-radius: 15px;
          padding: 16px;
          text-align: left;
          font-size: 15px;
          line-height: 1.4;
        }

        .list button.on {
          border: 2px solid #137333;
          background: #eef8ee;
          font-weight: 900;
        }

        textarea {
          width: 100%;
          min-height: 92px;
          border: 1px solid #dcebdc;
          border-radius: 15px;
          padding: 15px;
          font-size: 15px;
          line-height: 1.5;
          box-sizing: border-box;
        }

        .primary {
          width: 100%;
          min-height: 54px;
          border: 0;
          border-radius: 16px;
          background: #137333;
          color: #fff;
          font-size: 17px;
          font-weight: 900;
          margin-top: 16px;
        }

        .primary:disabled {
          opacity: .45;
        }

        .ghost {
          width: 100%;
          min-height: 50px;
          border: 1px solid #137333;
          border-radius: 16px;
          background: #fff;
          color: #137333;
          font-size: 16px;
          font-weight: 900;
          margin-top: 10px;
        }

        .concept {
          font-size: 30px;
          color: #137333;
          margin: 6px 0 16px;
          line-height: 1.25;
        }

        .resultBox {
          background: #f1f8f1;
          border-radius: 18px;
          padding: 18px;
          display: grid;
          gap: 8px;
          margin: 14px 0;
        }

        .resultBox small {
          color: #14532d;
          font-weight: 900;
        }

        .resultBox strong {
          font-size: 24px;
        }

        .chips {
          display: grid;
          gap: 9px;
          margin-top: 18px;
        }

        .chips span {
          background: #f6faf6;
          border: 1px solid #dcebdc;
          border-radius: 14px;
          padding: 13px;
          font-weight: 800;
        }

        .moduleList {
          display: grid;
          gap: 9px;
          margin: 12px 0 22px;
        }

        .moduleList div {
          padding: 14px;
          border: 1px solid #dcebdc;
          border-radius: 14px;
          background: #fff;
          font-weight: 800;
        }

        .quote {
          border: 1px solid #dcebdc;
          border-radius: 18px;
          padding: 16px;
          background: #fff;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid #eee;
          gap: 12px;
        }

        .row b {
          text-align: right;
        }

        .total {
          color: #137333;
          font-size: 19px;
        }

        .notice {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 16px;
          padding: 15px;
          line-height: 1.5;
          margin-top: 18px;
          color: #7c2d12;
          font-weight: 800;
        }

        @media (min-width: 769px) {
          .card {
            max-width: 520px;
            margin: 40px auto;
          }
        }
      `}</style>
    </main>
  );
}

function Line({ k, v, total }: any) {
  return (
    <div className="row">
      <span>{k}</span>
      <b className={total ? "total" : ""}>{Number(v || 0).toLocaleString()}원</b>
    </div>
  );
}
