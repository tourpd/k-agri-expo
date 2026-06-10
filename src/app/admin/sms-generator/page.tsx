"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function SmsGeneratorPage() {
  const [product, setProduct] = useState("");
  const [target, setTarget] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState("");

  function generate() {
    setResult(`
[문자 1 - 긴급형]
${target || "농가"}님, ${problem || "농사 고민"}은 보이면 늦을 수 있습니다.
${product || "제품"} 공동구매 안내드립니다.
자세히 보기: 링크

[문자 2 - 비교형]
옆집은 벌써 준비했습니다.
${problem || "문제"} 대응, 지금이 중요합니다.
${product || "제품"} 상담 신청: 링크

[문자 3 - 친근형]
안녕하세요. 한국농수산TV입니다.
${target || "농가"}를 위한 ${product || "제품"} 안내드립니다.
필요하시면 아래 링크로 확인하세요.
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/sales-automation" className="font-black text-green-700">
          ← AI 판매자동화센터
        </Link>

        <section className="mt-6 rounded-3xl bg-blue-800 p-8 text-white">
          <h1 className="text-5xl font-black">AI 문자 생성기</h1>
          <p className="mt-4 text-2xl font-bold">농민에게 바로 보낼 문자 문구를 만듭니다.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="제품명" className="w-full rounded-2xl border p-5 text-xl font-bold" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="타겟 고객" className="mt-5 w-full rounded-2xl border p-5 text-xl font-bold" />
          <input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="고객 고민" className="mt-5 w-full rounded-2xl border p-5 text-xl font-bold" />
          <button onClick={generate} className="mt-6 w-full rounded-3xl bg-blue-700 py-6 text-3xl font-black text-white">문자 생성하기</button>
        </section>

        {result && <pre className="mt-8 whitespace-pre-wrap rounded-3xl bg-white p-8 text-xl font-bold shadow-xl">{result}</pre>}
      </div>
    </main>
  );
}
