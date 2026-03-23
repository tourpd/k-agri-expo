const newProducts = [
  {
    title: "싹쓰리충 골드",
    desc: "친환경 해충 방제 솔루션으로 이번 달 주목받는 신제품",
  },
  {
    title: "메가파워칼",
    desc: "비대기 집중 관리용 고칼륨 자재로 빠르게 반응하는 제품",
  },
  {
    title: "신형 농업 장비",
    desc: "현장 효율을 높이는 신규 전시 품목",
  },
];

const newVideos = [
  "이달의 신제품 총정리",
  "한국농수산TV가 보는 이번 달 주목 제품",
  "현장에서 반응 오는 신제품 포인트",
];

const companies = ["도프", "신제품 참가 기업 A", "신제품 참가 기업 B"];

export default function NewProductsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="text-sm font-extrabold text-yellow-200">⭐ New Products Hall</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              이달의 신제품관
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              이번 달 새로 나온 제품과 기술을 가장 먼저 소개하는 전시관입니다. 박람회다운 분위기로
              신제품과 참여 기업을 연결합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {newProducts.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 shadow-lg"
            >
              <div className="text-sm font-extrabold text-orange-700">NEW</div>
              <h2 className="mt-3 text-xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.desc}</p>
              <button className="mt-5 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-bold text-white">
                자세히 보기
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-orange-700">🎥 신제품 영상</div>
          <div className="mt-4 space-y-3">
            {newVideos.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-orange-700">🏢 참여 기업</div>
          <div className="mt-4 space-y-3">
            {companies.map((item) => (
              <a
                key={item}
                href="/booth"
                className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-orange-50"
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