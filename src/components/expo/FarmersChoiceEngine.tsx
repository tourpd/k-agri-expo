"use client";

import { useState } from "react";
import { calculateFarmerScore } from "@/lib/engine/farmer-score";

export default function FarmerChoiceEngine() {
  const [crop, setCrop] = useState("");
  const [region, setRegion] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState<any>(null);

  const run = () => {
    setResult(calculateFarmerScore({ crop, region, problem }));
  };

  return (
    <div style={{ padding: 20, marginTop: 20, background: "#fff", borderRadius: 16 }}>
      <h2>농민 선택 엔진 v1</h2>

      <input placeholder="작물" onChange={(e) => setCrop(e.target.value)} />
      <input placeholder="지역" onChange={(e) => setRegion(e.target.value)} />
      <input placeholder="문제" onChange={(e) => setProblem(e.target.value)} />

      <button onClick={run}>분석 실행</button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>등급: {result.level}</h3>
          <p>점수: {result.score}</p>
        </div>
      )}
    </div>
  );
}
