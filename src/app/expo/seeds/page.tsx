const breakingNews = [
  "고추 종자 문의 증가",
  "병에 강한 품종 관심 상승",
  "모종 준비 전 종자 선택 중요",
];

const weeklyNews = [
  {
    title: "올해 뜨는 고추 품종 5선",
    summary: "병에 강하고 수량이 안정적인 품종 중심으로 관심이 모입니다.",
  },
  {
    title: "12~1월 모종 준비 전에 꼭 볼 종자 정보",
    summary: "종자 선택이 올해 작황과 수익률을 좌우합니다.",
  },
  {
    title: "농민들이 많이 찾는 고추 종자 흐름",
    summary: "내병성과 상품성 중심으로 선택이 이동하고 있습니다.",
  },
];

const hotSeeds = ["고추", "토마토", "오이", "배추", "상추", "완두"];
const seedVideos = [
  "올해 고추 종자 추천 TOP5",
  "병에 강한 종자 고르는 기준",
  "모종 만들기 전 꼭 알아야 할 것",
];

const vendors = ["종자회사 A", "종자회사 B", "육묘 전문 업체", "프리미엄 종자 부스"];

export default function SeedsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-br from-lime-900 via-green-900 to-emerald-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="text-sm font-extrabold text-lime-200">🌱 Seeds Hall</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              종자관
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              시기별 인기 종자, 품종 뉴스, 파종 전 꼭 봐야 할 정보와 관련 업체를 한 곳에 모았습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-red-600">🚨 종자 속보</div>
          <div className="mt-4 space-y-3">
            {breakingNews.map((item) => (
              <div key={item} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-emerald-700">이번주 종자 뉴스</div>
          <div className="mt-4 space-y-4">
            {weeklyNews.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-emerald-700">🔥 인기 종자</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {hotSeeds.map((item) => (
              <span key={item} className="rounded-full bg-lime-100 px-4 py-2 text-sm font-bold text-lime-900">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-emerald-700">🎥 종자 리뷰 영상</div>
          <div className="mt-4 space-y-3">
            {seedVideos.map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-emerald-700">🏢 참여 업체</div>
          <div className="mt-4 space-y-3">
            {vendors.map((item) => (
              <a
                key={item}
                href="/booth"
                className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-lime-50"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}