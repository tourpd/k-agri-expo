import Link from "next/link";

export default function CampaignCenterPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6">
      <div className="mx-auto max-w-7xl space-y-8">

        <Link
          href="/admin/creator-center"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← AI 크리에이터센터
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-green-900 to-green-500 p-8 text-white">
          <h1 className="text-5xl font-black">
            AI 브랜드 캠페인 센터
          </h1>

          <p className="mt-4 text-2xl font-bold">
            제품 + 예산 + 목표를 입력하면
            AI가 크리에이터 매칭부터 캠페인 제안서까지 생성합니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">
            캠페인 생성
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <input
              className="rounded-2xl border p-4 text-xl"
              placeholder="브랜드명"
            />

            <input
              className="rounded-2xl border p-4 text-xl"
              placeholder="제품명"
            />

            <input
              className="rounded-2xl border p-4 text-xl"
              placeholder="광고 예산"
            />

            <input
              className="rounded-2xl border p-4 text-xl"
              placeholder="목표 국가"
            />

          </div>

          <button
            className="mt-6 rounded-2xl bg-green-700 px-8 py-4 text-xl font-black text-white"
          >
            AI 캠페인 생성
          </button>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">
            추천 크리에이터
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <CreatorCard
              name="48kcal"
              score="94"
              category="뷰티"
            />

            <CreatorCard
              name="농부김씨"
              score="91"
              category="농업"
            />

            <CreatorCard
              name="Global Food"
              score="88"
              category="푸드"
            />

          </div>
        </section>

      </div>
    </main>
  );
}

function CreatorCard({
  name,
  score,
  category,
}: {
  name: string;
  score: string;
  category: string;
}) {
  return (
    <div className="rounded-3xl border p-6">
      <h3 className="text-3xl font-black">{name}</h3>
      <p className="mt-2 text-xl">{category}</p>
      <p className="mt-4 text-4xl font-black text-green-700">
        {score}점
      </p>
    </div>
  );
}
