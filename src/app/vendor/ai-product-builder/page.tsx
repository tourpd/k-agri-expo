"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";

export default function AIProductBuilderPage() {
  const [product, setProduct] = useState("");
  const [memo, setMemo] = useState("");
  const [result, setResult] = useState("");

  function generate() {
    setResult(`
AI 상품 빌더 결과

제품명: ${product || "미입력"}

1. 상품 핵심
- 고객이 원하는 결과를 먼저 보여줘야 합니다.

2. 판매페이지 구조
문제 → 공감 → 해결 → 증거 → 가격 → 신청

3. 업체 준비자료
- 제품사진
- 카탈로그 PDF
- 유튜브 링크
- 가격/판매조건
- 금지 표현

4. 다음 단계
AI 판매자동화센터에서 광고, 쇼츠, 문자, 공동구매를 생성합니다.

메모:
${memo || "없음"}
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-green-800 p-8 text-white">
          <h1 className="text-5xl font-black">AI 상품 빌더</h1>
          <p className="mt-4 text-2xl font-bold">업체 상품을 판매 가능한 구조로 정리합니다.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="제품명" className="w-full rounded-2xl border p-5 text-xl font-bold" />
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={6} placeholder="제품 설명, 업체 메모, 가격, 특징" className="mt-5 w-full rounded-2xl border p-5 text-xl font-bold" />
          <button onClick={generate} className="mt-6 w-full rounded-3xl bg-green-700 py-6 text-3xl font-black text-white">상품 구조 만들기</button>
        </section>

        {result && <pre className="mt-8 whitespace-pre-wrap rounded-3xl bg-white p-8 text-xl font-bold shadow-xl">{result}</pre>}
      </div>
    </main>
  );
}
