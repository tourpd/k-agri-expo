"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function PestPredictorPage() {
  const [crop, setCrop] = useState("");
  const [region, setRegion] = useState("");
  const [weather, setWeather] = useState("");
  const [result, setResult] = useState("");

  function predict() {
    setResult(`
병해충 예측 결과

작물: ${crop || "미입력"}
지역: ${region || "미입력"}
날씨/상황: ${weather || "미입력"}

1. 위험 가능성
- 고온다습, 장마 전후, 밀식, 통풍 불량이면 병해충 위험이 커집니다.

2. 선제 광고 타이밍
- 발생 후 광고가 아니라 2주~1달 전부터 예방 메시지를 띄웁니다.

3. 농민용 메시지
"보이면 늦습니다. 지금 준비해야 피해를 줄입니다."

4. 연결 메뉴
- 광고문구 생성
- 쇼츠 생성
- 문자 발송
- 공동구매 생성
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/sales-automation" className="font-black text-green-700">
          ← AI 판매자동화센터
        </Link>

        <section className="mt-6 rounded-3xl bg-red-800 p-8 text-white">
          <h1 className="text-5xl font-black">병해충 예측센터</h1>
          <p className="mt-4 text-2xl font-bold">발생 후가 아니라 미리 광고하고 미리 판매합니다.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="작물" className="w-full rounded-2xl border p-5 text-xl font-bold" />
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역" className="mt-5 w-full rounded-2xl border p-5 text-xl font-bold" />
          <textarea value={weather} onChange={(e) => setWeather(e.target.value)} rows={5} placeholder="날씨, 병해충 상황, 농가 메모" className="mt-5 w-full rounded-2xl border p-5 text-xl font-bold" />
          <button onClick={predict} className="mt-6 w-full rounded-3xl bg-red-700 py-6 text-3xl font-black text-white">예측하기</button>
        </section>

        {result && <pre className="mt-8 whitespace-pre-wrap rounded-3xl bg-white p-8 text-xl font-bold shadow-xl">{result}</pre>}
      </div>
    </main>
  );
}
