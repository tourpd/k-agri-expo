import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HealthMarketPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <Link href="/expo/future-food" className="font-black text-green-700">
          ← 미래식량관
        </Link>

        <h1 className="mt-6 text-5xl font-black">미래단백질 건강산업</h1>

        <p className="mt-4 text-xl font-bold leading-9 text-neutral-700">
          한미양행의 15년 곤충 연구기술력과 KFFR 미래농업 네트워크가 만나
          농민의 소득과 국민 건강을 연결합니다.
        </p>

        <section className="mt-10">
          <img
            src="/images/protein-ecosystem-page2.png"
            alt="미래단백질 건강산업"
            className="w-full rounded-3xl border shadow-xl"
          />
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/expo/future-food/health-market/page2"
            className="inline-flex rounded-3xl bg-green-700 px-10 py-5 text-2xl font-black text-white shadow-lg"
          >
            다음 페이지 보기 →
          </Link>
        </div>
      </div>
    </main>
  );
}