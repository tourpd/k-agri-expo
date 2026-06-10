"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function VideoGeneratorPage() {
  const [product, setProduct] = useState("");
  const [scene, setScene] = useState("");
  const [result, setResult] = useState("");

  function generate() {
    setResult(`
Gemini / Veo 영상 프롬프트

9:16 vertical YouTube Shorts.
No subtitles.
No captions.
No text overlays.
No logos.

Korean rural commercial sitcom.
Product: ${product || "제품명"}
Scene: ${scene || "농촌 현장 문제 상황"}

A Korean farmer discovers a serious problem in the field.
The problem is shown visually first.
A funny rural character reacts.
The solution appears naturally at the end.
Photorealistic.
Natural sunlight.
8 seconds.
Clean video only.
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/sales-automation" className="font-black text-green-700">
          ← AI 판매자동화센터
        </Link>

        <section className="mt-6 rounded-3xl bg-black p-8 text-white">
          <h1 className="text-5xl font-black">AI 영상 생성기</h1>
          <p className="mt-4 text-2xl font-bold">Gemini/Veo용 9:16 쇼츠 프롬프트를 만듭니다.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="제품명" className="w-full rounded-2xl border p-5 text-xl font-bold" />
          <textarea value={scene} onChange={(e) => setScene(e.target.value)} rows={6} placeholder="영상 장면 설명" className="mt-5 w-full rounded-2xl border p-5 text-xl font-bold" />
          <button onClick={generate} className="mt-6 w-full rounded-3xl bg-black py-6 text-3xl font-black text-white">영상 프롬프트 생성</button>
        </section>

        {result && <pre className="mt-8 whitespace-pre-wrap rounded-3xl bg-white p-8 text-lg font-bold shadow-xl">{result}</pre>}
      </div>
    </main>
  );
}
