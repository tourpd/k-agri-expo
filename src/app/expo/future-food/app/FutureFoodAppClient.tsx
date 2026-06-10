"use client";

import Link from "next/link";

export default function FutureFoodAppClient() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] px-5 py-6 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/expo/future-food" className="font-black text-green-700">
          ← 미래식량관
        </Link>

        <section className="mt-4 rounded-[32px] bg-green-900 p-8 text-white">
          <div className="text-sm font-black text-lime-200">
            KFFR FUTURE FOOD APP
          </div>
          <h1 className="mt-3 text-5xl font-black leading-tight">
            당신에게 맞는
            <br />
            미래농업을 찾아드립니다
          </h1>
          <p className="mt-5 text-xl font-black">
            고민을 선택하면 설명회, 교육, 상담 방향을 안내합니다.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            "농사하며 월급 만들기",
            "아들에게 농장 물려주기",
            "치유농업으로 돈 벌기",
            "스마트 사육농장 시작하기",
            "청년농 100 프로젝트",
            "근감소·기억력 시장 보기",
            "미래농업 정착마을",
          ].map((item) => (
            <button
              key={item}
              className="rounded-2xl border bg-white p-5 text-left text-2xl font-black shadow-sm"
            >
              {item}
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
