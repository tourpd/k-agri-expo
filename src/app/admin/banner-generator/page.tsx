"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function BannerGeneratorPage() {
  const [product, setProduct] = useState("");
  const [problem, setProblem] = useState("");
  const [benefit, setBenefit] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState("");

  function generateBanner() {
    const mainProduct = product || "제품명";
    const mainProblem = problem || "고객 고민";
    const mainBenefit = benefit || "핵심 효과";

    setResult(`
━━━━━━━━━━━━━━━━━━
AI 배너 문구 생성 결과
━━━━━━━━━━━━━━━━━━

[긴급형]
${mainProblem}
지금 준비해야 합니다
${mainProduct}

[혜택형]
${mainBenefit}
농민이 먼저 찾는 이유
${mainProduct}

[공동구매형]
한정 수량 공동구매
${mainProduct}
${price || "특가 진행중"}

[비교형]
옆집은 벌써 준비했습니다
차이는 ${mainProduct}에서 시작됩니다

[CTA]
지금 상담하기
공동구매 신청하기
자세히 보기
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/sales-automation" className="text-lg font-black text-green-700">
          ← AI 판매자동화센터
        </Link>

        <section className="mt-6 rounded-3xl bg-gradient-to-r from-orange-700 to-yellow-500 p-8 text-white shadow-2xl">
          <h1 className="text-5xl font-black">AI 배너 생성기</h1>
          <p className="mt-4 text-2xl font-bold">
            제품 배너 · 공동구매 배너 · 쇼츠 썸네일 문구를 생성합니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="제품명" value={product} onChange={setProduct} placeholder="예: 싹쓰리충" />
            <Input label="고객 고민" value={problem} onChange={setProblem} placeholder="예: 총채벌레, 탄저병" />
            <Input label="핵심 효과" value={benefit} onChange={setBenefit} placeholder="예: 병해충 예방, 품질 향상" />
            <Input label="가격/조건" value={price} onChange={setPrice} placeholder="예: 25,000원 공동구매" />
          </div>

          <button
            onClick={generateBanner}
            className="mt-8 w-full rounded-3xl bg-orange-600 py-6 text-3xl font-black text-white"
          >
            배너 문구 생성하기
          </button>
        </section>

        {result ? (
          <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-4xl font-black">생성 결과</h2>
            <pre className="mt-6 whitespace-pre-wrap rounded-3xl bg-stone-100 p-6 text-xl font-bold">
              {result}
            </pre>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-xl font-black">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-300 px-5 py-5 text-xl font-bold"
      />
    </label>
  );
}
