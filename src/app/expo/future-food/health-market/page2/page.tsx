import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HealthMarketPage2() {
  return (
    <main className="min-h-screen bg-white p-2 text-black">
      <div className="w-full">

        <Link
          href="/expo/future-food/health-market"
          className="ml-4 mt-2 inline-block font-black text-green-700"
        >
          ← 이전 페이지
        </Link>

        <h1 className="mb-6 mt-4 text-center text-3xl font-black md:text-5xl">
          미래단백질 프로젝트 전체 생태계
        </h1>

        <section className="w-full">
          <img
            src="/images/protein-ecosystem-full.png"
            alt="미래단백질 프로젝트 전체 생태계"
            className="w-full"
          />
        </section>

      </div>
    </main>
  );
}