import Link from "next/link";

export const dynamic = "force-dynamic";

const creators = [
  {
    id: "48kcal",
    name: "48kcal",
    country: "Korea",
    platform: "Instagram",
    followers: 20900,
    growth: "+20.9K / 8개월",
    engagement: "높음",
    category: "다이어트·뷰티·라이프스타일",
    score: 91,
    investment: "Seed 후보",
  },
  {
    id: "global-food-01",
    name: "Global Food Creator",
    country: "Japan",
    platform: "TikTok",
    followers: 48000,
    growth: "+12K / 3개월",
    engagement: "중상",
    category: "푸드·여행·리뷰",
    score: 88,
    investment: "관찰",
  },
  {
    id: "beauty-asia-01",
    name: "Asia Beauty Creator",
    country: "Thailand",
    platform: "Instagram",
    followers: 76000,
    growth: "+31K / 6개월",
    engagement: "높음",
    category: "뷰티·패션",
    score: 90,
    investment: "Seed 후보",
  },
];

export default function CreatorDiscoveryPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <Link href="/admin/creator-center" className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
          ← AI 크리에이터센터
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-purple-950 via-purple-800 to-green-700 p-8 text-white shadow-xl">
          <p className="text-lg font-black text-purple-100">Creator Discovery Engine</p>
          <h1 className="mt-3 text-5xl font-black">전 세계 유망 크리에이터 발굴센터</h1>
          <p className="mt-4 text-2xl font-bold text-purple-50">
            성장률, 참여율, 분야, 국가, 투자 가능성을 기준으로 크리에이터를 발굴합니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-4xl font-black">발굴 리스트</h2>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-purple-700 px-5 py-3 text-xl font-black text-white">인스타</button>
              <button className="rounded-2xl bg-stone-200 px-5 py-3 text-xl font-black text-black">유튜브</button>
              <button className="rounded-2xl bg-stone-200 px-5 py-3 text-xl font-black text-black">틱톡</button>
              <button className="rounded-2xl bg-green-700 px-5 py-3 text-xl font-black text-white">투자후보</button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1300px] border-collapse text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-4 text-lg">크리에이터</th>
                  <th className="p-4 text-lg">국가</th>
                  <th className="p-4 text-lg">플랫폼</th>
                  <th className="p-4 text-lg">팔로워</th>
                  <th className="p-4 text-lg">성장률</th>
                  <th className="p-4 text-lg">참여율</th>
                  <th className="p-4 text-lg">분야</th>
                  <th className="p-4 text-lg">AI 점수</th>
                  <th className="p-4 text-lg">투자판정</th>
                  <th className="p-4 text-lg">관리</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.id} className="border-b-2 border-stone-200 hover:bg-purple-50">
                    <td className="p-4 text-xl font-black">{c.name}</td>
                    <td className="p-4 text-lg font-bold">{c.country}</td>
                    <td className="p-4 text-lg font-bold">{c.platform}</td>
                    <td className="p-4 text-lg font-bold">{c.followers.toLocaleString()}</td>
                    <td className="p-4 text-lg font-bold text-green-700">{c.growth}</td>
                    <td className="p-4 text-lg font-bold">{c.engagement}</td>
                    <td className="p-4 text-lg font-bold">{c.category}</td>
                    <td className="p-4 text-2xl font-black text-purple-700">{c.score}</td>
                    <td className="p-4 text-lg font-black text-red-700">{c.investment}</td>
                    <td className="p-4">
                      <Link href={`/admin/creator-center/profile/${c.id}`} className="rounded-xl bg-black px-4 py-3 font-black text-white">
                        분석
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
