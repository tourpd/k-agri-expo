"use client";

import { useState } from "react";

type Result = {
  status: string;
  decision: string;
  recommendation: string;
};

export default function FarmerChoiceEngine() {
  const [crop, setCrop] = useState("");
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const analyze = () => {
    let status = "";
    let decision = "";
    let recommendation = "";

    if (crop.includes("마늘") && situation.includes("하락")) {
      status = "가격 하락 초기";
      decision = "보유 vs 일부 판매";
      recommendation = "70% 보유 추천";
    } else if (crop.includes("양파") && situation.includes("상승")) {
      status = "가격 상승 중";
      decision = "판매 고려";
      recommendation = "지금 일부 판매 추천";
    } else if (crop.includes("고추")) {
      status = "변동성 높음";
      decision = "관망";
      recommendation = "1~2주 대기 추천";
    } else {
      status = "데이터 부족";
      decision = "분석 필요";
      recommendation = "추가 정보 입력 필요";
    }

    setResult({ status, decision, recommendation });
  };

  return (
    <section style={{ padding: 20, maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="작물"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
        />

        <input
          placeholder="상황"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        />

        <button onClick={analyze}>
          분석 시작
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 24 }}>
          <div>{result.status}</div>
          <div>{result.decision}</div>
          <div>{result.recommendation}</div>
        </div>
      )}
    </section>
  );
}
