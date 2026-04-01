const breakingNews = [
  "충남 총채벌레 증가",
  "노균병 발생 문의 급증",
  "비대기 자재 수요 상승",
];

const weeklyNews = [
  {
    title: "총채벌레 초기 방제 타이밍 놓치면 생기는 일",
    summary: "초기 대응이 늦어질수록 방제 비용과 피해 규모가 커집니다.",
  },
  {
    title: "월동작물 추비 대신 해야 안 망하는 법",
    summary: "무조건 추비보다 생육 상태와 지온을 보고 대응해야 합니다.",
  },
  {
    title: "비대기 자재 선택에서 농민들이 가장 많이 헷갈리는 것",
    summary: "칼륨, 칼슘, 미량요소의 역할을 구분해서 접근해야 합니다.",
  },
];

const solutions = ["총채벌레 해결", "노균병 해결", "비대 불량 해결", "활착 회복", "칼슘 결핍"];
const hotProducts = ["싹쓰리충", "멸규니", "멀티피드", "켈팍", "메가파워칼"];
const vendors = ["도프", "친환경 자재 업체", "비료 전문 부스", "방제 솔루션 부스"];

export default function AgriInputsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="text-sm font-extrabold text-emerald-200">🧪 Agri Inputs Hall</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              농자재관
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              병해충, 생육, 비대, 활착 문제를 해결하는 자재와 솔루션, 관련 업체를 한 번에 확인하는 전시관입니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-red-600">🚨 농자재 속보</div>
          <div className="mt-4 space-y-3">
            {breakingNews.map((item) => (
              <div key={item} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-emerald-700">이번주 농자재 뉴스</div>
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
          <div className="text-sm font-extrabold text-emerald-700">🧩 해결 솔루션</div>
          <div className="mt-4 grid gap-3">
            {solutions.map((item) => (
              <button
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <div className="text-sm font-extrabold text-emerald-700">🌾 인기 농자재</div>
          <div className="mt-4 space-y-3">
            {hotProducts.map((item, idx) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
              >
                <span>{idx + 1}</span>
                <span>{item}</span>
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
                className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-emerald-50"
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