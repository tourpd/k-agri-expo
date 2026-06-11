import Link from "next/link";

export const dynamic = "force-dynamic";

const creators = [
  {
    name: "48kcal",
    platform: "Instagram",
    followers: 20900,
    category: "뷰티·다이어트",
    score: 94,
  },
  {
    name: "농부김씨",
    platform: "YouTube",
    followers: 58000,
    category: "농업",
    score: 91,
  },
];

const brands = [
  { name: "한미양행", product: "건강식품", match: 94 },
  { name: "KFFR", product: "미래식량", match: 92 },
  { name: "한국농자재", product: "켈팍", match: 88 },
  { name: "도프", product: "스피드파워", match: 85 },
];

export default function BrandMatchingPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/admin/creator-center"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← AI 크리에이터센터
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-green-900 via-green-700 to-green-500 p-8 text-white shadow-xl">
          <h1 className="text-5xl font-black">AI 브랜드 매칭센터</h1>
          <p className="mt-4 text-2xl font-bold">
            제품 · 브랜드 · 크리에이터를 AI가 자동 연결합니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">크리에이터 리스트</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {creators.map((creator) => (
              <div key={creator.name} className="rounded-3xl border-2 border-black p-6">
                <h3 className="text-3xl font-black">{creator.name}</h3>
                <p className="mt-2 text-xl font-bold">{creator.platform}</p>
                <p className="mt-1 text-xl">팔로워 {creator.followers.toLocaleString()}명</p>
                <p className="mt-1 text-xl">{creator.category}</p>
                <p className="mt-3 text-2xl font-black text-green-700">
                  AI 점수 {creator.score}점
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">추천 브랜드 매칭</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {brands.map((brand) => (
              <div key={brand.name} className="rounded-3xl border-2 border-green-700 p-6">
                <h3 className="text-3xl font-black">{brand.name}</h3>
                <p className="mt-2 text-xl font-bold">{brand.product}</p>
                <p className="mt-3 text-3xl font-black text-green-700">
                  적합도 {brand.match}점
                </p>
                <button className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-black text-white">
                  캠페인 생성
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
