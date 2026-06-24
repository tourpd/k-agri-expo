"use client";

import { useState } from "react";
import { farmerDecisionEngine } from "@/lib/expo/farmerDecisionEngine";

export default function FarmerDecisionHero() {
  const [crop, setCrop] = useState("");
  const [result, setResult] = useState<any>(null);

  const analyze = (e: any) => {
    e.preventDefault(); // 🔥 핵심 (버튼 안 먹던 이유)
    const res = farmerDecisionEngine(crop);
    setResult(res);
  };

  return (
    <section className="mx-auto my-6 max-w-4xl rounded-2xl border bg-white px-6 py-8 shadow-md">
      <h2 className="text-center text-3xl font-black md:text-5xl">
        농부님, 오늘 <span className="text-green-700">출하 판단</span>
      </h2>

      <form onSubmit={analyze} className="mt-6 flex gap-2">
        <input
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="예: 오이, 양파, 마늘"
          className="flex-1 rounded-full border px-4 py-3 text-lg font-black"
        />

        <button
          type="submit"
          className="rounded-full bg-green-700 px-6 py-3 font-black text-white"
        >
          확인
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border p-5">
          <div className="text-xl font-black">
            {result.decision === "SELL" && "🔥 지금 출하"}
            {result.decision === "HOLD" && "⏳ 대기"}
            {result.decision === "WAIT" && "📊 관망"}
            {result.decision === "RISK" && "⚠️ 위험"}
          </div>

          <div className="mt-2 text-gray-600">
            {result.message}
          </div>

          <div className="mt-3 text-sm text-gray-400">
            위험도: {result.risk} / 100
          </div>
        </div>
      )}
    </section>
  );
}
